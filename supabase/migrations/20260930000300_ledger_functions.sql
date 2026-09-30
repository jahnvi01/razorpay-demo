-- Phase 1: the ledger. UD-07 add customer, UD-08 record udhaar, UD-09 oldest-first clearing,
-- UD-10 cash received, UD-11 home summary.
--
-- Allocation is a pure function of a customer's entries and payments: every change (new entry,
-- new payment, deleted payment) re-runs it for that customer under a row lock. Payments are applied
-- in time order to the oldest open entry first. Money left over is advance credit, and it is used
-- up automatically by the next entry.

-- An entry cleared by advance credit counts as paid when it was created, not before.
create or replace function public.sync_entry_from_allocations(p_entry_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_amount bigint;
  v_created timestamptz;
  v_allocated bigint;
  v_paid_at timestamptz;
begin
  select e.amount_paise, e.created_at into v_amount, v_created
    from public.credit_entries e where e.id = p_entry_id;
  if not found then
    return; -- entry deleted in the same statement (cascade)
  end if;

  select coalesce(sum(a.amount_paise), 0), max(p.received_at)
    into v_allocated, v_paid_at
    from public.allocations a
    join public.payments p on p.id = a.payment_id
   where a.entry_id = p_entry_id;

  if v_allocated > v_amount then
    raise exception 'Allocations (% paise) exceed entry amount (% paise)', v_allocated, v_amount
      using errcode = 'check_violation';
  end if;

  update public.credit_entries
     set remaining_paise = v_amount - v_allocated,
         status = case when v_allocated = v_amount then 'paid' else 'open' end,
         paid_at = case when v_allocated = v_amount then greatest(v_paid_at, v_created) else null end
   where id = p_entry_id;
end;
$$;

-- Takes the customer's row lock. Every ledger change calls this BEFORE writing anything: inserting a
-- payment or entry first would take a shared lock via the foreign key, and two callers upgrading
-- shared locks at the same time deadlock.
create function public.lock_customer(p_sandbox_id uuid, p_customer_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform 1 from public.customers
   where id = p_customer_id and sandbox_id = p_sandbox_id
   for update;
  if not found then
    raise exception 'customer not found' using errcode = 'no_data_found';
  end if;
end;
$$;

-- UD-09 Re-applies all of a customer's payments, oldest first. Returns the advance credit in paise.
create function public.reallocate_customer(p_sandbox_id uuid, p_customer_id uuid)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  v_payment record;
  v_entry record;
  v_left bigint;
  v_take bigint;
  v_advance bigint := 0;
  v_remaining jsonb := '{}'::jsonb;
begin
  perform public.lock_customer(p_sandbox_id, p_customer_id);

  delete from public.allocations where customer_id = p_customer_id and sandbox_id = p_sandbox_id;

  for v_entry in
    select id, amount_paise from public.credit_entries
     where customer_id = p_customer_id and sandbox_id = p_sandbox_id
  loop
    v_remaining := v_remaining || jsonb_build_object(v_entry.id::text, v_entry.amount_paise);
  end loop;

  for v_payment in
    select id, amount_paise from public.payments
     where customer_id = p_customer_id and sandbox_id = p_sandbox_id
     order by received_at, created_at, id
  loop
    v_left := v_payment.amount_paise;
    for v_entry in
      select id from public.credit_entries
       where customer_id = p_customer_id and sandbox_id = p_sandbox_id
       order by created_at, id
    loop
      exit when v_left = 0;
      v_take := least(v_left, (v_remaining ->> v_entry.id::text)::bigint);
      continue when v_take = 0;
      insert into public.allocations (sandbox_id, customer_id, payment_id, entry_id, amount_paise)
      values (p_sandbox_id, p_customer_id, v_payment.id, v_entry.id, v_take);
      v_remaining := jsonb_set(v_remaining, array[v_entry.id::text],
                               to_jsonb((v_remaining ->> v_entry.id::text)::bigint - v_take));
      v_left := v_left - v_take;
    end loop;
    v_advance := v_advance + v_left;
  end loop;

  return v_advance;
end;
$$;

-- UD-07 Add a customer. Raises unique_violation (23505) on a duplicate phone in the sandbox.
create function public.create_customer(p_sandbox_id uuid, p_name text, p_phone text, p_language text)
returns uuid
language sql
set search_path = ''
as $$
  insert into public.customers (sandbox_id, name, phone, language)
  values (p_sandbox_id, btrim(p_name), p_phone, p_language)
  returning id;
$$;

-- UD-08 Record udhaar, for an existing customer (p_customer_id) or a new one (name, phone, language).
-- Everything happens in one transaction, and any advance credit is applied straight away.
create function public.create_entry(
  p_sandbox_id uuid,
  p_customer_id uuid,
  p_new_name text,
  p_new_phone text,
  p_new_language text,
  p_amount_paise bigint,
  p_due_date date,
  p_note text
)
returns table (customer_id uuid, entry_id uuid)
language plpgsql
set search_path = ''
as $$
declare
  v_customer uuid := p_customer_id;
  v_entry uuid;
begin
  if v_customer is null then
    v_customer := public.create_customer(p_sandbox_id, p_new_name, p_new_phone, coalesce(p_new_language, 'en'));
  else
    perform public.lock_customer(p_sandbox_id, v_customer);
  end if;

  insert into public.credit_entries (sandbox_id, customer_id, amount_paise, remaining_paise, due_date, note)
  values (p_sandbox_id, v_customer, p_amount_paise, p_amount_paise, p_due_date, nullif(btrim(p_note), ''))
  returning id into v_entry;

  perform public.reallocate_customer(p_sandbox_id, v_customer);
  return query select v_customer, v_entry;
end;
$$;

-- UD-10 Record a payment and clear oldest first. A Razorpay payment ID makes it idempotent.
-- Returns the payment ID and the customer's advance credit afterwards.
create function public.record_payment(
  p_sandbox_id uuid,
  p_customer_id uuid,
  p_amount_paise bigint,
  p_source text,
  p_razorpay_payment_id text default null
)
returns table (payment_id uuid, advance_paise bigint)
language plpgsql
set search_path = ''
as $$
declare
  v_payment uuid;
begin
  perform public.lock_customer(p_sandbox_id, p_customer_id);
  insert into public.payments (sandbox_id, customer_id, amount_paise, source, razorpay_payment_id)
  values (p_sandbox_id, p_customer_id, p_amount_paise, p_source, p_razorpay_payment_id)
  on conflict (razorpay_payment_id) do nothing
  returning id into v_payment;

  if v_payment is null then
    select p.id into v_payment from public.payments p where p.razorpay_payment_id = p_razorpay_payment_id;
  end if;

  return query select v_payment, public.reallocate_customer(p_sandbox_id, p_customer_id);
end;
$$;

-- UD-09 Delete a mistaken cash payment and re-run clearing. Online payments cannot be deleted.
create function public.delete_payment(p_sandbox_id uuid, p_payment_id uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_customer uuid;
begin
  select customer_id into v_customer from public.payments
   where id = p_payment_id and sandbox_id = p_sandbox_id and source = 'cash';
  if v_customer is null then
    raise exception 'cash payment not found' using errcode = 'no_data_found';
  end if;
  perform public.lock_customer(p_sandbox_id, v_customer);
  delete from public.payments where id = p_payment_id;
  perform public.reallocate_customer(p_sandbox_id, v_customer);
  return v_customer;
end;
$$;

-- UD-11 Home summary for one sandbox. Month bounds are passed in so the app decides the time zone (IST).
create function public.home_summary(p_sandbox_id uuid, p_from timestamptz, p_to timestamptz)
returns table (
  given_paise bigint,
  given_entries int,
  collected_paise bigint,
  remaining_paise bigint,
  customers_owing int,
  overdue_customers int
)
language sql
stable
set search_path = ''
as $$
  select
    (select coalesce(sum(amount_paise), 0) from public.credit_entries
      where sandbox_id = p_sandbox_id and created_at >= p_from and created_at < p_to)::bigint,
    (select count(*) from public.credit_entries
      where sandbox_id = p_sandbox_id and created_at >= p_from and created_at < p_to)::int,
    (select coalesce(sum(amount_paise), 0) from public.payments
      where sandbox_id = p_sandbox_id and received_at >= p_from and received_at < p_to)::bigint,
    (select coalesce(sum(remaining_paise), 0) from public.credit_entries
      where sandbox_id = p_sandbox_id and status = 'open')::bigint,
    (select count(distinct customer_id) from public.credit_entries
      where sandbox_id = p_sandbox_id and status = 'open')::int,
    (select count(distinct customer_id) from public.credit_entries
      where sandbox_id = p_sandbox_id and status = 'open'
        and due_date < (now() at time zone 'Asia/Kolkata')::date)::int;
$$;

-- Server only.
revoke execute on function public.lock_customer(uuid, uuid) from public, anon, authenticated;
grant execute on function public.lock_customer(uuid, uuid) to service_role;
revoke execute on function public.reallocate_customer(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.create_customer(uuid, text, text, text) from public, anon, authenticated;
revoke execute on function public.create_entry(uuid, uuid, text, text, text, bigint, date, text) from public, anon, authenticated;
revoke execute on function public.record_payment(uuid, uuid, bigint, text, text) from public, anon, authenticated;
revoke execute on function public.delete_payment(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.home_summary(uuid, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.reallocate_customer(uuid, uuid) to service_role;
grant execute on function public.create_customer(uuid, text, text, text) to service_role;
grant execute on function public.create_entry(uuid, uuid, text, text, text, bigint, date, text) to service_role;
grant execute on function public.record_payment(uuid, uuid, bigint, text, text) to service_role;
grant execute on function public.delete_payment(uuid, uuid) to service_role;
grant execute on function public.home_summary(uuid, timestamptz, timestamptz) to service_role;

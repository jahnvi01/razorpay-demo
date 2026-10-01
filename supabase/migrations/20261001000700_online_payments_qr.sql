-- Phase 3: UD-18 online payments clear udhaar, UD-19 shared QR match, UD-20 and UD-21 reminders.

-- UD-19 The UPI ID a payment came from. Used to recognise a customer paying on the shop QR.
alter table public.payments add column payer_vpa text check (payer_vpa is null or char_length(payer_vpa) <= 100);
create index payments_payer_vpa_idx on public.payments (sandbox_id, lower(payer_vpa)) where payer_vpa is not null;

-- UD-19 The merchant's shop QR (one per sandbox).
alter table public.sandboxes
  add column qr_code_id text unique,
  add column qr_image_url text;

-- UD-19 Payments on the shop QR wait here until the merchant says who paid (or that it was a sale).
create table public.qr_payments (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  razorpay_payment_id text not null unique,
  qr_code_id text not null,
  amount_paise bigint not null check (amount_paise > 0),
  payer_vpa text,
  received_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'matched', 'sale')),
  customer_id uuid,
  payment_id uuid references public.payments (id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (customer_id, sandbox_id) references public.customers (id, sandbox_id) on delete cascade,
  constraint matched_has_customer check ((status = 'matched') = (customer_id is not null))
);
create index qr_payments_pending_idx on public.qr_payments (sandbox_id, received_at desc) where status = 'pending';
alter table public.qr_payments enable row level security;
revoke all on public.qr_payments from anon, authenticated;

-- UD-18 record_payment now also stores the payer's UPI ID (and at what time it was received).
drop function public.record_payment(uuid, uuid, bigint, text, text);
create function public.record_payment(
  p_sandbox_id uuid,
  p_customer_id uuid,
  p_amount_paise bigint,
  p_source text,
  p_razorpay_payment_id text default null,
  p_payer_vpa text default null,
  p_received_at timestamptz default null
)
returns table (payment_id uuid, advance_paise bigint, created boolean)
language plpgsql
set search_path = ''
as $$
declare
  v_payment uuid;
  v_created boolean := true;
begin
  perform public.lock_customer(p_sandbox_id, p_customer_id);
  insert into public.payments (sandbox_id, customer_id, amount_paise, source, razorpay_payment_id, payer_vpa, received_at)
  values (p_sandbox_id, p_customer_id, p_amount_paise, p_source, p_razorpay_payment_id, nullif(lower(btrim(p_payer_vpa)), ''),
          coalesce(p_received_at, now()))
  on conflict (razorpay_payment_id) do nothing
  returning id into v_payment;

  if v_payment is null then
    v_created := false; -- already recorded (webhook retry or sync on open)
    select p.id into v_payment from public.payments p where p.razorpay_payment_id = p_razorpay_payment_id;
  end if;

  return query select v_payment, public.reallocate_customer(p_sandbox_id, p_customer_id), v_created;
end;
$$;

-- UD-19 Store a QR payment for review. Idempotent on the Razorpay payment ID.
create function public.receive_qr_payment(
  p_qr_code_id text,
  p_razorpay_payment_id text,
  p_amount_paise bigint,
  p_payer_vpa text,
  p_received_at timestamptz
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_sandbox uuid;
  v_id uuid;
begin
  select id into v_sandbox from public.sandboxes where qr_code_id = p_qr_code_id;
  if v_sandbox is null then
    return null; -- not our QR
  end if;
  insert into public.qr_payments (sandbox_id, razorpay_payment_id, qr_code_id, amount_paise, payer_vpa, received_at)
  values (v_sandbox, p_razorpay_payment_id, p_qr_code_id, p_amount_paise, nullif(lower(btrim(p_payer_vpa)), ''), p_received_at)
  on conflict (razorpay_payment_id) do nothing
  returning id into v_id;
  return coalesce(v_id, (select id from public.qr_payments where razorpay_payment_id = p_razorpay_payment_id));
end;
$$;

-- UD-19 The merchant confirms who paid: records it as that customer's payment and clears oldest first.
create function public.confirm_qr_payment(p_sandbox_id uuid, p_qr_payment_id uuid, p_customer_id uuid)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_qr public.qr_payments;
  v_payment uuid;
begin
  select * into v_qr from public.qr_payments
   where id = p_qr_payment_id and sandbox_id = p_sandbox_id
   for update;
  if not found or v_qr.status <> 'pending' then
    raise exception 'QR payment not pending' using errcode = 'no_data_found';
  end if;
  select r.payment_id into v_payment
    from public.record_payment(p_sandbox_id, p_customer_id, v_qr.amount_paise, 'qr',
                               v_qr.razorpay_payment_id, v_qr.payer_vpa, v_qr.received_at) r;
  update public.qr_payments
     set status = 'matched', customer_id = p_customer_id, payment_id = v_payment, decided_at = now()
   where id = p_qr_payment_id;
  return v_payment;
end;
$$;

-- UD-19 Not udhaar: keep it as a normal sale. No balance changes.
create function public.mark_qr_sale(p_sandbox_id uuid, p_qr_payment_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.qr_payments set status = 'sale', decided_at = now()
   where id = p_qr_payment_id and sandbox_id = p_sandbox_id and status = 'pending';
  if not found then
    raise exception 'QR payment not pending' using errcode = 'no_data_found';
  end if;
end;
$$;

-- Seed payments now carry the payer's UPI ID, so QR matching has history to learn from.
create or replace function public.seed_sandbox(p_sandbox_id uuid, p_seed jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_customer jsonb;
  v_entry jsonb;
  v_payment jsonb;
  v_alloc jsonb;
  v_customer_id uuid;
  v_payment_id uuid;
  v_entry_ids uuid[];
  v_entry_id uuid;
begin
  if jsonb_typeof(p_seed -> 'customers') is distinct from 'array' then
    raise exception 'seed.customers must be an array' using errcode = 'invalid_parameter_value';
  end if;

  for v_customer in select * from jsonb_array_elements(p_seed -> 'customers') loop
    insert into public.customers (sandbox_id, name, phone, language, created_at, is_demo)
    values (
      p_sandbox_id,
      v_customer ->> 'name',
      v_customer ->> 'phone',
      coalesce(v_customer ->> 'language', 'en'),
      coalesce((v_customer ->> 'created_at')::timestamptz, now()),
      true
    )
    returning id into v_customer_id;

    v_entry_ids := array[]::uuid[];
    for v_entry in select * from jsonb_array_elements(coalesce(v_customer -> 'entries', '[]'::jsonb)) loop
      insert into public.credit_entries (sandbox_id, customer_id, amount_paise, remaining_paise, due_date, note, created_at)
      values (
        p_sandbox_id,
        v_customer_id,
        (v_entry ->> 'amount_paise')::bigint,
        (v_entry ->> 'amount_paise')::bigint,
        (v_entry ->> 'due_date')::date,
        v_entry ->> 'note',
        (v_entry ->> 'created_at')::timestamptz
      )
      returning id into v_entry_id;
      v_entry_ids := v_entry_ids || v_entry_id;
    end loop;

    for v_payment in select * from jsonb_array_elements(coalesce(v_customer -> 'payments', '[]'::jsonb)) loop
      insert into public.payments (sandbox_id, customer_id, amount_paise, source, received_at, created_at, payer_vpa)
      values (
        p_sandbox_id,
        v_customer_id,
        (v_payment ->> 'amount_paise')::bigint,
        v_payment ->> 'source',
        (v_payment ->> 'received_at')::timestamptz,
        (v_payment ->> 'received_at')::timestamptz,
        v_payment ->> 'payer_vpa'
      )
      returning id into v_payment_id;

      for v_alloc in select * from jsonb_array_elements(coalesce(v_payment -> 'allocations', '[]'::jsonb)) loop
        v_entry_id := v_entry_ids[(v_alloc ->> 'entry')::int + 1];
        if v_entry_id is null then
          raise exception 'seed allocation points at missing entry %', v_alloc ->> 'entry'
            using errcode = 'invalid_parameter_value';
        end if;
        insert into public.allocations (sandbox_id, customer_id, payment_id, entry_id, amount_paise, created_at)
        values (p_sandbox_id, v_customer_id, v_payment_id, v_entry_id, (v_alloc ->> 'amount_paise')::bigint,
                (v_payment ->> 'received_at')::timestamptz);
      end loop;
    end loop;
  end loop;
end;
$$;

revoke execute on function public.record_payment(uuid, uuid, bigint, text, text, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.receive_qr_payment(text, text, bigint, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.confirm_qr_payment(uuid, uuid, uuid) from public, anon, authenticated;
revoke execute on function public.mark_qr_sale(uuid, uuid) from public, anon, authenticated;
grant execute on function public.record_payment(uuid, uuid, bigint, text, text, text, timestamptz) to service_role;
grant execute on function public.receive_qr_payment(text, text, bigint, text, timestamptz) to service_role;
grant execute on function public.confirm_qr_payment(uuid, uuid, uuid) to service_role;
grant execute on function public.mark_qr_sale(uuid, uuid) to service_role;

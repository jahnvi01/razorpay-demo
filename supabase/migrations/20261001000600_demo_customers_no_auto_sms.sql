-- Seed (demo) customers never get automatic SMS (user decision 2026-10-01).
-- Customers added through the app keep automatic SMS on every balance change.
-- Manual "Send SMS" still works for everyone.

alter table public.customers add column is_demo boolean not null default false;
comment on column public.customers.is_demo is 'Loaded from the demo seed. No automatic SMS for these customers.';

-- Mark the current seed customers in the shared demo.
update public.customers
   set is_demo = true
 where sandbox_id = '00000000-0000-4000-8000-000000000001'
   and phone in ('7228070222', '8780670895', '7600821798', '9737659505', '7600046578');

-- Every future seed or Reset demo marks its customers as demo customers.
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
      insert into public.payments (sandbox_id, customer_id, amount_paise, source, received_at, created_at)
      values (
        p_sandbox_id,
        v_customer_id,
        (v_payment ->> 'amount_paise')::bigint,
        v_payment ->> 'source',
        (v_payment ->> 'received_at')::timestamptz,
        (v_payment ->> 'received_at')::timestamptz
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

-- UD-34 and UD-05: create, seed and reset a visitor's private sandbox.
--
-- The seed is built by the app (lib/seed/demo-seed.ts) with dates relative to today in IST
-- and passed in as JSON, so the demo always looks current. These functions insert it in one
-- transaction, so a sandbox is either fully seeded or not created at all.
--
-- Seed JSON shape:
-- {
--   "customers": [{
--     "name": text, "phone": text, "language": "en" | "hi", "created_at": timestamptz,
--     "entries":  [{ "amount_paise": int, "due_date": date, "created_at": timestamptz, "note": text? }],
--     "payments": [{ "amount_paise": int, "source": "cash" | "link" | "qr", "received_at": timestamptz,
--                    "allocations": [{ "entry": int (index into entries), "amount_paise": int }] }]
--   }]
-- }

create function public.seed_sandbox(p_sandbox_id uuid, p_seed jsonb)
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
    insert into public.customers (sandbox_id, name, phone, language, created_at)
    values (
      p_sandbox_id,
      v_customer ->> 'name',
      v_customer ->> 'phone',
      coalesce(v_customer ->> 'language', 'en'),
      coalesce((v_customer ->> 'created_at')::timestamptz, now())
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

-- Returns true when the sandbox was created (and seeded) by this call, false when it already existed.
-- Safe to call on every request: concurrent first requests for the same sandbox seed it only once.
create function public.ensure_sandbox(p_sandbox_id uuid, p_seed jsonb)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_sandbox_id::text, 0));

  update public.sandboxes set last_seen_at = now() where id = p_sandbox_id;
  if found then
    return false;
  end if;

  insert into public.sandboxes (id) values (p_sandbox_id);
  perform public.seed_sandbox(p_sandbox_id, p_seed);
  return true;
end;
$$;

-- Wipes everything in the sandbox and loads the seed again (Reset demo).
create function public.reset_sandbox(p_sandbox_id uuid, p_seed jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_sandbox_id::text, 0));

  insert into public.sandboxes (id) values (p_sandbox_id)
  on conflict (id) do update set last_seen_at = now();

  delete from public.customers where sandbox_id = p_sandbox_id; -- cascades to entries, payments, allocations, reminders
  perform public.seed_sandbox(p_sandbox_id, p_seed);
end;
$$;

-- Only the server (service role) may call these.
revoke execute on function public.seed_sandbox(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.ensure_sandbox(uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.reset_sandbox(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.seed_sandbox(uuid, jsonb) to service_role;
grant execute on function public.ensure_sandbox(uuid, jsonb) to service_role;
grant execute on function public.reset_sandbox(uuid, jsonb) to service_role;

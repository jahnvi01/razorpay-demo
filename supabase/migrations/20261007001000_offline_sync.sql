-- UD-58 Offline mode: changes made on a phone without network are queued there and sent to
-- /api/sync when the network is back. Each change carries an ID made on the phone, so a retry after a
-- dropped connection never applies it twice. The change keeps the time it really happened.

create table public.sync_ops (
  op_id uuid primary key,
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  kind text not null check (kind in ('udhaar', 'cash')),
  customer_id uuid not null,
  applied_at timestamptz not null default now()
);

alter table public.sync_ops enable row level security;
revoke all on public.sync_ops from anon, authenticated;

-- Applies one queued change in a single transaction, or does nothing if it was already applied.
-- p_at is when it happened on the phone, kept within the last 30 days and never in the future.
-- Returns 'applied' or 'duplicate'. Raises 'customer not found' if the demo was reset meanwhile.
create function public.apply_sync_op(
  p_sandbox_id uuid,
  p_op_id uuid,
  p_kind text,
  p_customer_id uuid,
  p_amount_paise bigint,
  p_due_date date,
  p_note text,
  p_at timestamptz
)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_at timestamptz := least(now(), greatest(coalesce(p_at, now()), now() - interval '30 days'));
begin
  insert into public.sync_ops (op_id, sandbox_id, kind, customer_id)
  values (p_op_id, p_sandbox_id, p_kind, p_customer_id)
  on conflict (op_id) do nothing;
  if not found then
    return 'duplicate';
  end if;

  perform public.lock_customer(p_sandbox_id, p_customer_id);

  if p_kind = 'udhaar' then
    insert into public.credit_entries (sandbox_id, customer_id, amount_paise, remaining_paise, due_date, note, created_at)
    values (p_sandbox_id, p_customer_id, p_amount_paise, p_amount_paise, p_due_date, nullif(btrim(p_note), ''), v_at);
    perform public.reallocate_customer(p_sandbox_id, p_customer_id);
  elsif p_kind = 'cash' then
    perform 1 from public.record_payment(p_sandbox_id, p_customer_id, p_amount_paise, 'cash', null, null, v_at);
  else
    raise exception 'unknown sync op kind %', p_kind using errcode = 'invalid_parameter_value';
  end if;

  return 'applied';
end;
$$;

revoke execute on function public.apply_sync_op(uuid, uuid, text, uuid, bigint, date, text, timestamptz) from public, anon, authenticated;
grant execute on function public.apply_sync_op(uuid, uuid, text, uuid, bigint, date, text, timestamptz) to service_role;

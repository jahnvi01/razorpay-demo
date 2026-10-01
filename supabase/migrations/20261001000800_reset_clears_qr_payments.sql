-- Reset demo must also clear shop QR payments. They belong to the sandbox, not to a customer,
-- so deleting customers alone left pending QR payments behind. The shop QR itself is kept.
create or replace function public.reset_sandbox(p_sandbox_id uuid, p_seed jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_sandbox_id::text, 0));

  insert into public.sandboxes (id) values (p_sandbox_id)
  on conflict (id) do update set last_seen_at = now();

  delete from public.qr_payments where sandbox_id = p_sandbox_id;
  delete from public.customers where sandbox_id = p_sandbox_id; -- cascades to entries, payments, allocations, reminders
  perform public.seed_sandbox(p_sandbox_id, p_seed);
end;
$$;

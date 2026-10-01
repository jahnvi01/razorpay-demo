-- UD-27 Nightly ledger consistency check. Returns one row per problem found (no rows = healthy).
-- Every rule here is something the ledger promises to keep true at all times.
create function public.ledger_consistency_report()
returns table (sandbox_id uuid, check_name text, subject_id uuid, detail text)
language sql
stable
set search_path = ''
as $$
  -- 1. An entry's remaining balance equals its amount minus what has been allocated to it.
  select e.sandbox_id, 'entry_remaining_matches_allocations', e.id,
         format('amount %s, allocated %s, remaining %s', e.amount_paise, coalesce(a.allocated, 0), e.remaining_paise)
    from public.credit_entries e
    left join (select entry_id, sum(amount_paise) allocated from public.allocations group by entry_id) a on a.entry_id = e.id
   where e.remaining_paise <> e.amount_paise - coalesce(a.allocated, 0)
  union all
  -- 2. Status, remaining and paid_at agree.
  select e.sandbox_id, 'entry_status_consistent', e.id,
         format('status %s, remaining %s, paid_at %s', e.status, e.remaining_paise, coalesce(e.paid_at::text, 'null'))
    from public.credit_entries e
   where (e.status = 'paid') <> (e.remaining_paise = 0) or (e.status = 'paid') <> (e.paid_at is not null)
  union all
  -- 3. No payment is allocated beyond its amount.
  select p.sandbox_id, 'payment_not_over_allocated', p.id,
         format('amount %s, allocated %s', p.amount_paise, a.allocated)
    from public.payments p
    join (select payment_id, sum(amount_paise) allocated from public.allocations group by payment_id) a on a.payment_id = p.id
   where a.allocated > p.amount_paise
  union all
  -- 4. Oldest first: a customer never has unallocated money (advance) while an entry is still open.
  select c.sandbox_id, 'no_advance_while_entries_open', c.id,
         format('advance %s with %s open entries', adv.advance, adv.open_entries)
    from public.customers c
    join lateral (
      select (select coalesce(sum(amount_paise), 0) from public.payments where customer_id = c.id)
           - (select coalesce(sum(amount_paise), 0) from public.allocations where customer_id = c.id) as advance,
             (select count(*) from public.credit_entries where customer_id = c.id and status = 'open') as open_entries
    ) adv on true
   where adv.advance > 0 and adv.open_entries > 0
  union all
  -- 5. Home totals: remaining across the sandbox equals amount given minus amount allocated.
  select s.id, 'home_remaining_matches_ledger', null::uuid,
         format('remaining %s, given %s, allocated %s', t.remaining, t.given, t.allocated)
    from public.sandboxes s
    join lateral (
      select (select coalesce(sum(remaining_paise), 0) from public.credit_entries where sandbox_id = s.id) remaining,
             (select coalesce(sum(amount_paise), 0) from public.credit_entries where sandbox_id = s.id) given,
             (select coalesce(sum(amount_paise), 0) from public.allocations where sandbox_id = s.id) allocated
    ) t on true
   where t.remaining <> t.given - t.allocated;
$$;

revoke execute on function public.ledger_consistency_report() from public, anon, authenticated;
grant execute on function public.ledger_consistency_report() to service_role;

-- Phase 2: pay links (UD-13), SMS and WhatsApp updates (UD-14, UD-15), statement page (UD-16).

-- UD-16 Every customer gets an unguessable statement token (256 random bits as 64 hex characters).
-- The statement page is public, so the token is the only thing protecting it.
alter table public.customers
  add column statement_token text not null
    default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
alter table public.customers add constraint customers_statement_token_key unique (statement_token);

-- UD-13 The customer's current Razorpay Payment Link, for their whole balance.
-- Replaced whenever the balance changes. Null when nothing is due.
alter table public.customers
  add column pay_link_id text,
  add column pay_link_url text,
  add column pay_link_amount_paise bigint check (pay_link_amount_paise is null or pay_link_amount_paise > 0);

-- UD-14 and UD-15 log balance update messages next to reminders.
alter table public.reminders drop constraint reminders_kind_check;
alter table public.reminders add constraint reminders_kind_check check (kind in ('manual', 'day_before', 'update'));

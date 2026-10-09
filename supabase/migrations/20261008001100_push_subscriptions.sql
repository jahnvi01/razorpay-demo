-- UD-61 Merchant push notifications. One row per browser or installed app that turned them on.
-- The endpoint is the push service URL for that device; p256dh and auth encrypt what we send.
-- lang is the app language when notifications were turned on, so pushes read in that language.

create table public.push_subscriptions (
  endpoint text primary key,
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  lang text not null default 'en' check (lang in ('en', 'hi')),
  created_at timestamptz not null default now()
);

create index push_subscriptions_sandbox on public.push_subscriptions (sandbox_id);

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;

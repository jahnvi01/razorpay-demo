-- UD-03 Core schema for Udhaar Suite.
--
-- Rules that hold for every table:
-- * Every row belongs to exactly one sandbox (one visitor session, UD-34).
-- * Composite foreign keys make it impossible to link rows across sandboxes or customers.
-- * Money is stored as integer paise (bigint). Never floats.
-- * Row level security is on with no policies, so the publishable (anon) key can read nothing.
--   The app talks to the database only from the server with the secret (service role) key.

-- ---------------------------------------------------------------------------
-- Sandboxes
-- ---------------------------------------------------------------------------
create table public.sandboxes (
  id uuid primary key,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

comment on table public.sandboxes is 'One private demo copy of Ramesh Kirana per visitor session (UD-34).';

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null references public.sandboxes (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  phone text not null check (phone ~ '^[6-9][0-9]{9}$'),
  language text not null default 'en' check (language in ('en', 'hi')),
  created_at timestamptz not null default now(),
  unique (sandbox_id, phone),
  unique (id, sandbox_id)
);

comment on column public.customers.phone is '10 digit Indian mobile number without +91.';

-- ---------------------------------------------------------------------------
-- Credit entries (udhaar)
-- ---------------------------------------------------------------------------
create table public.credit_entries (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null,
  customer_id uuid not null,
  amount_paise bigint not null check (amount_paise > 0),
  remaining_paise bigint not null,
  due_date date not null,
  note text check (note is null or char_length(note) <= 200),
  status text not null default 'open' check (status in ('open', 'paid')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  foreign key (customer_id, sandbox_id) references public.customers (id, sandbox_id) on delete cascade,
  unique (id, customer_id, sandbox_id),
  constraint remaining_in_range check (remaining_paise between 0 and amount_paise),
  constraint status_matches_remaining check ((status = 'paid') = (remaining_paise = 0)),
  constraint paid_at_matches_status check ((status = 'paid') = (paid_at is not null))
);

-- ---------------------------------------------------------------------------
-- Payments (cash, pay link, shared QR)
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null,
  customer_id uuid not null,
  amount_paise bigint not null check (amount_paise > 0),
  source text not null check (source in ('cash', 'link', 'qr')),
  razorpay_payment_id text unique,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (customer_id, sandbox_id) references public.customers (id, sandbox_id) on delete cascade,
  unique (id, customer_id, sandbox_id),
  constraint cash_has_no_razorpay_id check (source <> 'cash' or razorpay_payment_id is null)
);

comment on column public.payments.razorpay_payment_id is 'Razorpay payment ID. Unique, so a webhook delivered twice is recorded once.';

-- ---------------------------------------------------------------------------
-- Allocations: which payment cleared how much of which entry (oldest first, UD-09)
-- ---------------------------------------------------------------------------
create table public.allocations (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null,
  customer_id uuid not null,
  payment_id uuid not null,
  entry_id uuid not null,
  amount_paise bigint not null check (amount_paise > 0),
  created_at timestamptz not null default now(),
  foreign key (payment_id, customer_id, sandbox_id)
    references public.payments (id, customer_id, sandbox_id) on delete cascade,
  foreign key (entry_id, customer_id, sandbox_id)
    references public.credit_entries (id, customer_id, sandbox_id) on delete cascade,
  unique (payment_id, entry_id)
);

-- ---------------------------------------------------------------------------
-- Reminders
-- ---------------------------------------------------------------------------
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  sandbox_id uuid not null,
  customer_id uuid not null,
  channel text not null check (channel in ('whatsapp', 'sms')),
  kind text not null check (kind in ('manual', 'day_before')),
  sent_at timestamptz not null default now(),
  foreign key (customer_id, sandbox_id) references public.customers (id, sandbox_id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Indexes for the queries the app runs (always scoped to one sandbox)
-- ---------------------------------------------------------------------------
create index customers_sandbox_idx on public.customers (sandbox_id, name);
create index credit_entries_customer_idx on public.credit_entries (sandbox_id, customer_id, created_at);
create index credit_entries_open_due_idx on public.credit_entries (sandbox_id, due_date) where status = 'open';
create index payments_customer_idx on public.payments (sandbox_id, customer_id, received_at);
create index allocations_entry_idx on public.allocations (entry_id);
create index reminders_customer_idx on public.reminders (sandbox_id, customer_id, sent_at);
create index sandboxes_last_seen_idx on public.sandboxes (last_seen_at);

-- ---------------------------------------------------------------------------
-- Keep entries in step with their allocations.
-- An entry's remaining amount, status and paid_at are always derived from allocations,
-- so no code path can leave them out of sync.
-- ---------------------------------------------------------------------------
create function public.sync_entry_from_allocations(p_entry_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_amount bigint;
  v_allocated bigint;
  v_paid_at timestamptz;
begin
  select e.amount_paise into v_amount from public.credit_entries e where e.id = p_entry_id;
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
         paid_at = case when v_allocated = v_amount then v_paid_at else null end
   where id = p_entry_id;
end;
$$;

create function public.allocations_after_change()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_payment_amount bigint;
  v_payment_allocated bigint;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.sync_entry_from_allocations(old.entry_id);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    perform public.sync_entry_from_allocations(new.entry_id);

    select p.amount_paise into v_payment_amount from public.payments p where p.id = new.payment_id;
    select coalesce(sum(a.amount_paise), 0) into v_payment_allocated
      from public.allocations a where a.payment_id = new.payment_id;
    if v_payment_allocated > v_payment_amount then
      raise exception 'Allocations (% paise) exceed payment amount (% paise)', v_payment_allocated, v_payment_amount
        using errcode = 'check_violation';
    end if;
  end if;

  return null;
end;
$$;

create trigger allocations_sync_entries
after insert or update or delete on public.allocations
for each row execute function public.allocations_after_change();

-- New entries start fully unpaid.
create function public.credit_entries_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.remaining_paise := new.amount_paise;
  new.status := 'open';
  new.paid_at := null;
  return new;
end;
$$;

create trigger credit_entries_init_remaining
before insert on public.credit_entries
for each row execute function public.credit_entries_before_insert();

-- ---------------------------------------------------------------------------
-- Security: server-only access
-- ---------------------------------------------------------------------------
alter table public.sandboxes enable row level security;
alter table public.customers enable row level security;
alter table public.credit_entries enable row level security;
alter table public.payments enable row level security;
alter table public.allocations enable row level security;
alter table public.reminders enable row level security;

revoke all on public.sandboxes, public.customers, public.credit_entries, public.payments,
  public.allocations, public.reminders from anon, authenticated;

revoke execute on function public.sync_entry_from_allocations(uuid) from public, anon, authenticated;
revoke execute on function public.allocations_after_change() from public, anon, authenticated;
revoke execute on function public.credit_entries_before_insert() from public, anon, authenticated;
grant execute on function public.sync_entry_from_allocations(uuid) to service_role;

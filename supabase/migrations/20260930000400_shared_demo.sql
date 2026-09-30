-- UD-34 change: one shared demo for all visitors instead of a sandbox per browser session.
-- Removes the per-visitor sandboxes created so far (their customers, entries and payments go with
-- them via cascade). The shared demo (00000000-0000-4000-8000-000000000001) is kept or created on
-- first use by the app. The last_seen_at index only served the per-visitor cleanup job.

delete from public.sandboxes where id <> '00000000-0000-4000-8000-000000000001';

drop index if exists public.sandboxes_last_seen_idx;

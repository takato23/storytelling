-- Records consent given by the uploader at the time a reference photo is
-- submitted. Keep it minimal but auditable: no PII beyond what the user
-- already provided, hashed IP + user agent for traceability.
--
-- Referenced by docs/privacy/POLICY.md and app/api/personalize/route.ts.

create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  preview_session_id uuid,
  order_id uuid,
  user_id uuid references auth.users (id) on delete set null,
  consent_version text not null default '2026-04-15',
  consent_text text not null,
  child_name text,
  ip_hash text,
  user_agent text,
  -- When a child photo was uploaded, store the storage path so we can prove
  -- which reference image the consent was given for (and later, when the
  -- purge job ran, when the photo was removed).
  photo_bucket text,
  photo_path text,
  photo_purged_at timestamptz
);

create index if not exists consent_records_preview_session_idx
  on public.consent_records (preview_session_id);

create index if not exists consent_records_order_idx
  on public.consent_records (order_id);

create index if not exists consent_records_user_idx
  on public.consent_records (user_id);

-- RLS: the uploader can see their own records; the service role can
-- read/write everything (used by purge and audit).
alter table public.consent_records enable row level security;

drop policy if exists "consent_records_self_read" on public.consent_records;
create policy "consent_records_self_read"
  on public.consent_records
  for select
  using (auth.uid() = user_id);

drop policy if exists "consent_records_service_all" on public.consent_records;
create policy "consent_records_service_all"
  on public.consent_records
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

alter table public.profiles
  add column if not exists free_preview_credits integer not null default 1,
  add column if not exists free_preview_used integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_free_preview_credits_check,
  add constraint profiles_free_preview_credits_check check (free_preview_credits >= 0);

alter table public.profiles
  drop constraint if exists profiles_free_preview_used_check,
  add constraint profiles_free_preview_used_check check (free_preview_used >= 0);

create table if not exists public.preview_generation_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  story_id text references public.stories(id) on delete set null,
  image_hash text,
  status text not null check (status in ('started', 'succeeded', 'failed')),
  provider text,
  model text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_preview_generation_usage_user_created
  on public.preview_generation_usage(user_id, created_at desc);

create index if not exists idx_preview_generation_usage_hash_created
  on public.preview_generation_usage(image_hash, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_preview_generation_usage on public.preview_generation_usage;
create trigger set_updated_at_preview_generation_usage
before update on public.preview_generation_usage
for each row execute function public.set_updated_at();

alter table public.preview_generation_usage enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'preview_generation_usage'
      and policyname = 'preview_usage_owner_select'
  ) then
    create policy "preview_usage_owner_select" on public.preview_generation_usage
    for select using (user_id = auth.uid() or public.is_admin());
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'preview_generation_usage'
      and policyname = 'preview_usage_admin_write'
  ) then
    create policy "preview_usage_admin_write" on public.preview_generation_usage
    for all using (public.is_admin()) with check (public.is_admin());
  end if;
end
$$;

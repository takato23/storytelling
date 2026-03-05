begin;

create extension if not exists pgcrypto;

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.webhook_events cascade;
drop table if exists public.print_jobs cascade;
drop table if exists public.generated_pages cascade;
drop table if exists public.generation_jobs cascade;
drop table if exists public.digital_assets cascade;
drop table if exists public.order_events cascade;
drop table if exists public.payments cascade;
drop table if exists public.sticker_waitlist cascade;
drop table if exists public.sticker_orders cascade;
drop table if exists public.contact_messages cascade;
drop table if exists public.personalizations cascade;
drop table if exists public.order_items cascade;
drop table if exists public.shipping_addresses cascade;
drop table if exists public.shipping_rate_rules cascade;
drop table if exists public.order_quotes cascade;
drop table if exists public.orders cascade;
drop table if exists public.fx_rates_daily cascade;
drop table if exists public.story_locales cascade;
drop table if exists public.stories cascade;
drop table if exists public.profiles cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.is_admin() cascade;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stories (
  id text primary key,
  slug text not null unique,
  title text not null,
  age_range text not null,
  cover_image text,
  short_description text,
  full_description text,
  base_price_usd numeric(10,2) not null check (base_price_usd >= 0),
  base_price_ars numeric(12,2) check (base_price_ars is null or base_price_ars >= 0),
  digital_price_ars numeric(12,2) check (digital_price_ars is null or digital_price_ars >= 0),
  print_price_ars numeric(12,2) check (print_price_ars is null or print_price_ars >= 0),
  target_gender text not null default 'unisex' check (target_gender in ('niña', 'niño', 'unisex')),
  print_specs jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.story_locales (
  id uuid primary key default gen_random_uuid(),
  story_id text not null references public.stories(id) on delete cascade,
  locale text not null,
  title text not null,
  short_description text,
  full_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, locale)
);

create table public.fx_rates_daily (
  date date primary key,
  usd_to_ars numeric(18,6) not null check (usd_to_ars > 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shipping_rate_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_code char(2) not null default 'AR',
  province text,
  postal_code_prefix text,
  fee_ars numeric(12,2) not null check (fee_ars >= 0),
  eta_days integer check (eta_days is null or eta_days > 0),
  priority integer not null default 100,
  is_default boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft' check (
    status in (
      'draft',
      'pending_payment',
      'paid',
      'generating',
      'ready_digital',
      'print_queued',
      'in_production',
      'packed',
      'shipped',
      'delivered',
      'failed',
      'cancelled',
      'refunded'
    )
  ),
  payment_provider text not null default 'mercadopago' check (payment_provider in ('mercadopago', 'stripe')),
  currency char(3) not null check (currency in ('USD', 'ARS')),
  fx_rate_snapshot numeric(18,6),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  shipping_fee numeric(12,2) not null default 0 check (shipping_fee >= 0),
  total numeric(12,2) not null check (total >= 0),
  quote_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  story_id text not null references public.stories(id),
  format text not null check (format in ('digital', 'print')),
  print_options jsonb not null default '{}'::jsonb,
  shipping_city text,
  shipping_address jsonb,
  shipping_rule_id uuid references public.shipping_rate_rules(id),
  shipping_eta_days integer,
  currency char(3) not null check (currency in ('USD', 'ARS')),
  fx_rate_snapshot numeric(18,6),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  shipping_fee numeric(12,2) not null default 0 check (shipping_fee >= 0),
  total numeric(12,2) not null check (total >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  story_id text not null references public.stories(id),
  format text not null check (format in ('digital', 'print')),
  print_options_snapshot jsonb not null default '{}'::jsonb,
  price_snapshot jsonb not null default '{}'::jsonb,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.personalizations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  child_profile jsonb not null default '{}'::jsonb,
  personalization_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_session_id text unique,
  provider_payment_intent text unique,
  status text not null check (status in ('pending', 'paid', 'failed', 'refunded')),
  amount numeric(12,2) not null check (amount >= 0),
  currency char(3) not null check (currency in ('USD', 'ARS')),
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  event_type text not null,
  from_status text,
  to_status text,
  note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.digital_assets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  asset_type text not null check (asset_type in ('pdf', 'viewer', 'thumbnail')),
  url text,
  status text not null check (status in ('pending', 'available', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.digital_assets add constraint digital_assets_order_asset_type_unique unique (order_id, asset_type);

create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  trigger_source text not null default 'system',
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.generated_pages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  image_url text,
  prompt_used text,
  created_at timestamptz not null default now(),
  unique (order_id, page_number)
);

create table public.shipping_addresses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  recipient_name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text,
  postal_code text not null,
  country_code char(2) not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sticker_waitlist (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sticker_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  child_gender text not null check (child_gender in ('niña', 'niño')),
  selected_themes text[] not null default '{}',
  selected_style text not null default 'cuento_vibrante' check (selected_style in ('cuento_vibrante', 'kawaii_limpio', 'comic_pop')),
  preview_image_url text,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_ars numeric(12,2) not null check (unit_price_ars >= 0),
  shipping_fee_ars numeric(12,2) not null check (shipping_fee_ars >= 0),
  total_ars numeric(12,2) not null check (total_ars >= 0),
  shipping_address jsonb not null default '{}'::jsonb,
  shipping_rule_id uuid references public.shipping_rate_rules(id),
  shipping_eta_days integer,
  payment_provider text not null default 'mercadopago' check (payment_provider in ('mercadopago', 'stripe')),
  provider_session_id text unique,
  provider_payment_id text unique,
  status text not null default 'pending_payment' check (status in ('pending_payment', 'paid', 'failed', 'cancelled', 'refunded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.print_jobs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  status text not null check (status in ('queued', 'in_production', 'packed', 'shipped', 'delivered', 'failed', 'cancelled')),
  tracking_number text,
  sla_due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null unique,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_orders_user_status_created on public.orders(user_id, status, created_at desc);
create index idx_payments_payment_intent on public.payments(provider_payment_intent);
create index idx_print_jobs_status_created on public.print_jobs(status, created_at desc);
create index idx_order_items_order_id on public.order_items(order_id);
create index idx_order_events_order_id on public.order_events(order_id, created_at desc);
create index idx_order_quotes_user_id on public.order_quotes(user_id, created_at desc);
create index idx_order_quotes_expires_at on public.order_quotes(expires_at);
create index idx_generation_jobs_order_created on public.generation_jobs(order_id, created_at desc);
create index idx_generation_jobs_status_created on public.generation_jobs(status, created_at desc);
create index idx_shipping_rate_rules_country_active on public.shipping_rate_rules(country_code, active, priority);
create index idx_contact_messages_status_created on public.contact_messages(status, created_at desc);
create index idx_sticker_waitlist_created on public.sticker_waitlist(created_at desc);
create index idx_sticker_orders_status_created on public.sticker_orders(status, created_at desc);
create index idx_sticker_orders_email_created on public.sticker_orders(customer_email, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_profiles before update on public.profiles
for each row execute function public.set_updated_at();
create trigger set_updated_at_stories before update on public.stories
for each row execute function public.set_updated_at();
create trigger set_updated_at_story_locales before update on public.story_locales
for each row execute function public.set_updated_at();
create trigger set_updated_at_fx_rates_daily before update on public.fx_rates_daily
for each row execute function public.set_updated_at();
create trigger set_updated_at_shipping_rate_rules before update on public.shipping_rate_rules
for each row execute function public.set_updated_at();
create trigger set_updated_at_orders before update on public.orders
for each row execute function public.set_updated_at();
create trigger set_updated_at_order_quotes before update on public.order_quotes
for each row execute function public.set_updated_at();
create trigger set_updated_at_order_items before update on public.order_items
for each row execute function public.set_updated_at();
create trigger set_updated_at_personalizations before update on public.personalizations
for each row execute function public.set_updated_at();
create trigger set_updated_at_payments before update on public.payments
for each row execute function public.set_updated_at();
create trigger set_updated_at_digital_assets before update on public.digital_assets
for each row execute function public.set_updated_at();
create trigger set_updated_at_generation_jobs before update on public.generation_jobs
for each row execute function public.set_updated_at();
create trigger set_updated_at_shipping_addresses before update on public.shipping_addresses
for each row execute function public.set_updated_at();
create trigger set_updated_at_contact_messages before update on public.contact_messages
for each row execute function public.set_updated_at();
create trigger set_updated_at_sticker_waitlist before update on public.sticker_waitlist
for each row execute function public.set_updated_at();
create trigger set_updated_at_sticker_orders before update on public.sticker_orders
for each row execute function public.set_updated_at();
create trigger set_updated_at_print_jobs before update on public.print_jobs
for each row execute function public.set_updated_at();
create trigger set_updated_at_webhook_events before update on public.webhook_events
for each row execute function public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.story_locales enable row level security;
alter table public.fx_rates_daily enable row level security;
alter table public.shipping_rate_rules enable row level security;
alter table public.orders enable row level security;
alter table public.order_quotes enable row level security;
alter table public.order_items enable row level security;
alter table public.personalizations enable row level security;
alter table public.payments enable row level security;
alter table public.order_events enable row level security;
alter table public.digital_assets enable row level security;
alter table public.generation_jobs enable row level security;
alter table public.generated_pages enable row level security;
alter table public.shipping_addresses enable row level security;
alter table public.contact_messages enable row level security;
alter table public.sticker_waitlist enable row level security;
alter table public.sticker_orders enable row level security;
alter table public.print_jobs enable row level security;
alter table public.webhook_events enable row level security;

create policy "profiles_owner_select" on public.profiles
for select using (id = auth.uid() or public.is_admin());
create policy "profiles_owner_update" on public.profiles
for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy "stories_read" on public.stories
for select using (active = true or public.is_admin());
create policy "stories_admin_write" on public.stories
for all using (public.is_admin()) with check (public.is_admin());

create policy "story_locales_read" on public.story_locales
for select using (public.is_admin() or exists (
  select 1 from public.stories s where s.id = story_locales.story_id and s.active = true
));
create policy "story_locales_admin_write" on public.story_locales
for all using (public.is_admin()) with check (public.is_admin());

create policy "fx_rates_read" on public.fx_rates_daily
for select using (true);
create policy "fx_rates_admin_write" on public.fx_rates_daily
for all using (public.is_admin()) with check (public.is_admin());

create policy "shipping_rate_rules_read" on public.shipping_rate_rules
for select using (true);
create policy "shipping_rate_rules_admin_write" on public.shipping_rate_rules
for all using (public.is_admin()) with check (public.is_admin());

create policy "orders_owner_select" on public.orders
for select using (user_id = auth.uid() or public.is_admin());
create policy "orders_owner_insert" on public.orders
for insert with check (user_id = auth.uid() or public.is_admin());
create policy "orders_owner_update" on public.orders
for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "order_quotes_owner_select" on public.order_quotes
for select using (user_id = auth.uid() or public.is_admin());
create policy "order_quotes_owner_insert" on public.order_quotes
for insert with check (user_id = auth.uid() or public.is_admin());
create policy "order_quotes_owner_update" on public.order_quotes
for update using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

create policy "order_items_owner_select" on public.order_items
for select using (public.is_admin() or exists (
  select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()
));
create policy "order_items_owner_insert" on public.order_items
for insert with check (public.is_admin() or exists (
  select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()
));
create policy "order_items_owner_update" on public.order_items
for update using (public.is_admin() or exists (
  select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()
)) with check (public.is_admin() or exists (
  select 1 from public.orders o where o.id = order_items.order_id and o.user_id = auth.uid()
));

create policy "personalizations_owner_select" on public.personalizations
for select using (public.is_admin() or exists (
  select 1 from public.orders o where o.id = personalizations.order_id and o.user_id = auth.uid()
));
create policy "personalizations_owner_insert" on public.personalizations
for insert with check (public.is_admin() or exists (
  select 1 from public.orders o where o.id = personalizations.order_id and o.user_id = auth.uid()
));
create policy "personalizations_owner_update" on public.personalizations
for update using (public.is_admin() or exists (
  select 1 from public.orders o where o.id = personalizations.order_id and o.user_id = auth.uid()
)) with check (public.is_admin() or exists (
  select 1 from public.orders o where o.id = personalizations.order_id and o.user_id = auth.uid()
));

create policy "payments_owner_select" on public.payments
for select using (public.is_admin() or exists (
  select 1 from public.orders o where o.id = payments.order_id and o.user_id = auth.uid()
));
create policy "payments_admin_write" on public.payments
for all using (public.is_admin()) with check (public.is_admin());

create policy "order_events_owner_select" on public.order_events
for select using (public.is_admin() or exists (
  select 1 from public.orders o where o.id = order_events.order_id and o.user_id = auth.uid()
));
create policy "order_events_admin_insert" on public.order_events
for insert with check (public.is_admin());

create policy "digital_assets_owner_select" on public.digital_assets
for select using (public.is_admin() or exists (
  select 1 from public.orders o where o.id = digital_assets.order_id and o.user_id = auth.uid()
));
create policy "digital_assets_admin_write" on public.digital_assets
for all using (public.is_admin()) with check (public.is_admin());

create policy "generation_jobs_owner_select" on public.generation_jobs
for select using (public.is_admin() or exists (
  select 1 from public.orders o where o.id = generation_jobs.order_id and o.user_id = auth.uid()
));
create policy "generation_jobs_admin_write" on public.generation_jobs
for all using (public.is_admin()) with check (public.is_admin());

create policy "generated_pages_owner_select" on public.generated_pages
for select using (public.is_admin() or exists (
  select 1 from public.orders o where o.id = generated_pages.order_id and o.user_id = auth.uid()
));
create policy "generated_pages_admin_write" on public.generated_pages
for all using (public.is_admin()) with check (public.is_admin());

create policy "shipping_owner_select" on public.shipping_addresses
for select using (public.is_admin() or exists (
  select 1 from public.orders o where o.id = shipping_addresses.order_id and o.user_id = auth.uid()
));
create policy "shipping_owner_insert" on public.shipping_addresses
for insert with check (public.is_admin() or exists (
  select 1 from public.orders o where o.id = shipping_addresses.order_id and o.user_id = auth.uid()
));
create policy "shipping_owner_update" on public.shipping_addresses
for update using (public.is_admin() or exists (
  select 1 from public.orders o where o.id = shipping_addresses.order_id and o.user_id = auth.uid()
)) with check (public.is_admin() or exists (
  select 1 from public.orders o where o.id = shipping_addresses.order_id and o.user_id = auth.uid()
));

create policy "contact_messages_public_insert" on public.contact_messages
for insert with check (true);
create policy "contact_messages_admin_select" on public.contact_messages
for select using (public.is_admin());
create policy "contact_messages_admin_update" on public.contact_messages
for update using (public.is_admin()) with check (public.is_admin());

create policy "sticker_waitlist_public_insert" on public.sticker_waitlist
for insert with check (true);
create policy "sticker_waitlist_admin_select" on public.sticker_waitlist
for select using (public.is_admin());
create policy "sticker_waitlist_admin_update" on public.sticker_waitlist
for update using (public.is_admin()) with check (public.is_admin());

create policy "sticker_orders_public_insert" on public.sticker_orders
for insert with check (true);
create policy "sticker_orders_admin_select" on public.sticker_orders
for select using (public.is_admin());
create policy "sticker_orders_admin_update" on public.sticker_orders
for update using (public.is_admin()) with check (public.is_admin());

create policy "print_jobs_owner_select" on public.print_jobs
for select using (public.is_admin() or exists (
  select 1 from public.orders o where o.id = print_jobs.order_id and o.user_id = auth.uid()
));
create policy "print_jobs_admin_write" on public.print_jobs
for all using (public.is_admin()) with check (public.is_admin());

create policy "webhooks_admin_only" on public.webhook_events
for all using (public.is_admin()) with check (public.is_admin());

insert into public.stories (
  id,
  slug,
  title,
  age_range,
  cover_image,
  short_description,
  full_description,
  base_price_usd,
  base_price_ars,
  digital_price_ars,
  print_price_ars,
  target_gender,
  print_specs,
  active
)
values
  ('1', 'el-explorador-espacial', 'El Explorador Espacial', '4-8 años', '/stories/space-1.jpg', 'Viaja por las estrellas en una aventura intergaláctica.', 'Aventura espacial personalizada para niños.', 29.99, null, 9990, 29990, 'niño', '{"format":"tapa blanda","size":"21 x 14 cm","pages":32,"paper":"satinado a color"}'::jsonb, true),
  ('2', 'el-bosque-magico', 'El Reino del Bosque Mágico', '3-7 años', '/stories/forest-1.jpg', 'Descubre hadas y criaturas fantásticas.', 'Aventura mágica en la naturaleza personalizada para niños.', 29.99, null, 9990, 29990, 'niña', '{"format":"tapa blanda","size":"21 x 14 cm","pages":32,"paper":"satinado a color"}'::jsonb, true),
  ('3', 'el-domador-de-dinosaurios', 'El Domador de Dinosaurios', '4-8 años', '/stories/dino-1.jpg', 'Una aventura prehistórica con amigos gigantes.', 'Historia divertida con dinosaurios y aprendizajes.', 29.99, null, 9990, 29990, 'niño', '{"format":"tapa blanda","size":"21 x 14 cm","pages":32,"paper":"satinado a color"}'::jsonb, true),
  ('4', 'la-estrella-del-futbol', 'La Estrella del Fútbol', '5-10 años', '/stories/soccer-1.jpg', 'Marca el gol de la victoria en el gran estadio.', 'Historia deportiva personalizada para pequeños campeones.', 29.99, null, 9990, 29990, 'unisex', '{"format":"tapa blanda","size":"21 x 14 cm","pages":32,"paper":"satinado a color"}'::jsonb, true),
  ('5', 'el-castillo-en-las-nubes', 'El Castillo en las Nubes', '4-9 años', '/stories/castle-1.jpg', 'Sube por el tallo de frijoles a un mundo de gigantes amables.', 'Historia fantástica sobre imaginación y valentía.', 29.99, null, 9990, 29990, 'niña', '{"format":"tapa blanda","size":"21 x 14 cm","pages":32,"paper":"satinado a color"}'::jsonb, true)
on conflict (id) do update
set slug = excluded.slug,
    title = excluded.title,
    age_range = excluded.age_range,
    cover_image = excluded.cover_image,
    short_description = excluded.short_description,
    full_description = excluded.full_description,
    base_price_usd = excluded.base_price_usd,
    base_price_ars = excluded.base_price_ars,
    digital_price_ars = excluded.digital_price_ars,
    print_price_ars = excluded.print_price_ars,
    target_gender = excluded.target_gender,
    print_specs = excluded.print_specs,
    active = excluded.active,
    updated_at = now();

insert into public.shipping_rate_rules (name, country_code, province, postal_code_prefix, fee_ars, eta_days, priority, is_default, active)
values
  ('CABA', 'AR', 'CABA', 'C', 4900, 3, 10, false, true),
  ('GBA', 'AR', 'BUENOS AIRES', 'B', 5900, 4, 20, false, true),
  ('Interior Centro', 'AR', 'CORDOBA', 'X', 6900, 5, 30, false, true),
  ('Interior Centro 2', 'AR', 'SANTA FE', 'S', 6900, 5, 40, false, true),
  ('Resto del país', 'AR', null, null, 7900, 7, 999, true, true);

commit;

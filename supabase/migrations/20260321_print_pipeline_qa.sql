begin;

alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check check (
    status in (
      'draft',
      'pending_payment',
      'paid',
      'generating',
      'qa_pending',
      'ready_print_assets',
      'qa_failed',
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
  );

alter table public.digital_assets
  drop constraint if exists digital_assets_asset_type_check;

alter table public.digital_assets
  add constraint digital_assets_asset_type_check check (
    asset_type in ('digital_pdf', 'viewer', 'thumbnail', 'print_pdf', 'print_zip', 'preview_lowres')
  );

alter table public.generated_pages
  add column if not exists page_type text not null default 'story_page',
  add column if not exists render_purpose text not null default 'print_page',
  add column if not exists width_px integer,
  add column if not exists height_px integer,
  add column if not exists status text not null default 'queued',
  add column if not exists version integer not null default 1,
  add column if not exists error_message text;

alter table public.generated_pages
  drop constraint if exists generated_pages_page_type_check;

alter table public.generated_pages
  add constraint generated_pages_page_type_check check (
    page_type in ('cover', 'dedication', 'story_page', 'ending', 'back_cover')
  );

alter table public.generated_pages
  drop constraint if exists generated_pages_render_purpose_check;

alter table public.generated_pages
  add constraint generated_pages_render_purpose_check check (
    render_purpose in ('preview', 'viewer_page', 'print_page')
  );

alter table public.generated_pages
  drop constraint if exists generated_pages_status_check;

alter table public.generated_pages
  add constraint generated_pages_status_check check (
    status in ('queued', 'processing', 'ready', 'failed', 'approved')
  );

alter table public.generated_pages
  drop constraint if exists generated_pages_width_px_check;

alter table public.generated_pages
  add constraint generated_pages_width_px_check check (width_px is null or width_px > 0);

alter table public.generated_pages
  drop constraint if exists generated_pages_height_px_check;

alter table public.generated_pages
  add constraint generated_pages_height_px_check check (height_px is null or height_px > 0);

alter table public.generated_pages
  drop constraint if exists generated_pages_version_check;

alter table public.generated_pages
  add constraint generated_pages_version_check check (version > 0);

alter table public.print_jobs
  drop constraint if exists print_jobs_status_check;

alter table public.print_jobs
  add constraint print_jobs_status_check check (
    status in ('review_required', 'approved', 'in_production', 'packed', 'shipped', 'delivered', 'failed', 'cancelled')
  );

commit;

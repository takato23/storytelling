# StoryMagic MVP Comercial

Stack: `Next.js 16 + Supabase + Mercado Pago + Stripe`

## Run local
```bash
npm install
npm run dev
```

## Required env
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3005

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Mercado Pago queda preparado para producción.
# La activación final depende de cargar estas credenciales en Vercel.
MERCADOPAGO_ACCESS_TOKEN=...
# Optional (defaults to https://api.mercadopago.com)
MERCADOPAGO_API_BASE=...
# Optional override for notifications
MERCADOPAGO_WEBHOOK_URL=...

# mercadopago | stripe (default mercadopago)
CHECKOUT_PROVIDER=mercadopago

# FX fallback if fx_rates_daily is empty
DEFAULT_USD_TO_ARS=1200

# Gemini (text + image)
GEMINI_API_KEY=...

# Optional image model override
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image-preview

# Image provider routing (see lib/image-providers/). Primary provider for
# scene + cover generation. One of:
#   gemini | flux-kontext-pro | flux-kontext-max | seedream
IMAGE_PROVIDER=gemini
# Comma-separated fallback chain tried when the primary fails.
IMAGE_PROVIDER_FALLBACKS=

# fal.ai shared credentials (required for flux-kontext-* and seedream)
FAL_KEY=
# Optional model-id overrides for the fal-backed providers
FAL_FLUX_KONTEXT_MODEL=fal-ai/flux-pro/kontext/max/multi
FAL_SEEDREAM_MODEL=fal-ai/bytedance/seedream/v4/edit

# Privacy: auto-purge window (hours) for uploaded child reference photos.
# The purge job (npm run privacy:purge, or the /api/cron/purge-photos Vercel
# Cron endpoint) deletes photos older than this.
CHILD_PHOTO_RETENTION_HOURS=24

# Shared secret that protects the cron endpoint at /api/cron/purge-photos.
# Generate with: `openssl rand -hex 32`. Set the same value in Vercel as
# both an env var and the Authorization: Bearer <secret> header of the cron.
CRON_SECRET=

# Product analytics (optional, no-op if missing)
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Optional fallback only for non-production catalogs
ALLOW_STORY_FALLBACK=false

# Free preview controls
DISABLE_FREE_PREVIEWS=false
FREE_PREVIEW_CREDITS_DEFAULT=2
# Operational estimate only for admin metrics
PREVIEW_IMAGE_ESTIMATED_COST_USD=0.05
```

## Production deploy on Vercel
### Variables
Set all required env vars in Vercel Production.

Required for production boot:
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `GEMINI_API_KEY`
- `CHECKOUT_PROVIDER=mercadopago`

Optional until Mercado Pago activation:
- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_API_BASE`
- `MERCADOPAGO_WEBHOOK_URL`
- `DISABLE_FREE_PREVIEWS`
- `FREE_PREVIEW_CREDITS_DEFAULT`
- `PREVIEW_IMAGE_ESTIMATED_COST_USD`

Required if the child-photo purge cron is enabled (see `vercel.json`):
- `CRON_SECRET` (and `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, already listed above)

### Webhooks
Configure these public endpoints after deploy:
- Stripe: `POST https://<your-domain>/api/webhooks/stripe`
- Mercado Pago: `POST https://<your-domain>/api/webhooks/mercadopago`

### Runtime assumptions
These routes depend on server-side secrets and should run in Node runtime:
- `/api/contact`
- `/api/personalize`
- `/api/stickers/waitlist`
- `/api/webhooks/stripe`
- `/api/webhooks/mercadopago`

## Image providers
Image generation is abstracted behind a provider interface in `lib/image-providers/`. The active provider is selected by the `IMAGE_PROVIDER` env var and a comma-separated fallback chain can be configured via `IMAGE_PROVIDER_FALLBACKS`. Supported adapters:

- `gemini` — Nano Banana 2 (Google, `@google/genai`). Requires `GEMINI_API_KEY`. Optionally routed through an edge function via `STORY_IMAGE_EDGE_URL`.
- `flux-kontext-pro` / `flux-kontext-max` — Black Forest Labs Flux Kontext via `fal.ai`. Requires `FAL_KEY`.
- `seedream` — ByteDance Seedream v4 via `fal.ai`. Requires `FAL_KEY`.

To benchmark all configured providers side-by-side with a real reference photo, run:
```bash
npm run bench:images -- --photo ./tmp/child1.jpg --prompt "Pixar 3D style, a curious child exploring a jungle" --out ./tmp/bench1
```
The script writes each provider's output plus a `report.md` comparison under `--out`.

## Privacy & data protection
Uploading a photo of a child requires explicit consent from the uploader. The canonical policy lives in `docs/privacy/POLICY.md`. Key pieces:

- API route `POST /api/personalize` rejects generation requests without a valid `consent` payload (see zod `ConsentSchema` in the route). The uploader's accepted version + text are persisted in `public.consent_records` (migration: `supabase/migrations/20260415_consent_records.sql`).
- The reusable checkbox lives in `components/privacy/ChildPhotoConsent.tsx` and exports `buildConsentPayload()` for the client.
- Reference photos are auto-deleted after `CHILD_PHOTO_RETENTION_HOURS` (default 24). Two ways to run the purge:
  - **Vercel Cron (production):** scheduled hourly in `vercel.json` at `/api/cron/purge-photos`. Protect with `CRON_SECRET`; Vercel will call the endpoint with `Authorization: Bearer $CRON_SECRET`.
  - **Manual / local:** `npm run privacy:purge` (CLI entrypoint at `scripts/privacy/purge-child-photos.ts`).
  Shared logic lives in `lib/privacy/purge-child-photos.ts`. Deletions are logged in `consent_records.photo_purged_at` and `order_events` (`child_photo_purged`).

## Commercial flow
1. `POST /api/orders` creates draft + personalization.
2. `POST /api/orders/quote` creates quote with FX snapshot.
3. `POST /api/checkout/session` creates checkout session using the configured provider.
4. Provider webhook transitions payment and triggers generation.
5. Generation writes `generated_pages`, `digital_assets`, `order_events`.
6. User consumes assets at:
   - Viewer: `/cuento/:id/leer`
   - PDF: `/api/orders/:id/digital-pdf`

## Backoffice
- `/admin/fx-rates`
- `/admin/print-jobs`
- `/admin/metrics`
  - shows preview volume, preview-to-paid conversion, estimated preview IA cost, and preview kill-switch status

## Smoke E2E
```bash
npm run lint
npm run build
npm run test:e2e
```

## Production smoke checklist
- Homepage renders in Vercel
- `/crear` loads and preview API responds
- Login works against Supabase
- `POST /api/orders` works for authenticated users
- `POST /api/orders/quote` returns quote
- `POST /api/checkout/session` returns redirect URL
- Stripe webhook marks order as paid and triggers generation
- Mercado Pago webhook endpoint is reachable and ready for activation
- `/robots.txt` and `/sitemap.xml` resolve correctly

## Runbook
### Verify paid orders
- Check `/admin/metrics`
- Inspect `/api/orders/:id`
- Confirm `payments.status = paid`
- Confirm `orders.status` transitions to `paid`, `generating`, then `ready_digital` or `print_queued`

### Retry generation
- Call `POST /api/generate` with `{ "order_id": "...", "retry": true }` as an authenticated admin user.

### Validate print pipeline
- Check `/admin/print-jobs`
- Confirm `print_jobs.status` transitions from `queued` onward
- Inspect `order_events` for `digital_ready`, `shipping_address_captured`, and fulfillment transitions

## Funnel events (PostHog)
- `landing_view`
- `landing_cta_click`
- `wizard_step_view`
- `wizard_step_completed`
- `wizard_step_blocked`
- `preview_generated`
- `checkout_started`
- `checkout_redirected`
- `checkout_error`
- `auth_redirect_required`

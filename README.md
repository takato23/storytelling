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
GEMINI_IMAGE_MODEL=gemini-3.1-flash

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

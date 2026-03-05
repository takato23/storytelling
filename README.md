# StoryMagic MVP Comercial

Stack: `Next.js + Supabase + Stripe`

## Run local
```bash
npm install
npm run dev
```

## Required env
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
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
# For cheaper image generation flow (Nano Banana / Flash style)
GEMINI_IMAGE_MODEL=gemini-3.1-flash

# Product analytics (optional, no-op if missing)
NEXT_PUBLIC_POSTHOG_KEY=...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Commercial flow
1. `POST /api/orders` creates draft + personalization.
2. `POST /api/orders/quote` creates quote with FX snapshot.
3. `POST /api/checkout/session` creates Stripe checkout.
4. Stripe webhook (`/api/webhooks/stripe`) transitions payment and triggers generation.
5. Generation writes `generated_pages`, `digital_assets`, `order_events`.
6. User consumes assets at:
   - Viewer: `/cuento/:id/leer`
   - PDF: `/api/orders/:id/digital-pdf`

## Backoffice
- `/admin/fx-rates`
- `/admin/print-jobs`
- `/admin/metrics`

## Smoke E2E
```bash
npm run build
npm run test:e2e
```

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

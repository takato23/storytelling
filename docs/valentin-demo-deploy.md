# Valentín Demo / Deploy Checklist

## Runtime

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY`
- `MERCADOPAGO_ACCESS_TOKEN`
- `CHECKOUT_PROVIDER=mercadopago`
- `DEFAULT_USD_TO_ARS`
- `ALLOW_LOCAL_PREVIEW_BYPASS=false`

## Supabase

- Story `id=3` synced as `Valentín y la noche de los dinosaurios`
- Bucket privado `reference-looks`
- Bucket privado `book-renders`

## Verificación previa

- `npm run build`
- `node scripts/sync-valentin-story.mjs`
- Smoke preview real:
  - levantar la app con `GEMINI_API_KEY=... npm run start -- --port 3006`
  - llamar `POST /api/personalize` con `action=generate`, `bookId=3`, foto base64
  - verificar `previewSessionId` y `pages.length === 6`
- Verificar en Storage:
  - `book-renders/preview-sessions/<previewSessionId>/...`
  - Las previews se sirven por signed URL, no por bucket público
- Verificar `/api/stories`:
  - 1 historia activa
  - slug `valentin-y-la-noche-de-los-dinosaurios`

## Demo funcional

- `/crear` muestra solo el libro dino
- La preview muestra portada + escenas reales personalizadas
- Checkout crea la orden con `preview_bundle`
- Post-pago usa el mismo bundle para completar el libro
- `/cuento/[id]/leer` consume `generated_pages`
- `/api/orders/[id]/digital-pdf` genera PDF ilustrado

## Riesgos operativos a revisar antes de producción

- Cuota y latencia de Gemini en imágenes con referencias
- Duración de generación final de 11 páginas
- Credenciales reales de Mercado Pago
- Migración futura de `middleware.ts` a `proxy.ts`

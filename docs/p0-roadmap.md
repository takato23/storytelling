# StoryMagic P0 Roadmap

## Objetivo

Llevar el funnel principal a una versión más clara, confiable y competitiva sin romper el modelo actual de órdenes.

## Ya implementado

- Legales y soporte reales enlazados desde el sitio.
- Claims de confianza más consistentes en home, FAQ y footer.
- Menú principal más enfocado en el cuento como producto central.
- Pricing orientado a valor y no solo a formato.
- Dos previews gratis por cuenta como oferta base.

## Siguiente paso recomendado

### Guest checkout sin login visible

No conviene intentar checkout anónimo puro todavía. El modelo actual depende de `auth.users`, `user_id` y RLS por ownership.

La versión segura es:

1. Capturar email antes de preview/checkout.
2. Resolver o crear un usuario invisible en backend usando ese email.
3. Permitir `orders`, `quotes` y `checkout session` con auth opcional y fallback a email.
4. Enviar magic link post-compra para que el comprador reclame su biblioteca.

## Orden de implementación

1. Extender schemas con `customer_email`.
2. Crear helper `resolveCheckoutUser()`.
3. Adaptar `/api/orders`, `/api/orders/quote` y `/api/checkout/session`.
4. Adaptar `/api/personalize` si queremos preview sin login.
5. Agregar claim flow post-compra.

## Riesgos que evitamos con este enfoque

- No tocamos `RLS` ni ownership de órdenes en esta etapa.
- No dejamos órdenes huérfanas sin usuario.
- No abrimos acceso público a assets o biblioteca.

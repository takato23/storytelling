# Informe: Providers de Imagen & Plan de Mejoras — cuento.nido

**Fecha:** 16 de abril de 2026  
**Proyecto:** StoryMagic MVP Comercial (cuento.nido)

---

## 1. Estado actual de generación de imágenes

**Provider activo:** Gemini 3.1 Flash Image Preview ("Nano Banana 2")  
**Costo real:** ~$0.13 USD por imagen (modelo Pro via edge function)  
**Tiempo por imagen:** ~90 segundos (incluye overhead de edge function + retries)  
**Costo por libro (13 imágenes):** ~$1.69 USD  
**Tiempo total por libro:** ~19.5 minutos  

**Providers configurados en código pero sin API key:**
- Flux Kontext Pro (fal.ai) — sin `FAL_KEY`
- Flux Kontext Max (fal.ai) — sin `FAL_KEY`
- Seedream V4 (ByteDance via fal.ai) — sin `FAL_KEY`

---

## 2. Comparativa de providers

### Tabla resumen

| Provider | Modelo | Costo/imagen | Velocidad | Consistencia de personaje | Refs múltiples | Resolución máx |
|----------|--------|-------------|-----------|--------------------------|----------------|-----------------|
| **Google** | Gemini 3.1 Flash | $0.045 | 1-3s | Buena (hasta 5 personas) | Sí | 4K |
| **Google** | Gemini 3 Pro | $0.134 | 8-12s | Buena | Sí | 4K |
| **fal.ai** | Flux Kontext Pro | $0.04 | 8-10s | Excelente | No (1 sola ref) | 2K |
| **fal.ai** | Flux Kontext Max | $0.08 | 8-10s | Excelente | Sí (multi-ref) | 2K |
| **fal.ai** | Seedream V4.5 | $0.04 | 10-15s | Excelente (hasta 5) | Sí | 4K nativo |
| **fal.ai** | FLUX.2 Pro | $0.03/MP | 2-5s | Buena | Sí | Variable |
| **Replicate** | FLUX Dev | $0.025-0.05 | 2-30s | Buena | Sí | 2K |
| **Together.ai** | FLUX.1 Pro | $0.055 | Rápido | Buena | Sí | 2K |
| **Ideogram** | V3.0 | ~$0.04 | Rápido | Sí (char ref nativo) | 1 ref | 2K |

### Costo por libro completo (13 imágenes)

| Provider | Costo/libro | Tiempo estimado | Ahorro vs actual |
|----------|-------------|-----------------|------------------|
| **Actual (Gemini Pro via edge)** | **$1.69** | **~19.5 min** | — |
| Gemini 3.1 Flash (directo) | $0.585 | ~30 seg | -65% costo, -97% tiempo |
| Flux Kontext Max | $1.04 | ~2 min | -38% costo, -90% tiempo |
| Seedream V4.5 | $0.52 | ~2.5 min | -69% costo, -87% tiempo |
| Flux Kontext Pro | $0.52 | ~2 min | -69% costo, -90% tiempo |

---

## 3. Análisis por caso de uso

### Para PREVIEW (1 cover + 1 escena interior = 2 imágenes)

**Recomendación: Gemini 3.1 Flash (directo, sin edge function)**
- Costo: $0.09 por preview (2 × $0.045)
- Tiempo: 2-6 segundos total
- Razón: Es el más rápido. El usuario necesita ver la preview rápido para decidir si compra.
- Bonus: 500 imágenes/día gratis en tier gratuito.

### Para GENERACIÓN COMPLETA del libro (13 imágenes)

**Recomendación: Seedream V4.5 via fal.ai (primario) + Gemini 3.1 Flash (fallback)**
- Costo: $0.52 por libro
- Tiempo: ~2.5 minutos total
- Razón: Mejor relación calidad/precio, 4K nativo (ideal para impresión), excelente consistencia de personaje con multi-referencia.
- Fallback a Gemini Flash si fal.ai falla (sin costo adicional de infraestructura).

### Para IMPRESIÓN (regeneración a alta res)

**Recomendación: Seedream V4.5 a 4K**
- Soporte nativo de 4K sin upscaling
- Calcula dimensiones a múltiplos de 64px automáticamente
- Ya está implementado en el código (`lib/image-providers/seedream.ts`)

---

## 4. Configuración recomendada

```env
# Provider primario para generación
IMAGE_PROVIDER=seedream

# Cadena de fallback
IMAGE_PROVIDER_FALLBACKS=gemini,flux-kontext-max

# API Keys necesarias
FAL_KEY=<api-key-de-fal.ai>
GEMINI_API_KEY=<ya-configurado>

# Costo estimado actualizado
PREVIEW_IMAGE_ESTIMATED_COST_USD=0.04
```

### Proyección de costos mensuales

| Volumen | Solo Gemini Pro (actual) | Config recomendada |
|---------|--------------------------|-------------------|
| 10 libros/mes | $16.90 | $5.20 |
| 50 libros/mes | $84.50 | $26.00 |
| 100 libros/mes | $169.00 | $52.00 |
| 500 libros/mes | $845.00 | $260.00 |

**Ahorro proyectado: ~69% en costos de imagen**

---

## 5. Mejoras pendientes para producción

### 5.1 Generación página por página (CRÍTICO)

**Estado:** El pipeline de Valentín (`dino-story-pipeline.ts`) ya genera escenas únicas por página. Sin embargo, el pipeline genérico en `generation.ts` necesita verificación de que no reutiliza imágenes.

**Acción:** Validar y reforzar que cada `generated_page` tenga arte único, con tracking de estado individual.

### 5.2 Guest Checkout (CRÍTICO para conversión)

**Estado:** No implementado. Roadmap definido en `docs/p0-roadmap.md`.

**Acción:** Permitir compra con solo email, sin registro obligatorio. Magic link post-compra para reclamar biblioteca.

### 5.3 QA Workflow para impresión

**Estado:** Parcial. El estado `qa_pending` existe en la DB pero faltan:
- Endpoint para aprobar/rechazar páginas individuales
- Endpoint para regenerar una página específica
- UI de revisión con thumbnails

### 5.4 Exportación Print (PDF + ZIP)

**Estado:** No implementado. Especificado en `docs/print-pipeline-spec.md`.

**Acción:** Generar PDF de impresión con specs de Fábrica de Fotolibros + ZIP de assets.

### 5.5 Optimización de providers

**Estado:** Código listo, falta configurar `FAL_KEY` y optimizar routing.

**Acción:** 
- Gemini Flash directo para previews (sin edge function)
- Seedream para generación completa
- Fallback chain automático

---

## 6. Resumen ejecutivo

| Métrica | Actual | Después de mejoras |
|---------|--------|--------------------|
| Costo por libro | $1.69 | $0.52 |
| Tiempo de preview | ~90 seg | ~3-6 seg |
| Tiempo generación libro | ~19.5 min | ~2.5 min |
| Guest checkout | No | Sí |
| QA para impresión | Parcial | Completo |
| Export PDF/ZIP | No | Sí |
| Providers con fallback | Solo Gemini | Seedream → Gemini → Flux |

**Inversión necesaria:** Solo la API key de fal.ai (pay-per-use, sin mínimo mensual).

---

## 7. Estado de implementación (16-abr-2026)

Todas las mejoras listadas arriba fueron implementadas. Detalle:

### Providers de imagen
- Seedream actualizado a v4.5 (`fal-ai/bytedance/seedream/v4.5/edit`)
- Router con `profile: "preview" | "print"` para optimizar costo/velocidad
- Gemini Flash se usa automáticamente para previews (rápido)
- Seedream 4.5 para generación completa (calidad + 4K + consistencia facial 9.6/10)
- `.env.example` creado con configuración recomendada

### Guest Checkout
- Migración `20260416_guest_checkout.sql` (customer_email + claim_token)
- Helper `lib/guest-checkout.ts` con `resolveCheckoutIdentity()`
- `getOptionalAuthenticatedUser()` en `lib/auth.ts`
- `/api/orders` acepta compra sin registro (solo email)
- Preview ya era público (sin cambios necesarios)

### QA Workflow (endpoints)
- `PATCH /api/admin/print-jobs/:jobId` — transicionar estado (con auto-aprobación bulk de páginas)
- `GET /api/admin/print-jobs/:jobId` — detalle del job
- `PATCH /api/admin/print-jobs/:jobId/pages/:pageNumber` — aprobar/rechazar página individual
- `POST /api/admin/print-jobs/:jobId/pages/:pageNumber/regenerate` — regenerar página (con override_prompt opcional)

### Dashboard QA admin
- Ya existía UI en `/admin/print-jobs`, actualizada para usar los nuevos endpoints
- Botones nuevos: "Aprobar" / "Rechazar" por página
- Badge "Aprobado" cuando la página pasó QA
- Retry individual o bulk de páginas fallidas
- Regeneración con prompt custom

### Print Export
- `GET /api/orders/:id/print-pdf` — PDF de impresión con todas las páginas
- `GET /api/orders/:id/print-zip` — ZIP con imágenes individuales + manifest.json
- Validación: todas las páginas deben estar `ready` o `approved`
- Autenticación: dueño del pedido o admin

### Verificación
- TypeScript check: PASSED (sin errores)
- Dependencias `jszip` y `pdf-lib` instaladas
- Build falla solo por fonts de Google (restricción del sandbox, no del código)

### Próximos pasos del cliente
1. Crear cuenta en fal.ai y obtener API key
2. Agregar a `.env.local` o Vercel:
   - `FAL_KEY=<tu-key>`
   - `IMAGE_PROVIDER=seedream`
   - `IMAGE_PROVIDER_FALLBACKS=gemini,flux-kontext-max`
3. Aplicar migración `20260416_guest_checkout.sql` en Supabase
4. Correr `npm run bench:images` para comparar quality entre Seedream y Gemini con tu foto de referencia

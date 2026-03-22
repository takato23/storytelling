# StoryMagic Print Pipeline Spec

## Objetivo

Definir un flujo estable para venta digital y venta física de cuentos personalizados,
con revisión operativa antes de imprimir y con assets preparados para
`https://www.fabricadefotolibros.com/`.

## Infraestructura de la clienta

La app debe quedar montada sobre infraestructura propia de la clienta:

- `Vercel` propio
- `Supabase` propio
- `Gemini API key` propia

Razones:

- separación clara de costos
- independencia operativa
- facilidad de mantenimiento futuro
- menor riesgo comercial si luego cambia el soporte o el proveedor

Tu rol queda como:

- desarrollo inicial
- configuración de despliegue
- mantenimiento evolutivo
- soporte operativo

Este documento toma como base el flujo ya existente del proyecto:

- `preview` en wizard
- `orders`
- `order_quotes`
- `payments`
- `generation_jobs`
- `generated_pages`
- `digital_assets`
- `print_jobs`

## Decisión de lanzamiento

### Formato físico principal

Lanzar primero un solo producto físico principal:

- `Fotolibro 21 x 14,8 cm`
- `Tapa dura`
- `22 páginas base`

Razones:

- Es el mejor equilibrio entre costo, percepción de valor y riesgo operativo.
- Exige menos resolución que los formatos grandes.
- Es más fácil de maquetar como cuento infantil horizontal.
- Reduce complejidad comercial en el MVP.

### Formato físico premium

Segundo formato opcional para una fase posterior:

- `Fotolibro 27,9 x 21,6 cm`
- `Tapa dura`

No lanzar inicialmente:

- `41 x 29 cm`
- cubiertas especiales
- demasiadas variantes de papel/caja/regalo

## Ratios y resoluciones

## Regla general

No pensar en `2K` o `4K` como etiqueta de marketing. Pensar en:

- tamaño físico final
- orientación
- página simple vs doble página
- resolución exportada

## Ratio del formato principal

Para `21 x 14,8 cm`, la página horizontal tiene ratio:

- `21 / 14.8 = 1.4189`

Ratio recomendado de trabajo:

- `1.42:1`

## Resoluciones recomendadas

### Página simple 21 x 14,8 cm

- mínimo aceptable: `2480 x 1750 px`
- recomendado: `3000 x 2115 px`
- ideal: `3600 x 2540 px`

### Doble página abierta 42 x 14,8 cm

- mínimo aceptable: `4960 x 1750 px`
- recomendado: `6000 x 2115 px`
- ideal: `7200 x 2540 px`

### Formato premium 27,9 x 21,6 cm

Página simple:

- mínimo aceptable: `3294 x 2550 px`
- recomendado: `3600 x 2785 px`
- ideal: `4200 x 3250 px`

Doble página:

- mínimo aceptable: `6588 x 2550 px`
- recomendado: `7200 x 2785 px`
- ideal: `8400 x 3250 px`

## Regla de generación

Para el MVP físico:

- no generar dobles páginas con IA
- no generar páginas enteras con texto incrustado
- generar ilustraciones por página
- componer la página final en el sistema

Esto baja mucho el riesgo de:

- recortes raros
- texto mal posicionado
- errores en el lomo
- pérdida de calidad en imprenta

## Layout editorial recomendado

## Enfoque

Usar una plantilla fija por tipo de página. La IA genera solo arte.
La maquetación final la hace StoryMagic.

## Tipos de página

### 1. Tapa

- ratio final: `1.42:1`
- puede usar arte full bleed
- incluir título, nombre del niño y branding

### 2. Portadilla / dedicatoria

- fondo limpio
- texto editable
- opcionalmente una mini ilustración

### 3. Página estándar ilustrada

Recomendación MVP:

- imagen ocupando `55% - 65%` de la página
- bloque de texto ocupando `35% - 45%`
- márgenes de seguridad fijos

Ratio interno sugerido para la ilustración:

- `4:3` o `1.3:1`

Ventaja:

- la ilustración queda estable aunque cambie el largo del texto
- no dependemos de crops exactos de imprenta

### 4. Página especial full bleed

Usar solo en escenas clave:

- apertura del cuento
- clímax
- cierre

Regla:

- máximo `2` o `3` páginas full bleed por libro en el MVP

### 5. Contratapa

- diseño fijo
- sin depender de IA

## Regla de seguridad de impresión

Cuando el arte llegue al borde:

- dejar overscan o sangrado visual
- no ubicar texto importante cerca de bordes
- no ubicar rostros importantes demasiado pegados al lomo

Aunque el sistema final se exporte a ratio exacto, el arte fuente debe tener
algo de aire para tolerar corte.

## Flujo comercial y operativo

## 1. Preview

Estado actual del repo:

- el usuario personaliza cuento
- genera preview
- elige `digital` o `print`

Regla propuesta:

- preview con `1` imagen principal
- opcional: `1` preview secundaria de interior
- watermark visible

Objetivo:

- vender la idea sin gastar todavía el costo completo de producción

## 2. Orden

Al crear la orden:

- guardar formato `digital | print`
- guardar `print_options`
- guardar `shipping_address` si aplica
- guardar snapshot de preview aprobada por el usuario

## 3. Pago

Después del webhook:

- pasar a `paid`
- disparar generación full

## 4. Generación full

La generación full debe producir:

- texto final por página
- ilustración final por página
- assets para viewer digital
- assets para PDF digital
- assets de impresión
- miniaturas de revisión

## 5. QA interna

Antes de liberar impresión:

- no pasar directo a `print_queued`
- pasar primero a `qa_pending`

En esta etapa:

- validar que existan todas las páginas
- validar resolución mínima
- validar relación de aspecto
- validar que no haya imágenes vacías o corruptas
- validar que no haya repetición accidental de páginas
- permitir regenerar una sola página

## 6. Revisión de la dueña

Dashboard operativo para la dueña:

- lista de pedidos físicos pendientes
- miniaturas de tapa + páginas
- estado por página
- botón `regenerar página`
- botón `descargar PDF imprenta`
- botón `descargar ZIP de páginas`
- botón `aprobar para impresión`

## 7. Impresión

Recién con aprobación manual:

- pasar a `print_queued`
- luego `in_production`
- luego `packed`
- luego `shipped`
- luego `delivered`

## Pipeline técnico propuesto

## Assets a producir por orden

Separar los assets por propósito:

- `preview_lowres`
- `viewer_page`
- `digital_pdf`
- `print_page`
- `print_pdf`
- `thumbnail`

## Regla de almacenamiento

No usar una sola URL de imagen para todo.

Cada página debería tener al menos:

- `page_number`
- `page_type`
- `render_purpose`
- `width_px`
- `height_px`
- `storage_path`
- `status`
- `error_message`
- `version`

## QA por página

Agregar estado por página:

- `queued`
- `processing`
- `ready`
- `failed`
- `approved`

Esto permite reintentar solamente la página rota en vez de regenerar el libro completo.

## Riesgo actual del repo

Hoy el flujo de generación en [`lib/generation.ts`](/Users/santiagobalosky/Documents/Storytelling/lib/generation.ts)
no está listo para impresión real: actualmente reutiliza la misma imagen generada
para todas las páginas guardadas en `generated_pages`.

Eso sirve como placeholder de flujo, pero no para producción física.

## Estados propuestos

## Orders

Estados actuales:

- `draft`
- `pending_payment`
- `paid`
- `generating`
- `ready_digital`
- `print_queued`
- `in_production`
- `packed`
- `shipped`
- `delivered`
- `failed`
- `cancelled`

Estados nuevos recomendados:

- `qa_pending`
- `qa_failed`
- `ready_print_assets`

Flujo recomendado:

- `paid`
- `generating`
- `qa_pending`
- `ready_digital` para digital puro
- `ready_print_assets` para impresión aprobable
- `print_queued`

## Print jobs

Estados recomendados:

- `queued`
- `review_required`
- `approved`
- `in_production`
- `packed`
- `shipped`
- `delivered`
- `failed`

## Qué hay que acomodar en la página

## Wizard / checkout

### Simplificar configurador físico

El configurador actual en [`components/features/print/PrintConfigurator.tsx`](/Users/santiagobalosky/Documents/Storytelling/components/features/print/PrintConfigurator.tsx)
es demasiado abstracto para la imprenta real.

Cambios recomendados:

- reemplazar `soft | hard | premium` por productos reales de imprenta
- agregar `size` explícito
- limitar variantes de lanzamiento

MVP recomendado:

- `size: "21x14_8"`
- `cover: "hard"`
- `paper: "standard"`

Fase 2:

- `size: "27_9x21_6"`

## Pricing

El pricing actual en [`lib/pricing.ts`](/Users/santiagobalosky/Documents/Storytelling/lib/pricing.ts)
usa precio base por cuento y envío.

Para impresión real conviene:

- precio base del cuento
- costo base de imprenta
- costo por páginas extra
- margen comercial
- envío

Fórmula sugerida:

- `precio_final = costo_imprenta + margen_storymagic + envío`

Para el formato principal:

- costo imprenta base: `ARS 21500`
- páginas base: `22`
- adicional por página: `ARS 350`

## PDF

El PDF actual en [`app/api/orders/[id]/digital-pdf/route.ts`](/Users/santiagobalosky/Documents/Storytelling/app/api/orders/[id]/digital-pdf/route.ts)
es un PDF simple de lectura.

Separar:

- `digital_pdf` para cliente
- `print_pdf` para imprenta

No deben ser el mismo asset.

## Admin

El endpoint [`app/api/admin/print-jobs/route.ts`](/Users/santiagobalosky/Documents/Storytelling/app/api/admin/print-jobs/route.ts)
ya es buena base para la cola operativa.

Extensiones recomendadas:

- contar páginas listas/fallidas
- preview de tapa
- preview de 3 páginas internas
- flag `requires_review`
- links a `print_pdf` y `zip`
- acciones de `approve`, `reject`, `retry_failed_pages`

## Roadmap de implementación

## Fase 1. Acomodar producto físico

- fijar un único tamaño de lanzamiento
- adaptar `PrintConfigurator`
- adaptar pricing real de imprenta
- almacenar `size`, `cover`, `base_pages`, `extra_pages`

## Fase 2. Acomodar generación

- generar arte por página
- guardar width/height/status por página
- separar assets viewer vs print
- agregar reintento por página

## Fase 3. QA

- agregar `qa_pending`
- agregar tablero de revisión
- agregar aprobación manual antes de `print_queued`

## Fase 4. Entrega a imprenta

- exportar `print_pdf`
- exportar `zip` de páginas
- checklist manual para subir a Fábrica de Fotolibros

## Decisiones cerradas para avanzar

- lanzamiento físico con `21 x 14,8 cm tapa dura`
- ratio editorial principal `1.42:1`
- ilustraciones IA dentro de layout fijo, no página completa con texto
- resolución recomendada de trabajo: `3000 x 2115 px` o superior por página
- revisión manual obligatoria antes de imprimir
- digital y print deben separarse como assets distintos

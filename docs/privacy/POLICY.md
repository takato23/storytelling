# Política de Privacidad — StoryMagic

**Última actualización:** 2026-04-15

Este documento describe cómo StoryMagic recolecta, usa, almacena y elimina las fotografías subidas por las personas usuarias, con foco en imágenes de menores de edad. Está redactado para cumplir con:

- **Argentina:** Ley N° 25.326 de Protección de Datos Personales y Disposiciones de la AAIP.
- **Unión Europea:** Reglamento General de Protección de Datos (RGPD / GDPR), arts. 6 y 8.
- **Estados Unidos:** COPPA, cuando el cliente final sea menor de 13 años.

---

## 1. Quién sube la foto y bajo qué consentimiento

Solo una madre, padre, tutor o tutora legal del menor puede subir fotos. Al marcar la casilla de consentimiento antes de subir una imagen, la persona declara que:

1. Es titular o representante legal de la patria potestad / tutela del menor fotografiado.
2. Autoriza expresamente el uso de la foto con el único fin de generar las ilustraciones del libro personalizado.
3. Acepta los términos de retención, tratamiento y eliminación descritos en esta política.

El consentimiento es registrado en la tabla `consent_records` (ver `supabase/migrations/20260415_consent_records.sql`) con timestamp, IP hash y user-agent. Se guarda una copia por cada sesión de generación.

## 2. Finalidades permitidas

La foto original (reference image) se usa **exclusivamente** para:

- Extraer características visuales (color de pelo, ojos, piel, edad aproximada) que alimentan el prompt de texto.
- Pasarla como referencia al modelo de imagen para preservar la identidad del personaje en las escenas generadas.

**No se usa** para entrenamiento de modelos, publicidad, perfilamiento ni ningún otro fin. No se comparte con terceros salvo el proveedor de IA contratado, quien actúa como encargado del tratamiento bajo contrato que prohíbe su reutilización.

## 3. Proveedores de IA (encargados del tratamiento)

El producto puede rutear la generación de imágenes a uno de los siguientes proveedores, configurable por variable de entorno `IMAGE_PROVIDER`:

| Proveedor | Endpoint | Retención del proveedor | Política |
|---|---|---|---|
| Google Gemini (Nano Banana 2) | `gemini-3.1-flash-image-preview` | 0 días si `disableLogging=true` | https://ai.google.dev/gemini-api/terms |
| fal.ai (Flux Kontext Pro/Max) | `fal-ai/flux-pro/kontext/...` | No retiene inputs | https://fal.ai/terms |
| fal.ai (Seedream v4) | `fal-ai/bytedance/seedream/v4/edit` | No retiene inputs | https://fal.ai/terms |

Antes de cambiar de proveedor, actualizar esta tabla y comunicarlo a las personas usuarias activas.

## 4. Retención y eliminación

- **Foto de referencia (bucket `preview-uploads` en Supabase Storage):** se elimina automáticamente a las **24 horas** de completada la generación del pedido (configurable vía `CHILD_PHOTO_RETENTION_HOURS`).
- **Imágenes generadas que forman parte del libro comprado:** se conservan mientras el libro esté accesible al cliente; se eliminan a los 90 días de completada la entrega.
- **Borrado por pedido expreso:** cualquier persona usuaria puede solicitar la eliminación inmediata escribiendo a contacto@storymagic.app. Se responde en un máximo de 10 días hábiles.

El job de purga corre vía `scripts/privacy/purge-child-photos.ts` (programable en Vercel Cron o como cron job externo). Cada borrado se loggea en `order_events` como tipo `child_photo_purged`.

## 5. Seguridad

- Almacenamiento: Supabase Storage con RLS. Las fotos de referencia viven en un bucket privado. El cliente final accede mediante URLs firmadas con TTL corto.
- Transporte: siempre HTTPS.
- Backups: Supabase aplica backups cifrados de 7 días. La purga programada **no** afecta backups; las fotos podrían persistir hasta 7 días adicionales en backup antes de eliminarse por rotación.

## 6. Derechos de la persona titular

- **Acceso:** puede solicitar copia de la foto subida y de los metadatos asociados.
- **Rectificación:** puede subir una nueva foto que reemplaza la anterior.
- **Supresión:** puede pedir el borrado inmediato en cualquier momento.
- **Oposición:** puede oponerse al tratamiento, en cuyo caso se cancela la generación y se borra la foto.

Canal: contacto@storymagic.app

## 7. Menores sin consentimiento verificable

Si el sistema detecta que la persona que sube la foto podría no ser la persona adulta responsable del menor, o si recibimos reclamo fundado en este sentido, se suspende la generación y se borra la foto en 24 horas.

## 8. Cambios en esta política

Se publica el historial de cambios en el repositorio. Cambios sustantivos (nuevo proveedor, cambio de finalidad, extensión de retención) se comunican por mail a clientes activos con al menos 15 días de antelación.

---

**Contacto:** contacto@storymagic.app

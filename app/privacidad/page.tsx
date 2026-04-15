import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/LegalPage"

export const metadata: Metadata = {
    title: "Política de privacidad | StoryMagic",
    description:
        "Cómo StoryMagic recolecta, usa, almacena y elimina fotos de menores subidas para generar libros personalizados. Cumplimiento Ley 25.326 (Argentina), GDPR y COPPA.",
}

export default function PrivacidadPage() {
    return (
        <LegalPage
            eyebrow="Privacidad"
            title="Política de privacidad"
            intro="Esta política describe cómo StoryMagic recolecta, usa, almacena y elimina las fotos que las personas usuarias suben para generar los libros personalizados, con foco en el tratamiento de imágenes de menores de edad."
            updatedAt="15 de abril de 2026"
            contactHref="/contacto"
            contactLabel="Escribir a soporte"
            footerNote="Para ejercer cualquier derecho (acceso, rectificación, supresión, oposición) escribí a contacto@storymagic.app. Respondemos en un máximo de 10 días hábiles."
            highlights={[
                {
                    label: "Cumplimiento",
                    value: "AR · UE · US",
                    description:
                        "Ley 25.326 y disposiciones de la AAIP (Argentina), GDPR arts. 6 y 8 (UE) y COPPA cuando el protagonista es menor de 13 años (EE. UU.).",
                },
                {
                    label: "Retención de foto",
                    value: "24 horas",
                    description:
                        "La foto de referencia se borra automáticamente dentro de las 24 h de completada la generación. Configurable vía CHILD_PHOTO_RETENTION_HOURS.",
                },
                {
                    label: "Uso",
                    value: "Solo ilustraciones",
                    description:
                        "No usamos la foto para entrenar modelos, ni para publicidad o perfilamiento. Solo se pasa al proveedor de IA contratado para preservar la identidad del personaje.",
                },
            ]}
            sections={[
                {
                    title: "1. Quién sube la foto y bajo qué consentimiento",
                    paragraphs: [
                        "Solo una madre, padre, tutor o tutora legal del menor puede subir fotos. Al marcar la casilla de consentimiento antes de subir una imagen, la persona declara que:",
                    ],
                    bullets: [
                        "Es titular o representante legal de la patria potestad o tutela del menor fotografiado.",
                        "Autoriza expresamente el uso de la foto con el único fin de generar las ilustraciones del libro personalizado.",
                        "Acepta los términos de retención, tratamiento y eliminación descritos en esta política.",
                    ],
                },
                {
                    title: "2. Registro del consentimiento",
                    paragraphs: [
                        "El consentimiento se registra en la tabla consent_records con timestamp, hash de IP y user-agent. Se guarda una copia por cada sesión de generación para auditoría.",
                        "Si cambia sustancialmente la política (por ejemplo, un nuevo proveedor de IA o una finalidad adicional), se solicita un nuevo consentimiento con la versión actualizada.",
                    ],
                },
                {
                    title: "3. Finalidades permitidas",
                    paragraphs: [
                        "La foto original, o foto de referencia, se usa exclusivamente para extraer características visuales como color de pelo, ojos, piel y edad aproximada que alimentan el prompt de texto, y para pasarla como referencia al modelo de imagen que preserva la identidad del personaje en las escenas generadas.",
                        "No se usa para entrenamiento de modelos, publicidad, perfilamiento ni ningún otro fin. No se comparte con terceros salvo el proveedor de IA contratado, que actúa como encargado del tratamiento bajo contrato que prohíbe su reutilización.",
                    ],
                },
                {
                    title: "4. Proveedores de IA (encargados del tratamiento)",
                    paragraphs: [
                        "El producto puede rutear la generación de imágenes a uno de los siguientes proveedores, configurable por variable de entorno IMAGE_PROVIDER. Antes de cambiar de proveedor activo actualizamos esta política y comunicamos el cambio a las personas usuarias activas.",
                    ],
                    bullets: [
                        "Google Gemini (Nano Banana 2 — gemini-3.1-flash-image-preview). Retención del proveedor: 0 días con logging desactivado. Términos: ai.google.dev/gemini-api/terms.",
                        "fal.ai — Flux Kontext Pro y Max (fal-ai/flux-pro/kontext/...). El proveedor no retiene inputs. Términos: fal.ai/terms.",
                        "fal.ai — Seedream v4 (fal-ai/bytedance/seedream/v4/edit). El proveedor no retiene inputs. Términos: fal.ai/terms.",
                    ],
                },
                {
                    title: "5. Retención y eliminación",
                    paragraphs: [
                        "La foto de referencia vive en el bucket privado preview-uploads de Supabase Storage y se elimina automáticamente a las 24 horas de completada la generación del pedido. El umbral es configurable vía CHILD_PHOTO_RETENTION_HOURS.",
                        "Las imágenes generadas que forman parte del libro comprado se conservan mientras el libro esté accesible al cliente, y se eliminan a los 90 días de completada la entrega.",
                        "Cualquier persona usuaria puede solicitar la eliminación inmediata escribiendo a contacto@storymagic.app. Respondemos en un máximo de 10 días hábiles.",
                        "El job de purga corre vía scripts/privacy/purge-child-photos.ts, programado en Vercel Cron. Cada borrado se loggea en order_events como child_photo_purged.",
                    ],
                },
                {
                    title: "6. Seguridad",
                    paragraphs: [
                        "El almacenamiento usa Supabase Storage con RLS y las fotos de referencia viven en un bucket privado. El cliente final accede mediante URLs firmadas con TTL corto. Todo el transporte es HTTPS.",
                        "Supabase aplica backups cifrados de 7 días. La purga programada no afecta los backups, por lo que una foto podría persistir hasta 7 días adicionales en backup antes de eliminarse por rotación.",
                    ],
                },
                {
                    title: "7. Derechos de la persona titular",
                    paragraphs: [
                        "Podés ejercer los siguientes derechos en cualquier momento escribiendo a contacto@storymagic.app:",
                    ],
                    bullets: [
                        "Acceso: solicitar copia de la foto subida y de los metadatos asociados.",
                        "Rectificación: subir una nueva foto que reemplaza la anterior.",
                        "Supresión: pedir el borrado inmediato.",
                        "Oposición: oponerte al tratamiento; en ese caso se cancela la generación y se borra la foto.",
                    ],
                },
                {
                    title: "8. Menores sin consentimiento verificable",
                    paragraphs: [
                        "Si el sistema detecta que la persona que sube la foto podría no ser la persona adulta responsable del menor, o si recibimos un reclamo fundado en ese sentido, suspendemos la generación y borramos la foto en un plazo máximo de 24 horas.",
                    ],
                },
                {
                    title: "9. Cambios en esta política",
                    paragraphs: [
                        "Publicamos el historial de cambios en el repositorio. Los cambios sustantivos, como un nuevo proveedor, un cambio de finalidad o una extensión de retención, se comunican por mail a clientes activos con al menos 15 días de antelación.",
                        "Contacto para cualquier consulta: contacto@storymagic.app.",
                    ],
                },
            ]}
        />
    )
}

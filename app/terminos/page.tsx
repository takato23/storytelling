import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/LegalPage"

export const metadata: Metadata = {
    title: "Términos y condiciones | StoryMagic",
    description: "Condiciones de uso, compra, personalización y entrega de StoryMagic.",
}

export default function TerminosPage() {
    return (
        <LegalPage
            eyebrow="Términos"
            title="Términos y condiciones"
            intro="Este documento resume cómo funciona StoryMagic cuando navegas, personalizas y compras un cuento. Mantiene las reglas básicas del servicio, el proceso de pago y lo que puedes esperar de la producción."
            updatedAt="19 de marzo de 2026"
            contactHref="/soporte"
            contactLabel="Ir a soporte"
            footerNote="Para dudas sobre una orden, soporte o facturación, primero revisa la página de soporte. Si hace falta, te derivamos desde ahí al formulario de contacto."
            highlights={[
                { label: "Producto", value: "Cuentos personalizados", description: "El servicio genera una historia digital o impresa a partir de los datos y la foto que subes." },
                { label: "Pago", value: "Compra confirmada", description: "La producción final comienza una vez que el pago y la orden quedan confirmados." },
                { label: "Contenido", value: "Uso autorizado", description: "Solo uses fotos y datos sobre los que tengas permiso para compartir y procesar." },
            ]}
            sections={[
                {
                    title: "1. Alcance del servicio",
                    paragraphs: [
                        "StoryMagic ofrece la creación de cuentos infantiles personalizados con ayuda de IA. El resultado puede entregarse en formato digital, impreso o ambos, según la opción elegida en el checkout.",
                        "La experiencia incluye una vista previa previa al pago para que revises la dirección creativa antes de confirmar la compra final.",
                    ],
                },
                {
                    title: "2. Compra y personalización",
                    paragraphs: [
                        "Al completar el flujo de compra, confirmas que la información enviada es correcta y que tienes autorización para usar la foto y los datos del menor o de la persona protagonista.",
                        "La personalización puede incluir nombre, edad aproximada, género narrativo, nivel de lectura, historia elegida y otros detalles del pedido.",
                    ],
                },
                {
                    title: "3. Precios y pagos",
                    paragraphs: [
                        "Los precios visibles en el sitio son referenciales hasta que la orden se confirma en checkout. El importe final puede variar por formato, envío, moneda y ajustes operativos.",
                        "El pago se procesa mediante el proveedor disponible para tu compra. Si existe un problema de cobro o conciliación, la orden no se considera finalizada hasta que el sistema lo confirme.",
                    ],
                },
                {
                    title: "4. Producción y entrega",
                    paragraphs: [
                        "La producción del libro comienza después de la confirmación del pago. Los tiempos de generación, impresión y despacho dependen de la cola operativa y del destino de envío.",
                        "Si una orden requiere revisión manual por calidad, datos incompletos o incidencias logísticas, podemos pausar el proceso hasta resolverlo.",
                    ],
                },
                {
                    title: "5. Propiedad intelectual y uso",
                    paragraphs: [
                        "El contenido creativo, la marca y los materiales de StoryMagic siguen siendo de StoryMagic o de sus licenciatarios. La compra no transfiere derechos sobre la plataforma ni sobre las plantillas base.",
                        "El usuario conserva la responsabilidad sobre el material que sube y sobre el uso autorizado de imágenes de terceros.",
                    ],
                },
            ]}
        />
    )
}


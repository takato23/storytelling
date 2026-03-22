import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/LegalPage"

export const metadata: Metadata = {
    title: "Envíos | StoryMagic",
    description: "Información sobre producción, despacho y seguimiento de pedidos impresos.",
}

export default function EnviosPage() {
    return (
        <LegalPage
            eyebrow="Envíos"
            title="Envíos y entregas"
            intro="Esta página resume cómo gestionamos la producción, el despacho y la entrega de los pedidos impresos. La ventana final depende del destino y de la cola operativa."
            updatedAt="19 de marzo de 2026"
            contactHref="/soporte"
            contactLabel="Ir a soporte"
            footerNote="Si tu pedido ya fue despachado y necesitas ayuda con la entrega, soporte centraliza la revisión del caso."
            highlights={[
                { label: "Cobertura", value: "Envíos según destino", description: "La disponibilidad y el costo final dependen de la dirección de entrega y del servicio logístico activo." },
                { label: "Producción", value: "Después del pago", description: "La impresión y el armado comienzan cuando la orden queda confirmada." },
                { label: "Seguimiento", value: "Estado por pedido", description: "Podemos indicarte el estado operativo del pedido cuando esté disponible en el sistema." },
            ]}
            sections={[
                {
                    title: "1. Cómo funciona el despacho",
                    paragraphs: [
                        "Los pedidos impresos pasan por una etapa de producción y luego por despacho. Por eso el tiempo total no es el mismo que una entrega digital.",
                        "Antes de confirmar el pago, verás el resumen del formato y del envío para evitar sorpresas al final.",
                    ],
                },
                {
                    title: "2. Dirección de entrega",
                    paragraphs: [
                        "Te pedimos una dirección completa y válida para evitar demoras. Si detectamos datos incompletos, podemos pausar la orden hasta corregirlos.",
                        "Si el paquete vuelve por un error en la dirección proporcionada, la reexpedición puede requerir un ajuste adicional.",
                    ],
                },
                {
                    title: "3. Tiempos",
                    paragraphs: [
                        "Los plazos dependen de la cola de impresión, del tipo de formato y del destino de entrega. El checkout muestra una referencia antes de finalizar el pago.",
                        "En caso de campañas, alta demanda o incidencias logísticas, el tiempo puede extenderse ligeramente.",
                    ],
                },
                {
                    title: "4. Problemas de entrega",
                    paragraphs: [
                        "Si el pedido se retrasa, llega dañado o no coincide con lo esperado, revisamos el caso y te indicamos la solución correspondiente.",
                        "Para acelerar la respuesta, usa la página de soporte y comparte el número de pedido.",
                    ],
                },
            ]}
        />
    )
}


import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/LegalPage"

export const metadata: Metadata = {
    title: "Devoluciones | StoryMagic",
    description: "Política de devoluciones, reimpresiones y casos de incidencia.",
}

export default function DevolucionesPage() {
    return (
        <LegalPage
            eyebrow="Devoluciones"
            title="Devoluciones y reimpresiones"
            intro="Explicamos cuándo revisamos una devolución, cuándo corresponde una reimpresión y cómo gestionar una incidencia de calidad o entrega."
            updatedAt="19 de marzo de 2026"
            contactHref="/soporte"
            contactLabel="Ir a soporte"
            footerNote="Si tienes una incidencia, soporte la revisa y decide si corresponde reimpresión, reemplazo o devolución según el caso."
            highlights={[
                { label: "Digital", value: "Revisión caso a caso", description: "Los productos digitales se revisan según el estado del pedido y la normativa aplicable." },
                { label: "Impreso", value: "Daños o errores", description: "Si el libro llega dañado o con un error de producción, lo revisamos para reemplazo o solución equivalente." },
                { label: "Plazo", value: "Tan pronto como puedas", description: "Cuanto antes reportes la incidencia, antes podemos verificarla y resolverla." },
            ]}
            sections={[
                {
                    title: "1. Cuándo aplica una revisión",
                    paragraphs: [
                        "Revisamos casos de productos dañados, errores de producción, problemas de entrega o incidencias detectadas al recibir el pedido.",
                        "Si el problema se debe a datos incorrectos enviados por el usuario, la solución puede ser distinta según el caso.",
                    ],
                },
                {
                    title: "2. Productos digitales",
                    paragraphs: [
                        "Los productos digitales o generados a pedido pueden tener una política más restrictiva una vez que se entregan o comienzan a procesarse, salvo que la ley local exija otra cosa.",
                        "Si detectas un error técnico o una falla en la entrega, revisamos la situación para corregirla cuando corresponda.",
                    ],
                },
                {
                    title: "3. Productos impresos",
                    paragraphs: [
                        "Si el libro llega dañado, incompleto o con un defecto de producción, lo normal es que revisemos reemplazo o reimpresión.",
                        "Cuando se trata de un cambio por gusto personal y no por incidencia operativa, la solución depende del estado del pedido y de la etapa de producción.",
                    ],
                },
                {
                    title: "4. Cómo abrir un caso",
                    paragraphs: [
                        "Usa la página de soporte y comparte el número de pedido, una breve descripción del problema y, si puedes, fotos del producto o del embalaje.",
                        "Con esa información podemos evaluar más rápido si corresponde devolución, reimpresión o una solución alternativa.",
                    ],
                },
            ]}
        />
    )
}

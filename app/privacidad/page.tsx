import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/LegalPage"

export const metadata: Metadata = {
    title: "Política de privacidad | StoryMagic",
    description: "Cómo recopilamos, usamos y protegemos datos personales en StoryMagic.",
}

export default function PrivacidadPage() {
    return (
        <LegalPage
            eyebrow="Privacidad"
            title="Política de privacidad"
            intro="Explicamos qué datos tratamos, por qué los usamos y cómo puedes ejercer control sobre tu información dentro de StoryMagic."
            updatedAt="19 de marzo de 2026"
            contactHref="/soporte"
            contactLabel="Ir a soporte"
            footerNote="Si necesitas ejercer un derecho de privacidad o pedir una corrección sobre un pedido, el soporte centraliza esas solicitudes para responder por email."
            highlights={[
                { label: "Datos", value: "Foto y perfil", description: "Procesamos la imagen subida, datos del protagonista y la información necesaria para generar y entregar el pedido." },
                { label: "Finalidad", value: "Generar el cuento", description: "Usamos la información para crear la vista previa, completar la orden y gestionar soporte operativo." },
                { label: "Retención", value: "Solo lo necesario", description: "Conservamos la información durante el tiempo requerido para operar, resolver incidencias y cumplir obligaciones." },
            ]}
            sections={[
                {
                    title: "1. Qué información recopilamos",
                    paragraphs: [
                        "Podemos recopilar datos que nos compartes de forma directa, como nombre, correo, dirección de envío, detalles del protagonista, foto y preferencias de compra.",
                        "También podemos recibir información técnica básica del navegador para seguridad, rendimiento y analítica del sitio.",
                    ],
                },
                {
                    title: "2. Para qué usamos los datos",
                    paragraphs: [
                        "Usamos la información para generar la vista previa, producir el cuento, procesar pagos, gestionar envíos y responder a solicitudes de soporte.",
                        "Si activamos analítica o medición, lo hacemos para entender el comportamiento del sitio y mejorar el funnel, no para revender datos personales.",
                    ],
                },
                {
                    title: "3. Menores de edad",
                    paragraphs: [
                        "StoryMagic está pensado para cuentos infantiles, pero la cuenta y la compra las realiza un adulto responsable. Si subes la foto o los datos de un menor, confirmas que tienes autorización para hacerlo.",
                        "Tratamos ese material solo para la experiencia contratada y para el soporte operativo asociado al pedido.",
                    ],
                },
                {
                    title: "4. Compartición y terceros",
                    paragraphs: [
                        "Podemos compartir datos con proveedores que nos ayudan a operar el servicio, como procesamiento de pagos, alojamiento, mensajería o analítica. Solo compartimos lo necesario para prestar el servicio.",
                        "No vendemos tu información personal a terceros.",
                    ],
                },
                {
                    title: "5. Tus derechos",
                    paragraphs: [
                        "Puedes pedir acceso, rectificación o eliminación de tus datos cuando corresponda. También puedes solicitar que revisemos un caso de privacidad o seguridad relacionado con un pedido.",
                        "Para esas gestiones usamos la página de soporte, desde donde centralizamos la atención por email.",
                    ],
                },
            ]}
        />
    )
}


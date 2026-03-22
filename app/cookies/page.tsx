import type { Metadata } from "next"
import { LegalPage } from "@/components/legal/LegalPage"

export const metadata: Metadata = {
    title: "Política de cookies | StoryMagic",
    description: "Uso de cookies y tecnologías similares en StoryMagic.",
}

export default function CookiesPage() {
    return (
        <LegalPage
            eyebrow="Cookies"
            title="Política de cookies"
            intro="Describimos las cookies y tecnologías similares que podemos usar para que el sitio funcione, recuerde preferencias y mida el rendimiento."
            updatedAt="19 de marzo de 2026"
            contactHref="/soporte"
            contactLabel="Ir a soporte"
            footerNote="Si quieres gestionar un problema técnico o una preferencia de privacidad, la página de soporte centraliza el contacto operativo."
            highlights={[
                { label: "Necesarias", value: "Funcionamiento del sitio", description: "Permiten navegación, autenticación y protección básica contra abuso o errores." },
                { label: "Preferencias", value: "Idioma y tema", description: "Pueden recordar ajustes visuales o de experiencia para facilitar el uso posterior." },
                { label: "Analítica", value: "Mejora del funnel", description: "Si están activas, ayudan a entender el uso del sitio y a detectar puntos de fricción." },
            ]}
            sections={[
                {
                    title: "1. Qué son las cookies",
                    paragraphs: [
                        "Las cookies son pequeños archivos que el navegador guarda para recordar información sobre tu visita. También podemos usar tecnologías similares con objetivos de sesión, preferencias o analítica.",
                    ],
                },
                {
                    title: "2. Tipos de cookies que podemos usar",
                    bullets: [
                        "Cookies necesarias para iniciar sesión, conservar la sesión y mantener el funcionamiento básico del sitio.",
                        "Cookies de preferencias para recordar idioma, tema u otras configuraciones de experiencia.",
                        "Cookies analíticas para medir rendimiento y entender qué partes del sitio generan más abandono o conversión.",
                    ],
                    paragraphs: [
                        "El sitio puede funcionar con un conjunto mínimo de cookies necesarias. Las demás categorías dependen de la configuración del navegador y de la herramienta de medición que tengamos activa.",
                    ],
                },
                {
                    title: "3. Cómo controlarlas",
                    paragraphs: [
                        "Puedes bloquear o eliminar cookies desde la configuración de tu navegador. Si lo haces, algunas partes del sitio podrían no funcionar igual o recordar tus preferencias.",
                        "Si quieres preguntar algo sobre privacidad o uso técnico de cookies, la página de soporte concentra la atención operativa.",
                    ],
                },
            ]}
        />
    )
}


import Link from "next/link"
import { ArrowRight, Mail, ShieldCheck } from "lucide-react"

export interface LegalSection {
    title: string
    paragraphs: string[]
    bullets?: string[]
}

export interface LegalHighlight {
    label: string
    value: string
    description: string
}

interface LegalPageProps {
    eyebrow: string
    title: string
    intro: string
    updatedAt: string
    sections: LegalSection[]
    highlights: LegalHighlight[]
    contactHref?: string
    contactLabel?: string
    footerNote?: string
}

export function LegalPage({
    eyebrow,
    title,
    intro,
    updatedAt,
    sections,
    highlights,
    contactHref = "/contacto",
    contactLabel = "Ir a contacto",
    footerNote = "Si tienes una consulta específica, usamos el formulario de contacto para responder por email.",
}: LegalPageProps) {
    return (
        <main className="page-shell min-h-screen pt-24 pb-16">
            <section className="container mx-auto px-6">
                <div className="surface-panel mx-auto mb-10 max-w-4xl rounded-[36px] p-8 md:p-10">
                    <span className="section-kicker mb-4">
                        {eyebrow}
                    </span>
                    <h1 className="section-heading text-4xl md:text-5xl">
                        {title}
                    </h1>
                    <p className="section-copy mt-5 max-w-3xl text-lg font-semibold">
                        {intro}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-[var(--text-secondary)]">
                        <span className="surface-chip inline-flex items-center gap-2 rounded-full px-4 py-2">
                            <ShieldCheck className="h-4 w-4 text-teal-600" />
                            Actualizado {updatedAt}
                        </span>
                        <Link
                            href={contactHref}
                            className="public-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 transition-colors"
                        >
                            <Mail className="h-4 w-4" />
                            {contactLabel}
                        </Link>
                    </div>
                </div>

                <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-5">
                        {sections.map((section) => (
                            <article key={section.title} className="page-panel rounded-[30px] p-7 md:p-8">
                                <h2 className="mb-4 text-2xl font-serif text-[var(--text-primary)]">
                                    {section.title}
                                </h2>
                                <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">
                                    {section.paragraphs.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                    {section.bullets && section.bullets.length > 0 && (
                                        <ul className="space-y-3 pt-2">
                                            {section.bullets.map((bullet) => (
                                                <li key={bullet} className="flex gap-3">
                                                    <span className="mt-2 h-2 w-2 rounded-full bg-coral-400" />
                                                    <span>{bullet}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </article>
                        ))}

                        <div className="page-panel rounded-[30px] p-7 md:p-8">
                            <h2 className="mb-3 text-2xl font-serif text-[var(--text-primary)]">
                                Necesitas ayuda
                            </h2>
                            <p className="leading-relaxed text-[var(--text-secondary)]">
                                {footerNote}
                            </p>
                            <div className="mt-5">
                                <Link
                                    href={contactHref}
                                    className="public-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5"
                                >
                                    {contactLabel}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-5">
                        <div className="page-panel rounded-[30px] p-7 md:p-8">
                            <h2 className="mb-4 text-xl font-serif text-[var(--text-primary)]">
                                Resumen
                            </h2>
                            <div className="space-y-4">
                                {highlights.map((item) => (
                                    <div key={item.label} className="surface-card rounded-2xl p-4">
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-purple-600">
                                            {item.label}
                                        </p>
                                        <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                                            {item.value}
                                        </p>
                                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                            {item.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="page-panel rounded-[30px] p-7 md:p-8">
                            <h2 className="mb-3 text-xl font-serif text-[var(--text-primary)]">
                                Antes de comprar
                            </h2>
                            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                                Revisa el formato, el destino de envío y el resumen final antes de pagar. Si algo no te queda claro, usamos el canal de soporte para resolverlo.
                            </p>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    )
}

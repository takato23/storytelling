"use client"

import { FormEvent, useState } from "react"
import { Footer } from "@/components/layout/Footer"
import { captureEvent } from "@/lib/analytics/events"

export default function ContactoPage() {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault()
        setIsSubmitting(true)
        setError(null)
        setSuccess(null)

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, message }),
            })
            const payload = await response.json()
            if (!response.ok) {
                throw new Error(payload.message ?? "No pudimos enviar tu mensaje.")
            }
            captureEvent("contact_submitted", { source: "contact_form" })
            setSuccess("Mensaje enviado. Te respondemos a la brevedad.")
            setName("")
            setEmail("")
            setMessage("")
        } catch (submissionError) {
            setError(submissionError instanceof Error ? submissionError.message : "No pudimos enviar tu mensaje.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="page-shell min-h-screen pt-24">
            <section className="container mx-auto px-6 py-16">
                <div className="page-panel mx-auto mb-12 max-w-3xl rounded-[32px] px-6 py-10 text-center md:px-10">
                    <span className="section-kicker mb-4">
                        Contacto
                    </span>
                    <h1 className="section-heading mb-4 text-4xl md:text-5xl">
                        ¿Te ayudamos con tu pedido?
                    </h1>
                    <p className="section-copy font-semibold">
                        Si tienes dudas sobre personalización, pagos o envíos, escríbenos y te respondemos por email.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="page-panel mx-auto max-w-2xl space-y-5 rounded-3xl p-6 md:p-8">
                    <div>
                        <label htmlFor="contact-name" className="mb-2 block text-sm font-semibold text-[var(--text-secondary)]">
                            Nombre
                        </label>
                        <input
                            id="contact-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="form-field"
                            placeholder="Tu nombre"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="contact-email" className="mb-2 block text-sm font-semibold text-[var(--text-secondary)]">
                            Email
                        </label>
                        <input
                            id="contact-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="form-field"
                            placeholder="tu@email.com"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="contact-message" className="mb-2 block text-sm font-semibold text-[var(--text-secondary)]">
                            Mensaje
                        </label>
                        <textarea
                            id="contact-message"
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            className="form-field min-h-32"
                            placeholder="Cuéntanos qué necesitas"
                            required
                        />
                    </div>

                    {success && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm font-medium">
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="public-button-primary w-full rounded-xl py-3 font-semibold transition-colors disabled:opacity-60"
                    >
                        {isSubmitting ? "Enviando..." : "Enviar mensaje"}
                    </button>
                </form>
            </section>
            <Footer />
        </main>
    )
}

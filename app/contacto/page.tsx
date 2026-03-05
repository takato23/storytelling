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
        <main className="min-h-screen bg-cream-50 pt-24">
            <section className="container mx-auto px-6 py-16">
                <div className="max-w-3xl mx-auto text-center mb-12">
                    <span className="inline-block px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-4">
                        Contacto
                    </span>
                    <h1 className="text-4xl md:text-5xl font-serif text-charcoal-900 mb-4">
                        ¿Te ayudamos con tu pedido?
                    </h1>
                    <p className="text-charcoal-600">
                        Si tienes dudas sobre personalización, pagos o envíos, escríbenos y te respondemos por email.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white rounded-3xl border border-charcoal-100 p-6 md:p-8 shadow-sm space-y-5">
                    <div>
                        <label htmlFor="contact-name" className="block text-sm font-semibold text-charcoal-700 mb-2">
                            Nombre
                        </label>
                        <input
                            id="contact-name"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="w-full rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="Tu nombre"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="contact-email" className="block text-sm font-semibold text-charcoal-700 mb-2">
                            Email
                        </label>
                        <input
                            id="contact-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="w-full rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                            placeholder="tu@email.com"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="contact-message" className="block text-sm font-semibold text-charcoal-700 mb-2">
                            Mensaje
                        </label>
                        <textarea
                            id="contact-message"
                            value={message}
                            onChange={(event) => setMessage(event.target.value)}
                            className="w-full min-h-32 rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                        className="w-full rounded-xl bg-indigo-950 hover:bg-black text-white font-semibold py-3 transition-colors disabled:opacity-60"
                    >
                        {isSubmitting ? "Enviando..." : "Enviar mensaje"}
                    </button>
                </form>
            </section>
            <Footer />
        </main>
    )
}

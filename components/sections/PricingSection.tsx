"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Check, Shield, Star } from "lucide-react"
import Link from "next/link"

export function PricingSection() {
    const [currency, setCurrency] = useState<"USD" | "ARS">("ARS")
    const FX_PREVIEW = 1200

    const formatPrice = (usdValue: number) => {
        if (currency === "USD") return `USD ${usdValue.toFixed(2)}`
        return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(usdValue * FX_PREVIEW)
    }

    const plans = [
        {
            name: "Digital",
            priceUsd: 9.99,
            description: "Para leer y compartir al instante",
            features: [
                "Preview antes de pagar",
                "PDF en alta calidad",
                "Entrega inmediata",
                "Disponible en tu biblioteca"
            ],
            popular: false,
            cta: "Elegir Digital",
            href: "/crear",
        },
        {
            name: "Impreso + Digital",
            priceUsd: 29.99,
            description: "Para regalar y guardar",
            features: [
                "Libro impreso a color",
                "Podés elegir terminación",
                "Incluye versión digital",
                "Envío calculado antes de pagar",
                "Ideal para regalo"
            ],
            popular: true,
            cta: "Elegir Impreso",
            href: "/crear",
        }
    ]

    return (
        <section className="relative py-16 lg:py-18">
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="section-kicker mb-4">
                        Precios
                    </span>
                    <h2 className="section-heading text-fluid-section mb-6">
                        Elegí el formato
                    </h2>
                    <p className="section-copy text-fluid-body mx-auto max-w-2xl font-semibold">
                        Primero ves la preview. Después elegís digital o impreso.
                    </p>
                    <div className="surface-card mt-6 inline-flex rounded-2xl p-1.5">
                        {(["ARS", "USD"] as const).map((option) => (
                            <button
                                key={option}
                                onClick={() => setCurrency(option)}
                                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${currency === option
                                    ? "surface-chip-active"
                                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-strong)]"
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">En ARS mostramos una conversión estimada. El total final se confirma en el checkout.</p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            className={`relative rounded-[40px] p-10 transition-all duration-500 ${plan.popular
                                ? 'page-panel-dark text-white'
                                : 'page-panel text-[var(--text-primary)] hover:shadow-2xl'
                                }`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -5 }}
                        >
                            {/* Enhanced shimmer border effect for popular plan */}
                            {plan.popular && (
                                <>
                                    <motion.div
                                        className="pricing-shimmer"
                                        animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    />
                                    <div className="absolute -inset-[1px] rounded-[40px] bg-gradient-to-r from-coral-400 via-purple-500 to-teal-400 opacity-60 blur-md animate-pulse" />
                                </>
                            )}

                            {/* Inner content wrapper for popular plan */}
                            <div className={`${plan.popular ? 'relative -m-[1px] rounded-[39px] bg-gradient-to-br from-[#4b2e58] to-[#402845] p-10' : ''}`}>
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-max">
                                        <span className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-charcoal-900 rounded-full text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                                            <Star className="w-3.5 h-3.5 fill-current" />
                                            Más popular
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-10">
                                    <h3 className={`mb-3 text-2xl font-serif ${plan.popular ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                                        {plan.name}
                                    </h3>
                                    <p className={`mb-6 text-sm font-medium ${plan.popular ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                                        {plan.description}
                                    </p>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className={`text-6xl font-bold tracking-tight ${plan.popular ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                                            {formatPrice(plan.priceUsd)}
                                        </span>
                                        <span className={`text-sm font-bold uppercase tracking-wider ${plan.popular ? 'text-white/50' : 'text-[var(--text-muted)]'}`}>
                                            / cuento
                                        </span>
                                    </div>
                                </div>

                                <ul className="space-y-5 mb-10">
                                    {plan.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className={`flex items-center gap-4 text-sm font-medium ${plan.popular ? 'text-white/90' : 'text-[var(--text-secondary)]'}`}
                                        >
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${plan.popular ? 'bg-white/10' : 'bg-teal-50'
                                                }`}>
                                                <Check className={`w-3.5 h-3.5 ${plan.popular ? 'text-teal-300' : 'text-teal-600'}`} />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                    <Link
                                            href={plan.href}
                                            className={`block w-full rounded-[20px] py-5 text-center text-sm font-bold uppercase tracking-widest transition-all shadow-lg ${plan.popular
                                            ? 'public-button-secondary'
                                            : 'public-button-primary'
                                            }`}
                                    >
                                        {plan.cta}
                                    </Link>
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Guarantee */}
                <motion.div
                    className="mt-16 text-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <div className="surface-chip inline-flex items-center gap-3 rounded-full px-6 py-3">
                        <Shield className="w-5 h-5 text-teal-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">Políticas claras y soporte humano</span>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

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
            description: "Perfecto para compartir",
            features: [
                "PDF de alta calidad",
                "Entrega inmediata",
                "Visualización en cualquier dispositivo",
                "Comparte con familia y amigos"
            ],
            popular: false,
            cta: "Empezar Digital",
            href: "/crear",
        },
        {
            name: "Impreso Premium",
            priceUsd: 29.99,
            description: "El regalo perfecto",
            features: [
                "Libro de tapa dura premium",
                "Papel satinado de alta calidad",
                "Envío gratis a todo el país",
                "Empaque de regalo incluido",
                "Versión digital gratis"
            ],
            popular: true,
            cta: "Quiero Impreso",
            href: "/crear",
        }
    ]

    return (
        <section className="py-24 bg-white relative">
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-sm">
                        Precios
                    </span>
                    <h2 className="text-fluid-section font-serif text-charcoal-900 mb-6 drop-shadow-sm">
                        El regalo <span className="text-coral-500 relative">perfecto</span>
                    </h2>
                    <p className="text-charcoal-500 text-fluid-body max-w-2xl mx-auto font-light">
                        Elige el formato que más te guste, digital o impreso.
                    </p>
                    <div className="mt-6 inline-flex rounded-2xl border border-charcoal-100 bg-white/80 p-1.5">
                        {(["ARS", "USD"] as const).map((option) => (
                            <button
                                key={option}
                                onClick={() => setCurrency(option)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${currency === option
                                    ? "bg-indigo-950 text-white"
                                    : "text-charcoal-600 hover:bg-charcoal-50"
                                    }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-charcoal-400">ARS usa conversión estimada. El total final se confirma en checkout con FX diario.</p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.name}
                            className={`relative rounded-[40px] p-10 transition-all duration-500 ${plan.popular
                                ? 'bg-gradient-to-br from-indigo-950 to-[#2A1B4D] text-white shadow-[0_30px_60px_-15px_rgba(30,27,77,0.4)]'
                                : 'bg-white border text-charcoal-900 shadow-xl shadow-gray-100 hover:shadow-2xl'
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
                            <div className={`${plan.popular ? 'relative bg-gradient-to-br from-indigo-950 to-[#2A1B4D] rounded-[39px] -m-[1px] p-10' : ''}`}>
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-max">
                                        <span className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-charcoal-900 rounded-full text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                                            <Star className="w-3.5 h-3.5 fill-current" />
                                            Más popular
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-10">
                                    <h3 className={`text-2xl font-serif mb-3 ${plan.popular ? 'text-white' : 'text-charcoal-900'}`}>
                                        {plan.name}
                                    </h3>
                                    <p className={`mb-6 text-sm font-medium ${plan.popular ? 'text-white/60' : 'text-charcoal-400'}`}>
                                        {plan.description}
                                    </p>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className={`text-6xl font-bold tracking-tight ${plan.popular ? 'text-white' : 'text-charcoal-900'}`}>
                                            {formatPrice(plan.priceUsd)}
                                        </span>
                                        <span className={`text-sm font-bold uppercase tracking-wider ${plan.popular ? 'text-white/40' : 'text-charcoal-300'}`}>
                                            / cuento
                                        </span>
                                    </div>
                                </div>

                                <ul className="space-y-5 mb-10">
                                    {plan.features.map((feature) => (
                                        <li
                                            key={feature}
                                            className={`flex items-center gap-4 text-sm font-medium ${plan.popular ? 'text-white/90' : 'text-charcoal-600'}`}
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
                                        className={`block w-full py-5 rounded-[20px] font-bold text-sm uppercase tracking-widest transition-all shadow-lg text-center ${plan.popular
                                            ? 'bg-white text-indigo-950 hover:bg-gray-50'
                                            : 'bg-indigo-950 text-white hover:bg-black'
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
                    <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/50 border border-gray-200 shadow-sm backdrop-blur-sm">
                        <Shield className="w-5 h-5 text-teal-600" />
                        <span className="text-charcoal-600 font-bold text-xs uppercase tracking-wider">Garantía de satisfacción 100%</span>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

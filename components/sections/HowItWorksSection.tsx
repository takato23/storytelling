"use client"

import React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Sparkles, Camera, BookOpen, Wand2, Gift } from "lucide-react"

export function HowItWorksSection() {
    const prefersReducedMotion = useReducedMotion()

    const steps = [
        {
            title: "Subí tu foto",
            description: "Una foto clara alcanza para arrancar.",
            icon: Camera,
            accent: "text-rose-500",
        },
        {
            title: "Elegí la aventura",
            description: "Espacio, dinosaurios, fútbol y más.",
            icon: BookOpen,
            accent: "text-emerald-500",
        },
        {
            title: "Generamos la preview",
            description: "Ves la portada antes de pagar.",
            icon: Wand2,
            accent: "text-purple-500",
        },
        {
            title: "Recibilo como quieras",
            description: "Digital al instante o impreso.",
            icon: Gift,
            accent: "text-amber-500",
        }
    ]

    return (
        <section id="como-funciona" className="relative scroll-mt-28 overflow-hidden py-12 lg:py-14">
            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    className="mx-auto mb-8 max-w-3xl text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="section-kicker mb-5">
                        <Sparkles className="w-4 h-4" />
                        Cómo funciona
                    </div>
                    <h2 className="section-heading mb-4 text-3xl leading-tight md:text-4xl lg:text-5xl">
                        Del upload al cuento, sin vueltas
                    </h2>
                    <p className="section-copy text-base font-semibold md:text-lg">
                        Todo el proceso entra en cuatro pasos cortos.
                    </p>
                </motion.div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {steps.map((step, index) => {
                        const Icon = step.icon
                        return (
                            <motion.div
                                key={step.title}
                                className="surface-card rounded-[28px] p-5"
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: prefersReducedMotion ? 0 : index * 0.08, duration: 0.45 }}
                            >
                                <div className="mb-4 flex items-center justify-between">
                                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-strong)] ${step.accent}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                        0{index + 1}
                                    </span>
                                </div>
                                <h3 className="text-lg font-serif font-bold text-[var(--text-primary)]">
                                    {step.title}
                                </h3>
                                <p className="mt-2 text-sm font-medium leading-relaxed text-[var(--text-secondary)]">
                                    {step.description}
                                </p>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

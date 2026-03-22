"use client"

import React from "react"
import { motion } from "framer-motion"
import { Shield, Truck, RefreshCw, CreditCard, Award, Lock, LucideIcon } from "lucide-react"

interface Badge {
    icon: LucideIcon
    title: string
    description: string
}

const BADGES: Badge[] = [
    {
        icon: Shield,
        title: "Compra Segura",
        description: "Datos protegidos y checkout cifrado",
    },
    {
        icon: Truck,
        title: "Envíos Claros",
        description: "Costo y plazo visibles antes de pagar",
    },
    {
        icon: RefreshCw,
        title: "Soporte Humano",
        description: "Te ayudamos por soporte y correo",
    },
    {
        icon: CreditCard,
        title: "Pago Protegido",
        description: "Mercado Pago o Stripe según configuración",
    },
]

interface TrustBadgesProps {
    className?: string
    variant?: "horizontal" | "grid"
}

export function TrustBadges({ className = "", variant = "horizontal" }: TrustBadgesProps) {
    const containerClass = variant === "horizontal"
        ? "flex flex-wrap justify-center gap-8 md:gap-12"
        : "grid grid-cols-2 md:grid-cols-4 gap-6"

    return (
        <div className={`py-8 ${className}`}>
            <div className={containerClass}>
                {BADGES.map((badge, index) => {
                    const Icon = badge.icon
                    return (
                        <motion.div
                            key={badge.title}
                            className={`flex items-center gap-3 ${variant === "grid" ? "flex-col text-center" : ""}`}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="surface-card flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-teal-100">
                                <Icon className="w-6 h-6 text-teal-600" />
                            </div>
                            <div className={variant === "grid" ? "" : "text-left"}>
                                <h4 className="text-sm font-semibold text-[var(--text-primary)]">{badge.title}</h4>
                                <p className="text-xs text-[var(--text-muted)]">{badge.description}</p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}

// Compact version for footer or checkout
export function TrustBadgesCompact({ className = "" }: { className?: string }) {
    return (
        <div className={`flex flex-wrap justify-center gap-4 text-[var(--text-secondary)] ${className}`}>
            <div className="flex items-center gap-1.5 text-sm">
                <Lock className="w-4 h-4 text-teal-500" />
                <span>SSL Seguro</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
                <Shield className="w-4 h-4 text-teal-500" />
                <span>Checkout protegido</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
                <Award className="w-4 h-4 text-teal-500" />
                <span>Soporte humano</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
                <Truck className="w-4 h-4 text-teal-500" />
                <span>Envíos a todo el país</span>
            </div>
        </div>
    )
}

export default TrustBadges

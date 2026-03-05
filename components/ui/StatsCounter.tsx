"use client"

import React, { useEffect, useState, useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Users, BookOpen, Star, Heart, LucideIcon } from "lucide-react"

interface Stat {
    icon: LucideIcon
    value: number
    suffix: string
    label: string
    color: string
}

const STATS: Stat[] = [
    {
        icon: Users,
        value: 2500,
        suffix: "+",
        label: "Familias felices",
        color: "text-coral-500",
    },
    {
        icon: BookOpen,
        value: 8500,
        suffix: "+",
        label: "Cuentos creados",
        color: "text-teal-500",
    },
    {
        icon: Star,
        value: 4.9,
        suffix: "",
        label: "Valoración promedio",
        color: "text-yellow-500",
    },
    {
        icon: Heart,
        value: 99,
        suffix: "%",
        label: "Clientes satisfechos",
        color: "text-coral-500",
    },
]

interface AnimatedCounterProps {
    value: number
    suffix: string
    duration?: number
    isDecimal?: boolean
}

function AnimatedCounter({ value, suffix, duration = 2, isDecimal = false }: AnimatedCounterProps) {
    const [count, setCount] = useState(0)
    const ref = useRef<HTMLSpanElement>(null)
    const isInView = useInView(ref, { once: true, margin: "-100px" })

    useEffect(() => {
        if (!isInView) return

        const startTime = Date.now()
        const endValue = value
        const step = () => {
            const now = Date.now()
            const progress = Math.min((now - startTime) / (duration * 1000), 1)
            // Ease-out curve
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = eased * endValue

            setCount(current)

            if (progress < 1) {
                requestAnimationFrame(step)
            }
        }
        requestAnimationFrame(step)
    }, [isInView, value, duration])

    return (
        <span ref={ref}>
            {isDecimal ? count.toFixed(1) : Math.floor(count).toLocaleString()}
            {suffix}
        </span>
    )
}

interface StatsCounterProps {
    className?: string
}

export function StatsCounter({ className = "" }: StatsCounterProps) {
    return (
        <section className={`py-16 bg-gradient-to-br from-cream-50 to-cream-100 ${className}`}>
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {STATS.map((stat, index) => {
                        const Icon = stat.icon
                        return (
                            <motion.div
                                key={stat.label}
                                className="text-center"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <motion.div
                                    className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4 ${stat.color}`}
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                >
                                    <Icon className="w-8 h-8" />
                                </motion.div>
                                <div className={`text-4xl md:text-5xl font-bold ${stat.color} mb-2`}>
                                    <AnimatedCounter
                                        value={stat.value}
                                        suffix={stat.suffix}
                                        isDecimal={stat.label === "Valoración promedio"}
                                    />
                                </div>
                                <p className="text-charcoal-600 font-medium">{stat.label}</p>
                            </motion.div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

export default StatsCounter

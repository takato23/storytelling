"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { Check, Home, Sparkles, BookOpen } from "lucide-react"

export default function SuccessPage() {
    const prefersReducedMotion = useReducedMotion()
    const [showContent, setShowContent] = useState(false)
    const [orderNumber, setOrderNumber] = useState("0000")
    const [particles, setParticles] = useState<
        Array<{
            key: number
            x: number
            y: number
            duration: number
            delay: number
        }>
    >([])

    useEffect(() => {
        localStorage.removeItem('storymagic_cart')

        if (!prefersReducedMotion) {
            const width = window.innerWidth
            const height = window.innerHeight
            const generatedParticles = Array.from({ length: 20 }, (_, i) => ({
                key: i,
                x: Math.random() * width,
                y: height,
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 5,
            }))
            setParticles(generatedParticles)
        }

        setOrderNumber(Math.floor(Math.random() * 10000).toString().padStart(4, "0"))

        const timer = setTimeout(() => {
            setShowContent(true)
        }, 500)
        return () => clearTimeout(timer)
    }, [prefersReducedMotion])

    return (
        <div className="min-h-screen bg-[var(--play-surface)] flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--play-primary)]/[0.07] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--nido-rose)]/[0.12] rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />

                {/* Floating Particles */}
                {particles.map(({ key, x, y, duration, delay }) => (
                    <motion.div
                        key={key}
                        className="absolute w-2 h-2 bg-[var(--play-secondary-container)] rounded-full"
                        initial={{ x, y, scale: 0 }}
                        animate={{ y: -100, scale: [0, 1, 0], opacity: [0, 1, 0] }}
                        transition={{ duration, repeat: Infinity, delay, ease: "easeOut" }}
                    />
                ))}
            </div>

            <motion.div
                className="max-w-lg w-full bg-white/80 backdrop-blur-xl rounded-[var(--play-radius-panel)] shadow-[var(--shadow-card)] p-10 border border-white text-center relative z-10"
                initial={prefersReducedMotion ? false : { scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring" }}
            >
                {/* Success Icon Animation */}
                <div className="relative mb-8 flex justify-center">
                    <motion.div
                        className="w-24 h-24 bg-[var(--play-accent-success)] rounded-full flex items-center justify-center shadow-lg shadow-[var(--play-accent-success)]/30 z-10"
                        initial={prefersReducedMotion ? false : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                        <motion.div
                            initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                        >
                            <Check className="w-12 h-12 text-white stroke-[3]" />
                        </motion.div>
                    </motion.div>

                    {/* Ring Pulse */}
                    {!prefersReducedMotion && (
                        <motion.div
                            className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 border-4 border-[var(--play-accent-success)] rounded-full"
                            initial={{ scale: 1, opacity: 1 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ delay: 0.4, duration: 1 }}
                        />
                    )}
                </div>

                <div className="space-y-4 mb-10">
                    <motion.h1
                        className="text-4xl font-bold text-[var(--play-text-main)] font-serif"
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        ¡Magia en camino!
                    </motion.h1>
                    <motion.p
                        className="text-[var(--play-text-muted)] text-lg leading-relaxed"
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        Tu pedido ha sido confirmado. Estamos preparando los hechizos necesarios para crear tu libro.
                    </motion.p>
                </div>

                {/* Order Details Card */}
                <motion.div
                    className="bg-[var(--play-surface-low)] rounded-2xl p-6 mb-8 text-left border border-[var(--play-outline)]/25"
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm text-2xl">
                            🪄
                        </div>
                        <div>
                            <h3 className="font-bold text-[var(--play-text-main)]">Orden #magic-{orderNumber}</h3>
                            <p className="text-sm text-[var(--play-text-muted)] mt-1">
                                Recibirás un correo con la confirmación y el enlace de seguimiento mágico.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    className="flex flex-col gap-3"
                    initial={prefersReducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                >
                    <Link href="/cuenta/pedidos">
                        <motion.button
                            className="gummy-button w-full py-4 bg-[var(--play-accent-success)] text-white rounded-xl font-bold shadow-lg shadow-[var(--play-accent-success)]/20 hover:shadow-[var(--play-accent-success)]/40 transition-shadow flex items-center justify-center gap-2 group"
                            whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                        >
                            <BookOpen className="w-5 h-5" />
                            Ver mis pedidos
                        </motion.button>
                    </Link>

                    <Link href="/crear">
                        <motion.button
                            className="gummy-button w-full py-4 bg-[var(--play-primary)] text-white rounded-xl font-bold shadow-lg shadow-[var(--play-primary)]/20 hover:shadow-[var(--play-primary)]/40 transition-shadow flex items-center justify-center gap-2 group"
                            whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                        >
                            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            Crear otra historia
                        </motion.button>
                    </Link>

                    <Link href="/">
                        <button className="w-full py-4 text-[var(--play-text-muted)] font-bold hover:text-[var(--play-text-main)] transition-colors flex items-center justify-center gap-2">
                            <Home className="w-4 h-4" />
                            Volver al inicio
                        </button>
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    )
}

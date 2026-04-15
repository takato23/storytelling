"use client"

import React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Shield, Sparkles, Star } from "lucide-react"
import Link from "next/link"

const FLOATING_STARS = [
    { left: "10%", top: "18%", duration: 4.8, delay: 0.2 },
    { left: "22%", top: "58%", duration: 5.4, delay: 1.1 },
    { left: "36%", top: "24%", duration: 4.2, delay: 0.6 },
    { left: "48%", top: "72%", duration: 5.8, delay: 1.4 },
    { left: "60%", top: "16%", duration: 4.6, delay: 0.9 },
    { left: "72%", top: "48%", duration: 5.2, delay: 0.3 },
    { left: "84%", top: "28%", duration: 4.9, delay: 1.7 },
    { left: "90%", top: "68%", duration: 5.6, delay: 0.8 },
]

export function FinalCTA({
    className = "",
    onPrimaryClick,
}: {
    className?: string
    onPrimaryClick?: () => void
}) {
    const [isMounted, setIsMounted] = React.useState(false)
    const [isMobile, setIsMobile] = React.useState(false)
    const prefersReducedMotion = useReducedMotion()

    React.useEffect(() => {
        setIsMounted(true)
        const media = window.matchMedia("(max-width: 768px)")
        const apply = () => setIsMobile(media.matches)
        apply()
        media.addEventListener("change", apply)
        return () => media.removeEventListener("change", apply)
    }, [])

    const compactMotion = prefersReducedMotion || isMobile

    return (
        <section className={`relative overflow-hidden pt-24 pb-20 lg:pt-28 ${className}`}>
            <div className="absolute top-0 left-0 w-full overflow-hidden leading-none pointer-events-none rotate-180 z-20">
                <svg className="relative block w-full h-[40px] md:h-[80px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,121.32,198.71,115.68,239.5,112.27,279.7,101.44,321.39,56.44Z" className="fill-purple-50"></path>
                </svg>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-[var(--button-primary-bg)] via-[#5a385e] to-[#355a64]" />

            <div className="absolute top-0 left-0 w-[520px] md:w-[800px] h-[520px] md:h-[800px] bg-[var(--page-orb-a)] rounded-full blur-[120px] opacity-80 mix-blend-screen animate-pulse" />
            <div className="absolute bottom-0 right-0 w-[520px] md:w-[800px] h-[520px] md:h-[800px] bg-[var(--page-orb-c)] rounded-full blur-[120px] opacity-80 mix-blend-screen" />

            {isMounted && !compactMotion && FLOATING_STARS.map((star, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{
                        left: star.left,
                        top: star.top,
                    }}
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0.2, 0.8, 0.2],
                        scale: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: star.duration,
                        repeat: Infinity,
                        delay: star.delay,
                    }}
                >
                    <Star className="w-3 h-3 md:w-5 md:h-5 text-[var(--play-secondary-container)] fill-white" />
                </motion.div>
            ))}

            <div className="container mx-auto px-6 relative z-10">
                <div className="page-panel-dark mx-auto max-w-5xl rounded-[40px] px-6 py-12 text-center sm:px-10 lg:px-14">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <motion.div
                            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-white backdrop-blur-md"
                            animate={compactMotion ? undefined : { scale: [1, 1.05, 1], boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 20px rgba(255,255,255,0.3)", "0 0 0px rgba(255,255,255,0)"] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Preview antes de pagar
                        </motion.div>

                        <h2 className="mb-8 text-balance font-serif text-5xl leading-tight text-white drop-shadow-xl md:text-6xl lg:text-7xl">
                            Creá un cuento que{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--play-secondary-container)] to-[var(--play-secondary-strong)]">sí se guarda</span>
                        </h2>

                        <p className="mx-auto mb-12 max-w-3xl text-xl font-medium leading-relaxed text-white/80 md:text-2xl">
                            Subí una foto, validá la portada y elegí el formato.
                        </p>
                    </motion.div>

                    <motion.div
                        className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <Link href="/crear" onClick={onPrimaryClick}>
                            <motion.button
                                className="group flex items-center gap-3 rounded-[24px] bg-white px-12 py-6 text-xl font-bold text-[var(--button-primary-bg)] shadow-[0_20px_50px_-10px_rgba(255,255,255,0.3)] transition-all hover:scale-105 hover:shadow-white/50"
                                whileTap={{ scale: 0.95 }}
                            >
                                <Sparkles className="w-5 h-5 text-[var(--button-primary-bg)]" />
                                Crear mi cuento
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </Link>

                        <span className="text-white/60 text-sm font-medium tracking-wide">
                            Desde USD 9.99
                        </span>
                    </motion.div>

                    <motion.div
                        className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                    >
                        <Shield className="w-5 h-5 text-teal-300" />
                        <span className="text-white/80 font-medium text-sm">
                            Compra protegida, soporte real y reglas claras
                        </span>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

export default FinalCTA

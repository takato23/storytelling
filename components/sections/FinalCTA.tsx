"use client"

import React from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Shield, Sparkles, Star } from "lucide-react"
import Link from "next/link"

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
        <section className={`pt-48 pb-32 relative overflow-hidden ${className}`}>
            <div className="absolute top-0 left-0 w-full overflow-hidden leading-none pointer-events-none rotate-180 z-20">
                <svg className="relative block w-full h-[40px] md:h-[80px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,121.32,198.71,115.68,239.5,112.27,279.7,101.44,321.39,56.44Z" className="fill-purple-50"></path>
                </svg>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b36] via-[#2A1B4D] to-indigo-950" />

            <div className="absolute top-0 left-0 w-[520px] md:w-[800px] h-[520px] md:h-[800px] bg-coral-500/20 rounded-full blur-[120px] opacity-60 mix-blend-screen animate-pulse" />
            <div className="absolute bottom-0 right-0 w-[520px] md:w-[800px] h-[520px] md:h-[800px] bg-purple-500/20 rounded-full blur-[120px] opacity-60 mix-blend-screen" />

            {isMounted && !compactMotion && [...Array(8)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0.2, 0.8, 0.2],
                        scale: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 4,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                    }}
                >
                    <Star className="w-3 h-3 md:w-5 md:h-5 text-yellow-200 fill-white" />
                </motion.div>
            ))}

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <motion.div
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-[0.2em] mb-8"
                            animate={compactMotion ? undefined : { scale: [1, 1.05, 1], boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 20px rgba(255,255,255,0.3)", "0 0 0px rgba(255,255,255,0)"] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Hecho para familias en Argentina
                        </motion.div>

                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-white mb-8 text-balance drop-shadow-xl leading-tight">
                            ¿Listo para crear un recuerdo que durará{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500">toda la vida</span>?
                        </h2>

                        <p className="text-xl md:text-2xl text-indigo-100 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
                            Sumate a familias de todo el país que ya regalaron una historia personalizada para sus hijos.
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
                                className="group px-12 py-6 bg-white text-indigo-950 rounded-[24px] font-bold text-xl shadow-[0_20px_50px_-10px_rgba(255,255,255,0.3)] hover:shadow-white/50 transition-all flex items-center gap-3 hover:scale-105"
                                whileTap={{ scale: 0.95 }}
                            >
                                <Sparkles className="w-5 h-5 text-purple-600" />
                                Crear mi cuento ahora
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </Link>

                        <span className="text-white/60 text-sm font-medium tracking-wide">
                            Desde USD 9.99
                        </span>
                    </motion.div>

                    <motion.div
                        className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 backdrop-blur-sm border border-white/10"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                    >
                        <Shield className="w-5 h-5 text-teal-300" />
                        <span className="text-white/80 font-medium text-sm">
                            Garantía de satisfacción 100% o te devolvemos tu dinero
                        </span>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

export default FinalCTA

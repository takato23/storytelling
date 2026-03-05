"use client"

import React, { useRef } from "react"
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion"
import { Sparkles, Camera, BookOpen, Wand2, Gift } from "lucide-react"

export function HowItWorksSection() {
    const prefersReducedMotion = useReducedMotion()
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 80%", "end 40%"]
    })

    const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])

    const steps = [
        {
            image: "/images/generated/step_1.png",
            title: "1. Sube tu foto",
            description: "Una de frente, bien iluminada y donde se vea esa hermosa sonrisa.",
            icon: Camera,
            color: "from-coral-400 to-rose-400",
            glow: "group-hover:shadow-[0_0_40px_-10px_rgba(251,113,133,0.5)]",
            border: "group-hover:border-rose-400",
            iconColor: "text-rose-500",
        },
        {
            image: "/images/generated/step_2.png",
            title: "2. Elige la aventura",
            description: "Dinosaurios, espacio, príncipes, sirenas... ¡El límite es tu imaginación!",
            icon: BookOpen,
            color: "from-teal-400 to-emerald-400",
            glow: "group-hover:shadow-[0_0_40px_-10px_rgba(52,211,153,0.5)]",
            border: "group-hover:border-emerald-400",
            iconColor: "text-emerald-500",
        },
        {
            image: "/images/generated/step_3.png",
            title: "3. Magia con IA",
            description: "Nuestra tecnología los convierte en los protagonistas ilustrados de la historia.",
            icon: Wand2,
            color: "from-purple-400 to-indigo-400",
            glow: "group-hover:shadow-[0_0_40px_-10px_rgba(167,139,250,0.5)]",
            border: "group-hover:border-purple-400",
            iconColor: "text-purple-500",
        },
        {
            image: "/images/generated/step_4.png",
            title: "4. A soñar despiertos",
            description: "Recíbelo en formato digital al instante o impreso directo en tu hogar.",
            icon: Gift,
            color: "from-amber-400 to-orange-400",
            glow: "group-hover:shadow-[0_0_40px_-10px_rgba(251,191,36,0.5)]",
            border: "group-hover:border-amber-400",
            iconColor: "text-amber-500",
        }
    ]

    return (
        <section ref={containerRef} className="py-32 lg:py-40 relative overflow-hidden bg-white">
            {/* Elegant Background Blurs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[20%] left-[-15%] w-[600px] h-[600px] bg-purple-100/60 rounded-full blur-[120px] mix-blend-multiply" />
                <div className="absolute bottom-[-10%] right-[-15%] w-[700px] h-[700px] bg-teal-50/60 rounded-full blur-[120px] mix-blend-multiply" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    className="text-center mb-24 md:mb-32 max-w-4xl mx-auto"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                >
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-50/50 border border-indigo-100 text-sm font-black uppercase tracking-[0.2em] text-indigo-600 mb-8 backdrop-blur-md">
                        <Sparkles className="w-4 h-4" />
                        Proceso simple
                    </div>
                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-charcoal-900 mb-8 leading-[1.1] tracking-tight text-balance">
                        Tu niño, el <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-coral-500">héroe</span> en solo minutos
                    </h2>
                </motion.div>

                <div className="relative max-w-[1400px] mx-auto">
                    {/* Glowing Animated Progress Bar (Desktop) */}
                    <div className="hidden lg:block absolute top-[120px] left-[10%] right-[10%] h-[3px] bg-gray-100 z-0 rounded-full">
                        <motion.div
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-coral-400 via-purple-400 to-amber-400 rounded-full shadow-[0_0_15px_rgba(167,139,250,0.8)]"
                            style={{ width: prefersReducedMotion ? "100%" : progressWidth }}
                        />
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 relative z-10">
                        {steps.map((step, index) => {
                            const Icon = step.icon
                            return (
                                <motion.div
                                    key={step.title}
                                    className="relative flex flex-col group cursor-crosshair"
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{ delay: prefersReducedMotion ? 0 : index * 0.15, duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
                                >
                                    {/* Elevated Glass Image Container */}
                                    <div className={`relative mb-8 w-full aspect-[4/4] lg:aspect-[4/5] rounded-[2.5rem] transition-all duration-500 z-20 group-hover:-translate-y-4`}>

                                        {/* The Card Background and Image */}
                                        <div className={`absolute inset-0 bg-white border-2 border-transparent ${step.border} ${step.glow} shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] rounded-[2.5rem] p-3 transition-all duration-500`}>
                                            <div className="w-full h-full relative rounded-[2rem] overflow-hidden mask-image-fade">
                                                <img src={step.image} alt={step.title} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 transition-opacity duration-300 group-hover:opacity-0" />
                                            </div>
                                        </div>

                                        {/* Floating Badge Icon - Now outside overflow-hidden */}
                                        <div className={`absolute -top-4 -right-4 lg:-right-6 lg:-top-6 w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-125 z-30 border border-gray-50 text-gradient group-hover:animate-pulse`}>
                                            <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-inner`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Text Content */}
                                    <div className="px-2 transition-transform duration-500 group-hover:translate-x-2">
                                        <h3 className={`text-2xl font-bold font-serif mb-3 ${step.iconColor}`}>
                                            {step.title}
                                        </h3>
                                        <p className="text-charcoal-500 font-medium leading-relaxed text-lg lg:text-base">
                                            {step.description}
                                        </p>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Premium Soft Divider at bottom */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
                <svg className="relative block w-full h-[80px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="fill-cream-50"></path>
                    <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-23.64V0Z" opacity=".5" className="fill-cream-50"></path>
                    <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="fill-cream-50"></path>
                </svg>
            </div>
        </section>
    )
}

"use client"

import React, { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { Star } from "lucide-react"

interface Testimonial {
    id: string
    name: string
    location: string
    rating: number
    text: string
    childName: string
    storyTitle: string
    avatar: string
    bookImage?: string
}

const TESTIMONIALS: Testimonial[] = [
    {
        id: "1",
        name: "María García",
        location: "CABA",
        rating: 5,
        text: "Mi hija Lucía pide su cuento todas las noches. Verse como astronauta le dio un orgullo hermoso.",
        childName: "Lucía",
        storyTitle: "El Explorador Espacial",
        avatar: "MG",
        bookImage: "/stories/space-1.jpg"
    },
    {
        id: "2",
        name: "Carlos Rodríguez",
        location: "Buenos Aires",
        rating: 5,
        text: "Para el cumple de Martín fue el regalo que más llamó la atención. El impreso llegó impecable.",
        childName: "Martín",
        storyTitle: "El Reino del Bosque Mágico",
        avatar: "CR",
        bookImage: "/stories/forest-1.jpg"
    },
    {
        id: "3",
        name: "Ana Martínez",
        location: "Córdoba",
        rating: 5,
        text: "La personalización salió excelente y el proceso fue simple. Mi hija se emocionó cuando se vio protagonista.",
        childName: "Sofi",
        storyTitle: "El Reino del Bosque Mágico",
        avatar: "AM",
        bookImage: "/stories/forest-1.jpg"
    },
    {
        id: "4",
        name: "Roberto Sánchez",
        location: "Rosario",
        rating: 5,
        text: "Lo regalamos en Navidad y todos quedaron sorprendidos. Es un recuerdo real, no un regalo más.",
        childName: "Diego y Emma",
        storyTitle: "El Domador de Dinosaurios",
        avatar: "RS",
        bookImage: "/stories/dino-1.jpg"
    },
]

interface TestimonialsSectionProps {
    className?: string
}

export function TestimonialsSection({ className = "" }: TestimonialsSectionProps) {
    const prefersReducedMotion = useReducedMotion()
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const media = window.matchMedia("(max-width: 768px)")
        const apply = () => setIsMobile(media.matches)
        apply()
        media.addEventListener("change", apply)
        return () => media.removeEventListener("change", apply)
    }, [])

    const compactMotion = prefersReducedMotion || isMobile

    return (
        <section className={`relative overflow-hidden py-24 lg:py-28 ${className}`}>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-coral-50/50 rounded-full blur-3xl pointer-events-none -translate-x-1/2 translate-y-1/2" />

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="section-kicker mb-4">
                        Testimonios
                    </span>
                    <h2 className="section-heading text-fluid-section mb-6">
                        Lo que dicen las <span className="text-coral-500 relative">familias</span>
                    </h2>
                    <p className="section-copy text-fluid-body mx-auto max-w-2xl font-semibold">
                        Historias reales de familias de Argentina.
                    </p>
                </motion.div>

                {compactMotion ? (
                    <div className="grid md:grid-cols-2 gap-5">
                        {TESTIMONIALS.map((testimonial) => (
                            <article key={testimonial.id} className="page-panel flex flex-col rounded-3xl p-6">
                                <div className="flex gap-1 text-yellow-400 mb-3">
                                    {[...Array(testimonial.rating)].map((_, j) => (
                                        <Star key={j} className="w-4 h-4 fill-current" />
                                    ))}
                                </div>
                                <p className="text-charcoal-700 italic flex-grow mb-4 text-sm md:text-base leading-relaxed">
                                    &ldquo;{testimonial.text}&rdquo;
                                </p>
                                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-charcoal-50">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-400 to-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-inner">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <p className="font-bold text-charcoal-900 text-sm">{testimonial.name}</p>
                                        <p className="text-xs text-charcoal-400 uppercase tracking-wider">{testimonial.location}</p>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <>
                        <div className="relative max-w-[100vw] -mx-6 md:-mx-12 lg:-mx-24 mt-12 overflow-hidden flex flex-col gap-6 mask-image-fade">
                            <motion.div
                                className="flex gap-6 w-max"
                                animate={{ x: ["0%", "-50%"] }}
                                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                            >
                                {[...TESTIMONIALS, ...TESTIMONIALS, ...TESTIMONIALS].map((testimonial, i) => (
                                    <div key={`${testimonial.id}-${i}`} className="page-panel flex w-[300px] flex-col rounded-3xl p-6 transition-shadow hover:shadow-xl md:w-[400px]">
                                        <div className="flex gap-1 text-yellow-400 mb-3">
                                            {[...Array(testimonial.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                                        </div>
                                        <p className="text-charcoal-700 italic flex-grow mb-4 text-sm md:text-base leading-relaxed">
                                            &ldquo;{testimonial.text}&rdquo;
                                        </p>
                                        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-charcoal-50">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-400 to-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-inner">
                                                {testimonial.avatar}
                                            </div>
                                            <div>
                                                <p className="font-bold text-charcoal-900 text-sm">{testimonial.name}</p>
                                                <p className="text-xs text-charcoal-400 uppercase tracking-wider">{testimonial.location}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>

                            <motion.div
                                className="flex gap-6 w-max ml-[-200px]"
                                animate={{ x: ["-50%", "0%"] }}
                                transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
                            >
                                {[...TESTIMONIALS].reverse().concat([...TESTIMONIALS].reverse()).concat([...TESTIMONIALS].reverse()).map((testimonial, i) => (
                                    <div key={`${testimonial.id}-r-${i}`} className="page-panel flex w-[300px] flex-col rounded-3xl p-6 transition-shadow hover:shadow-xl md:w-[400px]">
                                        <div className="flex gap-1 text-yellow-400 mb-3">
                                            {[...Array(testimonial.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                                        </div>
                                        <p className="text-charcoal-700 italic flex-grow mb-4 text-sm md:text-base leading-relaxed">
                                            &ldquo;{testimonial.text}&rdquo;
                                        </p>
                                        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-charcoal-50">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-inner">
                                                {testimonial.avatar}
                                            </div>
                                            <div>
                                                <p className="font-bold text-charcoal-900 text-sm">{testimonial.name}</p>
                                                <p className="text-xs text-charcoal-400 uppercase tracking-wider">{testimonial.location}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        </div>

                        <div className="absolute top-0 bottom-0 left-0 w-12 md:w-32 bg-gradient-to-r from-[#fff2e8] to-transparent z-10 pointer-events-none" />
                        <div className="absolute top-0 bottom-0 right-0 w-12 md:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
                    </>
                )}

                <motion.div
                    className="mt-16 flex flex-wrap justify-center gap-8 text-center relative z-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="page-card flex items-center gap-3 rounded-full px-6 py-3">
                        <div className="flex text-yellow-400">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <Star key={i} className="w-5 h-5 fill-current" />
                            ))}
                        </div>
                        <span className="text-charcoal-600 font-bold text-sm tracking-wide">Elegido por familias de todo el país</span>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default TestimonialsSection

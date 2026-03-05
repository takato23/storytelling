"use client"

import React from "react"
import { motion } from "framer-motion"
import { Layers, Palette, Leaf, Book } from "lucide-react"

export function TheMagicSection({ className = "" }: { className?: string }) {
    const features = [
        {
            icon: Layers,
            title: "Papel Premium",
            description: "Papel de 170g con certificación FSC. Grueso, duradero y perfecto para manitas pequeñas."
        },
        {
            icon: Palette,
            title: "Colores Vivos",
            description: "Impresión de alta fidelidad que hace que cada ilustración salte de la página."
        },
        {
            icon: Book,
            title: "Encuadernación",
            description: "Tapa dura resistente o tapa blanda flexible. Cosido para durar toda una infancia."
        },
        {
            icon: Leaf,
            title: "Ecológico",
            description: "Producido localmente para reducir la huella de carbono. Tinta eco-friendly."
        }
    ]

    return (
        <section className={`pt-32 pb-24 bg-gradient-to-br from-pink-50 to-white relative overflow-hidden ${className}`}>
            {/* Wavy top divider (to transition from white background above) */}
            <div className="absolute top-0 left-0 w-full overflow-hidden leading-none pointer-events-none rotate-180">
                <svg className="relative block w-full h-[40px] md:h-[80px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,121.32,198.71,115.68,239.5,112.27,279.7,101.44,321.39,56.44Z" className="fill-white"></path>
                </svg>
            </div>
            <div className="container mx-auto px-6">
                <div className="flex flex-col lg:flex-row items-center gap-16">

                    {/* Left: Visual Representation */}
                    <div className="flex-1 relative w-full max-w-lg aspect-square">
                        {/* Background blob */}
                        <div className="absolute inset-0 bg-purple-200 rounded-full blur-[80px] opacity-40 mix-blend-multiply" />

                        <motion.div
                            className="absolute inset-0 z-10"
                            initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
                            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            viewport={{ once: true }}
                        >
                            <div className="w-full h-full rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border-8 border-white">
                                <img
                                    src="/images/generated/premium_book.png"
                                    alt="Premium StoryMagic Book"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <span className="inline-block px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
                                Calidad de Museo
                            </span>
                            <h2 className="text-3xl md:text-4xl font-bold text-charcoal-900 mb-6">
                                No es solo un cuento,<br /> es un <span className="text-purple-600">tesoro</span>
                            </h2>
                            <p className="text-lg text-charcoal-600 mb-10 leading-relaxed">
                                Diseñamos cada libro para que sea una reliquia familiar. Desde el tacto del papel hasta la intensidad de los colores, la calidad se siente en cada página.
                            </p>

                            <div className="grid sm:grid-cols-2 gap-8">
                                {features.map((feature, i) => (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        viewport={{ once: true }}
                                        className="flex gap-4"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-cream-100 flex items-center justify-center text-charcoal-700 flex-shrink-0">
                                            <feature.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-charcoal-900 mb-1">{feature.title}</h4>
                                            <p className="text-sm text-charcoal-500 leading-snug">{feature.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default TheMagicSection

"use client"

import React from "react"
import { motion } from "framer-motion"
import { Camera, Check, Sparkles } from "lucide-react"
import { ImageComparisonSlider } from "@/components/ui/ImageComparisonSlider"

const PIXAR_STYLE = {
    name: "Pixar 3D",
    color: "#4F46E5",
    image: "/images/generated/kid_pixar_correlate.png",
}

export function LiveFaceDemo({ className = "" }: { className?: string }) {
    return (
        <section className={`py-20 bg-white relative overflow-hidden ${className}`}>
            <div className="absolute inset-0 bg-hero-premium opacity-50" />

            <div className="container mx-auto px-6 relative">
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
                        <Sparkles className="w-4 h-4" />
                        Tecnología IA Avanzada
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-charcoal-900 mb-4">
                        Mira la <span className="text-gradient-animated">magia</span> en acción
                    </h2>
                    <p className="text-charcoal-600 text-lg max-w-2xl mx-auto mb-6">
                        Cerramos una sola dirección visual para que toda la experiencia mantenga consistencia editorial y control de calidad.
                    </p>
                    <div className="inline-flex items-center gap-3 bg-purple-50 border border-purple-100 px-5 py-3 rounded-2xl shadow-sm">
                        <Camera className="w-5 h-5 text-purple-600" />
                        <span className="text-charcoal-800 font-medium">
                            Usamos <strong className="text-purple-700">1 foto</strong> y un estilo Pixar fijo para que la preview y el libro final se sientan coherentes.
                        </span>
                    </div>
                </motion.div>

                <div className="max-w-4xl mx-auto">
                    <motion.div
                        className="relative w-full max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <ImageComparisonSlider
                            beforeImage="/images/generated/kid_photo.png"
                            afterImage={PIXAR_STYLE.image}
                            beforeLabel="Foto Original"
                            afterLabel={`Estilo ${PIXAR_STYLE.name}`}
                        />
                    </motion.div>

                    <motion.div
                        className="mt-8 flex flex-wrap justify-center gap-3"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <div
                            className="px-5 py-2.5 rounded-full font-medium text-sm text-white shadow-lg inline-flex items-center gap-2"
                            style={{ backgroundColor: PIXAR_STYLE.color }}
                        >
                            <Check className="w-4 h-4" />
                            Estilo editorial cerrado: {PIXAR_STYLE.name}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

export default LiveFaceDemo

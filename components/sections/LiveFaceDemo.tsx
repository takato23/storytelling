"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Sparkles, ArrowRight, Check, Camera } from "lucide-react"
import { ImageComparisonSlider } from "@/components/ui/ImageComparisonSlider"

const ART_STYLES = [
    { id: "pixar", name: "Pixar 3D", color: "#4F46E5", image: "/images/generated/kid_pixar_correlate.png" },
    { id: "watercolor", name: "Acuarela", color: "#EC4899", image: "/images/generated/kid_watercolor_correlate.png" },
    { id: "cartoon", name: "Cartoon", color: "#F59E0B", image: "/images/generated/kid_cartoon_correlate.png" },
    { id: "anime", name: "Anime", color: "#06B6D4", image: "/images/generated/kid_anime_correlate.png" },
]

export function LiveFaceDemo({ className = "" }: { className?: string }) {
    const [isMounted, setIsMounted] = useState(false)
    const [selectedStyle, setSelectedStyle] = useState("pixar")
    const [isProcessing, setIsProcessing] = useState(false)
    const [showResult, setShowResult] = useState(true)

    React.useEffect(() => {
        setIsMounted(true)
    }, [])

    const handleStyleChange = (styleId: string) => {
        setIsProcessing(true)
        setShowResult(false)

        setTimeout(() => {
            setSelectedStyle(styleId)
            setIsProcessing(false)
            setShowResult(true)
        }, 800)
    }

    const currentStyle = ART_STYLES.find(s => s.id === selectedStyle)

    return (
        <section className={`py-20 bg-white relative overflow-hidden ${className}`}>
            {/* Background decoration */}
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
                        Nuestra IA transforma cualquier foto en hermosas ilustraciones personalizadas
                    </p>
                    <div className="inline-flex items-center gap-3 bg-purple-50 border border-purple-100 px-5 py-3 rounded-2xl shadow-sm">
                        <Camera className="w-5 h-5 text-purple-600" />
                        <span className="text-charcoal-800 font-medium">
                            ¡Solo necesitas <strong className="text-purple-700">1 foto</strong> para crear docenas de expresiones y ángulos!
                        </span>
                    </div>
                </motion.div>

                <div className="max-w-4xl mx-auto">
                    {/* Interactive Slider instead of side-by-side cards */}
                    <motion.div
                        className="relative w-full max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <ImageComparisonSlider
                            beforeImage="/images/generated/kid_photo.png"
                            afterImage={currentStyle?.image || "/images/generated/kid_pixar_correlate.png"}
                            beforeLabel="Foto Original"
                            afterLabel={`Estilo ${currentStyle?.name || "Pixar 3D"}`}
                        />

                        {/* Fake processing overlay */}
                        <AnimatePresence>
                            {isProcessing && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-20 bg-charcoal-900/60 backdrop-blur-sm rounded-[2rem] flex flex-col items-center justify-center gap-4"
                                >
                                    <div className="w-16 h-16 border-4 border-purple-200/30 border-t-purple-400 rounded-full animate-spin shadow-[0_0_30px_rgba(168,85,247,0.5)]" />
                                    <span className="text-sm font-bold text-white tracking-widest uppercase animate-pulse">
                                        Aplicando Magia...
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* Style Selector */}
                    <motion.div
                        className="mt-8 flex flex-wrap justify-center gap-3"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        {ART_STYLES.map((style) => (
                            <motion.button
                                key={style.id}
                                onClick={() => handleStyleChange(style.id)}
                                className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all ${selectedStyle === style.id
                                    ? "text-white shadow-lg"
                                    : "bg-white text-charcoal-600 hover:bg-charcoal-50 border border-charcoal-200"
                                    }`}
                                style={selectedStyle === style.id ? { backgroundColor: style.color } : {}}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {selectedStyle === style.id && (
                                    <Check className="w-4 h-4 inline mr-1" />
                                )}
                                {style.name}
                            </motion.button>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

export default LiveFaceDemo

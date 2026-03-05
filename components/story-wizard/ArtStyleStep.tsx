"use client"

import React from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"

// Art styles data (You might want to move this to a shared config if used elsewhere)
const ART_STYLES = [
    { id: "pixar", name: "Pixar 3D", emoji: "🎬", color: "#4F46E5" },
    { id: "watercolor", name: "Acuarela", emoji: "🎨", color: "#EC4899" },
    { id: "vector", name: "Vector Moderno", emoji: "✨", color: "#06B6D4" },
    { id: "cartoon", name: "Caricatura", emoji: "🌟", color: "#F59E0B" },
]

interface ArtStyleStepProps {
    selectedStyle: string | null
    onSelect: (styleId: string) => void
}

export function ArtStyleStep({
    selectedStyle,
    onSelect
}: ArtStyleStepProps) {
    return (
        <div className="max-w-4xl mx-auto">
            <motion.div
                className="text-center mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-indigo-600/85 mb-3">Paso 5 de 6</p>
                <h2 className="text-3xl md:text-4xl font-serif text-charcoal-900 mb-2">
                    Elige el estilo artístico
                </h2>
                <p className="text-charcoal-600">
                    Cada estilo da un toque único a las ilustraciones
                </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {ART_STYLES.map((style, index) => (
                    <motion.div
                        key={style.id}
                        onClick={() => onSelect(style.id)}
                        className={`relative rounded-[28px] p-6 text-center cursor-pointer transition-all border group ${selectedStyle === style.id
                            ? "border-indigo-300/85 bg-gradient-to-br from-white to-indigo-50 ring-4 ring-indigo-400/20 shadow-[0_18px_36px_-24px_rgba(79,70,229,0.8)] scale-[1.03]"
                            : "wizard-liquid-soft border-white/70 hover:bg-white/75 hover:shadow-[0_20px_35px_-26px_rgba(79,70,229,0.6)] hover:-translate-y-1 hover:border-indigo-200/60"
                            }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className={`w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center text-5xl shadow-sm transition-all duration-500 ${selectedStyle === style.id
                            ? "bg-gradient-to-br from-indigo-100 to-white shadow-inner scale-110 rotate-3"
                            : "bg-white/85 group-hover:scale-110 group-hover:shadow-md"
                            }`}>
                            <motion.span
                                animate={selectedStyle === style.id ? { rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 0.4 }}
                            >
                                {style.emoji}
                            </motion.span>
                        </div>

                        <h3 className={`font-semibold text-lg mb-1 transition-colors ${selectedStyle === style.id ? "text-indigo-700" : "text-charcoal-800"}`}>
                            {style.name}
                        </h3>

                        <div className="h-1 w-12 mx-auto rounded-full transition-all duration-300" style={{
                            backgroundColor: selectedStyle === style.id ? "#6366f1" : 'transparent',
                            opacity: selectedStyle === style.id ? 1 : 0
                        }} />

                        {selectedStyle === style.id && (
                            <motion.div
                                className="absolute top-4 right-4 w-7 h-7 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            >
                                <Check className="w-4 h-4 text-white stroke-[3px]" />
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

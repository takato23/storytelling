"use client"

import React from "react"
import { motion } from "framer-motion"
import { User, Smile } from "lucide-react"

interface CharacterStepProps {
    childName: string
    childAge: number
    childGender: string
    onUpdate: (field: string, value: string | number) => void
}

export function CharacterStep({
    childName,
    childAge,
    childGender,
    onUpdate
}: CharacterStepProps) {
    return (
        <div className="max-w-2xl mx-auto">
            <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--play-primary)] mb-3">Paso 2 de 4</p>
                <h2 className="play-title text-3xl md:text-4xl mb-2">
                    Cuéntanos sobre tu pequeño
                </h2>
                <p className="play-copy">
                    Esta información define cómo aparecerá en la historia.
                </p>
            </motion.div>

            <motion.div
                className="space-y-8 wizard-liquid-panel p-6 md:p-8 rounded-3xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {/* Name input */}
                <div>
                    <label className="block text-sm font-semibold text-charcoal-700 mb-3 ml-1">
                        Nombre del protagonista
                    </label>
                    <input
                        type="text"
                        value={childName}
                        onChange={(e) => onUpdate("childName", e.target.value)}
                        placeholder="Ej: Lucas, Sofía..."
                        className="wizard-input w-full px-5 py-4 rounded-2xl transition-all text-lg font-medium placeholder:text-charcoal-300"
                    />
                    <p className="mt-2 text-xs text-charcoal-500">Usa el nombre que quieras ver impreso (mínimo 2 caracteres).</p>
                </div>

                {/* Age selector */}
                <div>
                    <label className="block text-sm font-semibold text-charcoal-700 mb-4 ml-1 flex justify-between items-center">
                        Edad del niño/a
                        <span className="wizard-liquid-pill text-indigo-700 font-extrabold px-3 py-1 rounded-full text-sm">{childAge} años</span>
                    </label>
                    <input
                        type="range"
                        min="3"
                        max="12"
                        value={childAge}
                        onChange={(e) => onUpdate("childAge", parseInt(e.target.value))}
                        className="w-full h-2.5 bg-charcoal-100/80 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                    />
                    <div className="flex justify-between text-xs font-bold text-charcoal-400 mt-2 px-1">
                        <span>3 años</span>
                        <span>12 años</span>
                    </div>
                </div>

                {/* Gender selector */}
                <div>
                    <label className="block text-sm font-semibold text-charcoal-700 mb-3 ml-1">
                        El protagonista es...
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { value: "boy", label: "Niño", icon: User },
                            { value: "girl", label: "Niña", icon: User },
                            { value: "neutral", label: "Neutral", icon: Smile },
                        ].map((option) => (
                            <motion.button
                                key={option.value}
                                onClick={() => onUpdate("childGender", option.value)}
                                className={`group relative p-4 rounded-2xl transition-all duration-300 overflow-hidden border ${childGender === option.value
                                    ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-[0_16px_28px_-14px_rgba(79,70,229,0.8)] scale-[1.03] border-indigo-200/60"
                                    : "wizard-liquid-soft text-charcoal-700 border-white/70 hover:bg-white/80 hover:shadow-lg hover:-translate-y-0.5"
                                    }`}
                                whileTap={{ scale: 0.95 }}
                            >
                                <div className={`text-4xl mb-2 transition-transform duration-300 flex justify-center ${childGender === option.value ? "scale-110" : "group-hover:scale-110"}`}>
                                    <option.icon className="w-10 h-10" />
                                </div>
                                <span className={`text-sm font-semibold tracking-wide ${childGender === option.value ? "text-white" : "text-charcoal-600"
                                    }`}>
                                    {option.label}
                                </span>

                                {childGender === option.value && (
                                    <motion.div
                                        layoutId="activeGender"
                                        className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent pointer-events-none"
                                    />
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

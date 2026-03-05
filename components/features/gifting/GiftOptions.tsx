"use client"

import React from "react"
import { motion } from "framer-motion"
import { Gift, Sparkles, Check } from "lucide-react"

interface GiftOptionsProps {
    selectedType: 'digital' | 'physical' | null
    onSelect: (type: 'digital' | 'physical') => void
}

export function GiftOptions({ selectedType, onSelect }: GiftOptionsProps) {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-2xl font-semibold text-charcoal-900">Elige el formato del regalo</h3>
                <p className="text-charcoal-500">¿Cómo quieres entregar esta historia mágica?</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Digital Option */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect('digital')}
                    className={`
                        relative p-6 rounded-2xl border-2 text-left transition-all overflow-hidden group
                        ${selectedType === 'digital'
                            ? "border-indigo-400 bg-gradient-to-br from-indigo-50/90 to-cyan-50/70 shadow-[0_20px_35px_-24px_rgba(79,70,229,0.75)]"
                            : "wizard-liquid-soft border-white/80 hover:border-indigo-200/80"
                        }
                    `}
                >
                    {selectedType === 'digital' && (
                        <div className="absolute top-4 right-4 bg-gradient-to-br from-indigo-600 to-violet-600 text-white p-1 rounded-full shadow-sm">
                            <Check className="w-4 h-4" />
                        </div>
                    )}

                    <div className="w-12 h-12 rounded-xl bg-indigo-100/90 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-6 h-6" />
                    </div>

                    <h4 className="text-lg font-bold text-charcoal-900 mb-2">Mágico Digital</h4>
                    <p className="text-sm text-charcoal-500 mb-4">
                        Envío instantáneo por email con una experiencia de &ldquo;unboxing&rdquo; virtual animada.
                    </p>

                    <ul className="space-y-2 text-sm text-charcoal-600">
                        <li className="flex items-center gap-2">
                            <Check className="w-3 h-3 text-purple-500" /> Cuento en PDF alta calidad
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="w-3 h-3 text-purple-500" /> Audiolibro narrado
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="w-3 h-3 text-purple-500" /> Tarjeta virtual animada
                        </li>
                    </ul>
                </motion.button>

                {/* Physical Option */}
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect('physical')}
                    className={`
                        relative p-6 rounded-2xl border-2 text-left transition-all overflow-hidden group
                        ${selectedType === 'physical'
                            ? "border-fuchsia-300 bg-gradient-to-br from-fuchsia-50/90 to-rose-50/70 shadow-[0_20px_35px_-24px_rgba(192,38,211,0.62)]"
                            : "wizard-liquid-soft border-white/80 hover:border-fuchsia-200/80"
                        }
                    `}
                >
                    {selectedType === 'physical' && (
                        <div className="absolute top-4 right-4 bg-gradient-to-br from-fuchsia-600 to-rose-500 text-white p-1 rounded-full shadow-sm">
                            <Check className="w-4 h-4" />
                        </div>
                    )}
                    <div className="absolute top-0 right-0 bg-gradient-to-bl from-amber-400 to-orange-400 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                        MÁS POPULAR
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-fuchsia-100/90 text-fuchsia-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Gift className="w-6 h-6" />
                    </div>

                    <h4 className="text-lg font-bold text-charcoal-900 mb-2">Tesoro Impreso + Digital</h4>
                    <p className="text-sm text-charcoal-500 mb-4">
                        Un hermoso libro de tapa dura entregado en su puerta, más la versión digital.
                    </p>

                    <ul className="space-y-2 text-sm text-charcoal-600">
                        <li className="flex items-center gap-2">
                            <Check className="w-3 h-3 text-fuchsia-500" /> Libro Tapa Dura Premium
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="w-3 h-3 text-fuchsia-500" /> Caja de regalo mágica
                        </li>
                        <li className="flex items-center gap-2">
                            <Check className="w-3 h-3 text-fuchsia-500" /> Todo lo del pack Digital
                        </li>
                    </ul>
                </motion.button>
            </div>
        </div>
    )
}

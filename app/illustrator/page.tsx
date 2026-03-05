"use client"

import React from "react"
import { motion } from "framer-motion"
import { IllustratorCanvas } from "@/components/features/illustrator/IllustratorCanvas"
import { ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"

export default function IllustratorPage() {
    return (
        <div className="min-h-screen bg-cream-50 pt-32 pb-20">
            <div className="container mx-auto px-6">

                <div className="flex items-center justify-between mb-8">
                    <Link href="/crear" className="flex items-center gap-2 text-charcoal-600 hover:text-coral-500 transition-colors font-medium">
                        <ArrowLeft className="w-5 h-5" />
                        Volver a crear historia
                    </Link>

                    <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-bold">
                        <Sparkles className="w-4 h-4" />
                        Modo Creativo Beta
                    </div>
                </div>

                <div className="text-center max-w-2xl mx-auto mb-12">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold text-charcoal-900 mb-4"
                    >
                        Dibuja tu propia magia
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-charcoal-600"
                    >
                        Crea dibujos únicos para incluirlos en el cuento de tu pequeño. ¡Dale rienda suelta a la imaginación!
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-5xl mx-auto"
                >
                    <IllustratorCanvas />
                </motion.div>

                <div className="max-w-3xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-charcoal-100 text-center">
                        <div className="text-4xl mb-3">🎨</div>
                        <h3 className="font-bold text-charcoal-900 mb-2">Libertad Total</h3>
                        <p className="text-sm text-charcoal-600">Usa todos los colores para expresar tu creatividad.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-charcoal-100 text-center">
                        <div className="text-4xl mb-3">✨</div>
                        <h3 className="font-bold text-charcoal-900 mb-2">Integración Mágica</h3>
                        <p className="text-sm text-charcoal-600">Tus dibujos aparecerán en las páginas del libro.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-charcoal-100 text-center">
                        <div className="text-4xl mb-3">💾</div>
                        <h3 className="font-bold text-charcoal-900 mb-2">Guardado Digital</h3>
                        <p className="text-sm text-charcoal-600">Descarga tu obra maestra en alta calidad.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

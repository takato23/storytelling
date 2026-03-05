"use client"

import React from "react"
import { motion } from "framer-motion"
import { VoiceRecorder } from "@/components/features/voice/VoiceRecorder"
import { Footer } from "@/components/layout/Footer"
import { Mic, Wand2, BookOpen, Clock } from "lucide-react"

export default function VoiceMagicPage() {
    return (
        <main className="min-h-screen bg-cream-50 pt-16">
            {/* Hero Section */}
            <section className="relative py-20 px-6 overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent" />
                <div className="absolute -top-40 right-0 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl -z-10" />
                <div className="absolute top-20 left-0 w-72 h-72 bg-coral-100/30 rounded-full blur-3xl -z-10" />

                <div className="container mx-auto max-w-5xl">
                    <div className="text-center mb-16">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-block py-1 px-3 rounded-full bg-purple-100 text-purple-700 text-sm font-bold tracking-wide uppercase mb-4"
                        >
                            Beta Exclusiva
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-bold text-charcoal-900 mb-6"
                        >
                            Narra sus cuentos,<br />Incluso cuando no estás
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-charcoal-600 max-w-2xl mx-auto"
                        >
                            Usa nuestra inteligencia artificial mágica para clonar tu voz y leer cualquiera de nuestros libros a tus hijos, en cualquier momento.
                        </motion.p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="order-2 md:order-1">
                            <VoiceRecorder />
                        </div>

                        <div className="space-y-8 order-1 md:order-2">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                                    <Mic className="w-6 h-6 text-purple-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-charcoal-900 mb-2">1. Graba tu voz</h3>
                                    <p className="text-charcoal-600">Lee un breve fragmento de texto durante 1 minuto para que aprendamos tu tono y estilo.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                                    <Wand2 className="w-6 h-6 text-coral-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-charcoal-900 mb-2">2. Magia Instantánea</h3>
                                    <p className="text-charcoal-600">Nuestra IA procesa tu voz de forma segura y crea un modelo único para ti.</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                                    <BookOpen className="w-6 h-6 text-teal-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-charcoal-900 mb-2">3. Narra todo</h3>
                                    <p className="text-charcoal-600">Aplica tu voz a cualquier historia de nuestra biblioteca con un solo clic.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Use Cases Section */}
            <section className="bg-white py-20 px-6">
                <div className="container mx-auto max-w-5xl">
                    <h2 className="text-3xl font-bold text-center text-charcoal-900 mb-12">Perfecto para...</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="group p-8 rounded-3xl bg-gradient-to-br from-white/80 to-cream-100/50 backdrop-blur-sm border border-white/60 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)] transition-all duration-500 hover:-translate-y-2">
                            <div className="text-5xl mb-5 transform group-hover:scale-125 group-hover:rotate-6 transition-transform duration-300">✈️</div>
                            <h3 className="font-bold text-xl mb-3 text-charcoal-900">Padres que viajan</h3>
                            <p className="text-charcoal-600">Mantén la rutina de lectura nocturna incluso cuando estás fuera de casa por trabajo.</p>
                        </div>
                        <div className="group p-8 rounded-3xl bg-gradient-to-br from-white/80 to-purple-100/50 backdrop-blur-sm border border-white/60 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_48px_-12px_rgba(124,58,237,0.2)] transition-all duration-500 hover:-translate-y-2">
                            <div className="text-5xl mb-5 transform group-hover:scale-125 group-hover:-rotate-6 transition-transform duration-300">👵</div>
                            <h3 className="font-bold text-xl mb-3 text-charcoal-900">Abuelos lejanos</h3>
                            <p className="text-charcoal-600">Permite que los abuelos sean parte de la infancia de sus nietos a pesar de la distancia.</p>
                        </div>
                        <div className="group p-8 rounded-3xl bg-gradient-to-br from-white/80 to-coral-100/50 backdrop-blur-sm border border-white/60 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_48px_-12px_rgba(255,112,112,0.2)] transition-all duration-500 hover:-translate-y-2">
                            <div className="text-5xl mb-5 transform group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300">🌙</div>
                            <h3 className="font-bold text-xl mb-3 text-charcoal-900">Noches cansadas</h3>
                            <p className="text-charcoal-600">Para esas noches donde quieres acompañarlos, pero tu voz necesita un descanso.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    )
}

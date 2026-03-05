"use client"

import React from "react"
import { TrustBadgesCompact } from "@/components/ui/TrustBadges"
import { BookOpen, Sparkles } from "lucide-react"

export function Footer() {
    return (
        <footer className="py-16 bg-charcoal-900 text-white">
            <div className="container mx-auto px-6">
                <div className="grid md:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-white to-charcoal-400 bg-clip-text text-transparent">StoryMagic</span>
                        </div>
                        <p className="text-charcoal-400 mb-6 max-w-sm">
                            Creamos recuerdos mágicos que durarán toda la vida.
                            Cada cuento es una aventura única para tu pequeño héroe.
                        </p>
                        {/* TrustBadgesCompact might need import check too */}
                        <TrustBadgesCompact className="!text-charcoal-400" />
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-coral-400" />
                            Producto
                        </h4>
                        <ul className="space-y-3 text-charcoal-400">
                            <li><a href="/#como-funciona" className="hover:text-coral-400 hover:translate-x-1 transition-all inline-block">Cómo funciona</a></li>
                            <li><a href="/nuestros-libros" className="hover:text-coral-400 hover:translate-x-1 transition-all inline-block">Catálogo de cuentos</a></li>
                            <li><a href="/nuestros-libros" className="hover:text-coral-400 hover:translate-x-1 transition-all inline-block">Nuestros libros</a></li>
                            <li><a href="/stickers" className="hover:text-coral-400 hover:translate-x-1 transition-all inline-block">Stickers</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-teal-400" />
                            Soporte
                        </h4>
                        <ul className="space-y-3 text-charcoal-400">
                            <li><a href="/contacto" className="hover:text-coral-400 hover:translate-x-1 transition-all inline-block">Contacto</a></li>
                            <li><a href="/#faq" className="hover:text-coral-400 hover:translate-x-1 transition-all inline-block">FAQ</a></li>
                            <li><a href="/contacto" className="hover:text-coral-400 hover:translate-x-1 transition-all inline-block">Envíos</a></li>
                            <li><a href="/contacto" className="hover:text-coral-400 hover:translate-x-1 transition-all inline-block">Devoluciones</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-charcoal-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-charcoal-500 text-sm">
                        © 2024 StoryMagic. Creando recuerdos mágicos.
                    </p>
                    <div className="flex gap-6 text-sm text-charcoal-500">
                        <a href="#" className="hover:text-coral-400 transition-colors">Términos</a>
                        <a href="#" className="hover:text-coral-400 transition-colors">Privacidad</a>
                        <a href="#" className="hover:text-coral-400 transition-colors">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

"use client"

import React from "react"
import Link from "next/link"
import { TrustBadgesCompact } from "@/components/ui/TrustBadges"
import { BookOpen, Sparkles } from "lucide-react"

export function Footer() {
    return (
        <footer className="relative overflow-hidden px-4 pb-8 pt-16 text-[var(--text-primary)]">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(47,32,51,0.08))]" />
            <div className="absolute left-0 top-0 h-64 w-64 rounded-full bg-coral-400/15 blur-[100px]" />
            <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-teal-400/12 blur-[100px]" />
            <div className="container mx-auto px-6">
                <div className="surface-panel relative mb-12 grid gap-12 rounded-[36px] px-8 py-10 md:grid-cols-4">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-coral-500 to-purple-500 shadow-lg shadow-indigo-500/20">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-[var(--text-primary)]">StoryMagic</span>
                        </div>
                        <p className="mb-6 max-w-sm text-[var(--text-secondary)]">
                            Creamos recuerdos mágicos que durarán toda la vida.
                            Cada cuento es una aventura única para tu pequeño héroe.
                        </p>
                        <TrustBadgesCompact className="!text-[var(--text-secondary)]" />
                    </div>

                    <div>
                        <h4 className="mb-4 flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                            <BookOpen className="w-4 h-4 text-coral-400" />
                            Producto
                        </h4>
                        <ul className="space-y-3 text-[var(--text-secondary)]">
                            <li><Link href="/#como-funciona" className="inline-block transition-all hover:translate-x-1 hover:text-coral-400">Cómo funciona</Link></li>
                            <li><Link href="/nuestros-libros" className="inline-block transition-all hover:translate-x-1 hover:text-coral-400">Catálogo de cuentos</Link></li>
                            <li><Link href="/nuestros-libros" className="inline-block transition-all hover:translate-x-1 hover:text-coral-400">Nuestros libros</Link></li>
                            <li><Link href="/stickers" className="inline-block transition-all hover:translate-x-1 hover:text-coral-400">Stickers</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                            <Sparkles className="w-4 h-4 text-teal-400" />
                            Soporte
                        </h4>
                        <ul className="space-y-3 text-[var(--text-secondary)]">
                            <li><Link href="/soporte" className="inline-block transition-all hover:translate-x-1 hover:text-coral-400">Soporte</Link></li>
                            <li><Link href="/#faq" className="inline-block transition-all hover:translate-x-1 hover:text-coral-400">FAQ</Link></li>
                            <li><Link href="/envios" className="inline-block transition-all hover:translate-x-1 hover:text-coral-400">Envíos</Link></li>
                            <li><Link href="/devoluciones" className="inline-block transition-all hover:translate-x-1 hover:text-coral-400">Devoluciones</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="relative flex flex-col items-center justify-between gap-4 border-t border-[var(--border-soft)] pt-8 md:flex-row">
                    <p className="text-sm text-[var(--text-muted)]">
                        © 2026 StoryMagic. Creando recuerdos mágicos.
                    </p>
                    <div className="flex gap-6 text-sm text-[var(--text-muted)]">
                        <Link href="/terminos" className="hover:text-coral-400 transition-colors">Términos</Link>
                        <Link href="/privacidad" className="hover:text-coral-400 transition-colors">Privacidad</Link>
                        <Link href="/cookies" className="hover:text-coral-400 transition-colors">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

"use client"

import React from "react"
import Link from "next/link"
import { BookOpen, Heart, LifeBuoy } from "lucide-react"
import { BrandWordmark } from "@/components/layout/BrandWordmark"
import { TrustBadgesCompact } from "@/components/ui/TrustBadges"

export function Footer() {
    return (
        <footer className="nido-footer relative overflow-hidden px-4 pb-8 pt-20">
            <div className="container mx-auto px-6">
                <div className="nido-footer-card relative mb-10 overflow-hidden rounded-[38px] px-8 py-10 md:px-10">
                    <div className="grid gap-10 md:grid-cols-[1.25fr_0.75fr_0.75fr]">
                        <div>
                            <BrandWordmark size="footer" tagline="cuentos personalizados para leer, regalar y guardar" />
                            <p className="mt-5 max-w-md text-sm leading-7 text-[var(--nido-muted)] md:text-base">
                                Una biblioteca suave, ilustrada y personal. Subís una foto, elegís la aventura y
                                recibís una historia con nombre propio.
                            </p>
                            <TrustBadgesCompact className="mt-5 !text-[var(--nido-muted)]" />
                        </div>

                        <div>
                            <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[var(--nido-ink)]">
                                <BookOpen className="h-4 w-4 text-[var(--nido-peach)]" />
                                Producto
                            </h4>
                            <ul className="space-y-3 text-sm text-[var(--nido-muted)]">
                                <li><Link href="/#como-funciona" className="nido-footer-link">Cómo funciona</Link></li>
                                <li><Link href="/nuestros-libros" className="nido-footer-link">Catálogo</Link></li>
                                <li><Link href="/stickers" className="nido-footer-link">Stickers</Link></li>
                                <li><Link href="/crear" className="nido-footer-link">Crear cuento</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-[var(--nido-ink)]">
                                <LifeBuoy className="h-4 w-4 text-[var(--nido-sage)]" />
                                Soporte
                            </h4>
                            <ul className="space-y-3 text-sm text-[var(--nido-muted)]">
                                <li><Link href="/soporte" className="nido-footer-link">Soporte</Link></li>
                                <li><Link href="/envios" className="nido-footer-link">Envíos</Link></li>
                                <li><Link href="/devoluciones" className="nido-footer-link">Devoluciones</Link></li>
                                <li><Link href="/cuenta/pedidos" className="nido-footer-link">Mis cuentos</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-4 border-t border-[var(--nido-line)] pt-6 text-sm text-[var(--nido-muted)] md:flex-row">
                    <p className="inline-flex items-center gap-2">
                        <Heart className="h-4 w-4 text-[var(--nido-rose)]" />
                        © 2026 cuento.nido. Donde nacen historias.
                    </p>
                    <div className="flex gap-6">
                        <Link href="/terminos" className="nido-footer-link">Términos</Link>
                        <Link href="/privacidad" className="nido-footer-link">Privacidad</Link>
                        <Link href="/cookies" className="nido-footer-link">Cookies</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

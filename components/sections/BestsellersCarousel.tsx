"use client"

import React, { useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Star } from "lucide-react"
import { STORIES } from "@/lib/stories"
import { Button } from "@/components/ui/button"

export function BestsellersCarousel() {
    const containerRef = useRef<HTMLDivElement>(null)

    // We'll just take the first 4 stories for the bestsellers
    const bestsellers = STORIES.slice(0, 4)

    return (
        <section className="relative overflow-hidden py-14 lg:py-18">
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background: `
                      radial-gradient(circle at 20% 0%, rgba(216, 183, 241, 0.12), transparent 28%),
                      radial-gradient(circle at 82% 8%, rgba(240, 161, 127, 0.1), transparent 26%),
                      linear-gradient(180deg, transparent 0%, rgba(47, 32, 51, 0.06) 100%)
                    `,
                }}
            />
            <div className="container mx-auto px-4 lg:px-8">
                <div className="mb-10 flex flex-col items-center justify-between gap-6 md:flex-row">
                    <div className="mb-4 text-center md:mb-0 md:text-left">
                        <span className="section-kicker mb-4">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            Favoritos de familias
                        </span>
                        <h2 className="section-heading mb-2 text-3xl md:text-4xl font-bold">Más vendidos</h2>
                        <p className="section-copy font-semibold">Los cuentos que más eligen las familias.</p>
                    </div>
                    <div className="hidden md:flex gap-4">
                        <button className="surface-chip flex h-12 w-12 items-center justify-center rounded-full text-purple-600 transition-colors hover:bg-[var(--surface-strong)]">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button className="surface-chip flex h-12 w-12 items-center justify-center rounded-full text-purple-600 transition-colors hover:bg-[var(--surface-strong)]">
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Horizontal Scroll Snap Container for mobile, Grid for Desktop */}
                <div
                    ref={containerRef}
                    className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 pb-8 -mx-4 px-4 md:mx-0 md:px-0"
                >
                    {bestsellers.map((story, i) => (
                        <motion.div
                            key={story.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="page-panel group relative min-w-[280px] w-[85vw] flex-shrink-0 snap-center overflow-hidden rounded-[32px] border md:w-auto transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="relative h-56 overflow-hidden bg-purple-50">
                                <img src={story.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={story.title} />
                                <div className="absolute top-4 left-4">
                                    <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-charcoal-800 shadow-sm backdrop-blur">
                                        {i === 0 ? "🏆 #1 Elegido" : "⭐ Popular"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center p-6 text-center">
                                <h3 className="section-heading mb-2 text-xl font-bold">{story.title}</h3>

                                <div className="flex items-center gap-1 text-yellow-400 mb-4">
                                    {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
                                    <span className="text-xs text-charcoal-400 font-bold ml-1">({4.8 + (i * 0.1)}/5)</span>
                                </div>

                                <div className="font-bold text-2xl text-charcoal-800 mb-6">
                                    ${story.price}
                                </div>

                                <Link href={`/cuentos/${story.slug}`} className="w-full">
                                    <Button className="w-full rounded-2xl bg-charcoal-900 py-6 text-sm font-bold text-white shadow-md shadow-purple-200 transition-all active:scale-95 group/btn hover:bg-purple-700 hover:shadow-lg">
                                        Personalizar
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    )
}

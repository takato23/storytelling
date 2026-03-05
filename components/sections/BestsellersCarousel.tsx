"use client"

import React, { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Star, BookOpen } from "lucide-react"
import { STORIES } from "@/lib/stories"
import { Button } from "@/components/ui/button"

export function BestsellersCarousel() {
    const containerRef = useRef<HTMLDivElement>(null)

    // We'll just take the first 4 stories for the bestsellers
    const bestsellers = STORIES.slice(0, 4)

    return (
        <section className="py-20 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4 lg:px-8">

                <div className="flex flex-col md:flex-row items-center justify-between mb-12">
                    <div className="text-center md:text-left mb-6 md:mb-0">
                        <h2 className="text-3xl md:text-4xl font-serif text-[#2D1B4E] font-bold mb-2">Más Vendidos</h2>
                        <p className="text-charcoal-500 font-medium">Los cuentos favoritos de nuestra comunidad mágica.</p>
                    </div>
                    <div className="hidden md:flex gap-4">
                        {/* These buttons could be hooked up to scroll the container, but since there are 4 items, they fit nicely in grid for desktop */}
                        <button className="w-12 h-12 rounded-full border border-purple-100 flex items-center justify-center text-purple-600 hover:bg-purple-50 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button className="w-12 h-12 rounded-full border border-purple-100 flex items-center justify-center text-purple-600 hover:bg-purple-50 transition-colors">
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
                            className="min-w-[280px] w-[85vw] md:w-auto snap-center flex-shrink-0 group relative bg-white border border-purple-50 rounded-[32px] overflow-hidden shadow-[0_15px_30px_-15px_rgba(147,51,234,0.1)] hover:shadow-[0_25px_50px_-15px_rgba(147,51,234,0.2)] hover:border-purple-200 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="h-56 relative overflow-hidden bg-purple-50">
                                <img src={story.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={story.title} />
                                {/* Top Badges */}
                                <div className="absolute top-4 left-4">
                                    <span className="bg-white/90 backdrop-blur text-charcoal-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                                        {i === 0 ? "🏆 #1 Elegido" : "⭐ Popular"}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 flex flex-col items-center text-center">
                                <h3 className="text-xl font-serif font-bold text-[#2D1B4E] mb-2">{story.title}</h3>

                                <div className="flex items-center gap-1 text-yellow-400 mb-4">
                                    {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
                                    <span className="text-xs text-charcoal-400 font-bold ml-1">({4.8 + (i * 0.1)}/5)</span>
                                </div>

                                <div className="font-bold text-2xl text-charcoal-800 mb-6">
                                    ${story.price}
                                </div>

                                <Link href={`/cuentos/${story.slug}`} className="w-full">
                                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-6 font-bold text-sm shadow-md shadow-purple-200 hover:shadow-lg transition-all active:scale-95 group/btn">
                                        Personalizar Ahora
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

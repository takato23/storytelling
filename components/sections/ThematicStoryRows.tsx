"use client"

import React, { useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, BookOpen, Eye, ChevronRight, ChevronLeft } from "lucide-react"
import { STORIES, Story } from "@/lib/stories"
import { WishlistButton } from "@/components/features/wishlist"
import { BookPreview, useBookPreview } from "@/components/features/preview"

// Curated lists based on WonderWraps' high-conversion categories
const THEMATIC_ROWS = [
    {
        id: "aventureros",
        title: "Para pequeños aventureros",
        subtitle: "Historias llenas de acción y descubrimientos",
        color: "text-blue-600",
        badgeBg: "bg-blue-100",
        stories: STORIES.filter(s => ["el-explorador-espacial", "el-domador-de-dinosaurios"].includes(s.slug))
    },
    {
        id: "sonadoras",
        title: "Para pequeñas soñadoras",
        subtitle: "Mundos mágicos donde todo es posible",
        color: "text-pink-500",
        badgeBg: "bg-pink-100",
        stories: STORIES.filter(s => ["el-bosque-magico", "el-castillo-en-las-nubes"].includes(s.slug))
    },
    {
        id: "profesiones",
        title: "¡Descubre las profesiones!",
        subtitle: "Inspira su futuro con aventuras hiper-personalizadas",
        color: "text-purple-600",
        badgeBg: "bg-purple-100",
        stories: STORIES.filter(s => ["la-estrella-del-futbol", "el-explorador-espacial"].includes(s.slug))
    }
]

export function ThematicStoryRows({ className = "" }: { className?: string }) {
    const { previewState, openPreview, closePreview } = useBookPreview()

    return (
        <section className={`py-16 bg-cream-50 ${className}`}>
            <div className="container mx-auto px-6 mb-12 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-purple-100/50 border border-purple-200 text-purple-700 text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-sm">
                        Catálogo Curado
                    </span>
                    <h2 className="text-3xl md:text-5xl font-serif text-charcoal-900 mb-4 drop-shadow-sm">
                        Encuentra su <span className="text-purple-600">favorito</span>
                    </h2>
                </motion.div>
            </div>

            <div className="flex flex-col gap-16">
                {THEMATIC_ROWS.map((row, rowIndex) => (
                    <div key={row.id} className="relative">
                        <div className="container mx-auto px-6 mb-6 flex items-end justify-between">
                            <div>
                                <h3 className={`text-2xl md:text-3xl font-bold font-serif ${row.color} mb-1 flex items-center gap-3`}>
                                    {row.title}
                                </h3>
                                <p className="text-charcoal-500 text-sm md:text-base font-medium">{row.subtitle}</p>
                            </div>
                            <Link href="/catalogo" className="hidden md:flex items-center gap-1 text-sm font-bold text-charcoal-400 hover:text-charcoal-900 transition-colors">
                                Ver todos <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Scrollable Row */}
                        <div className="w-full overflow-x-auto pb-8 pt-4 hide-scrollbar snap-x snap-mandatory px-6 md:px-12">
                            <div className="flex gap-6 w-max mx-auto md:mx-0">
                                {row.stories.map((story, index) => (
                                    <motion.div
                                        key={story.id}
                                        className="w-[280px] md:w-[320px] shrink-0 snap-start h-full"
                                        initial={{ opacity: 0, x: 50 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true, margin: "-50px" }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="relative bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_50px_-15px_rgba(147,51,234,0.2)] transition-all duration-500 h-full flex flex-col group hover:-translate-y-2">
                                            {/* Story cover image */}
                                            <div className="h-56 relative overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-700">
                                                <img
                                                    src={story.coverImage}
                                                    alt={story.title}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                                {/* Actions Overlay */}
                                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0 z-10">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            openPreview({
                                                                title: story.title,
                                                                cover: story.coverImage,
                                                                pages: story.previewImages.map(img => ({ image: img })),
                                                                price: `$${story.price}`,
                                                                slug: story.slug
                                                            })
                                                        }}
                                                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-charcoal-600 hover:bg-white hover:text-purple-600 transition-colors shadow-lg"
                                                        title="Vista previa"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <div onClick={(e) => e.preventDefault()}>
                                                        <WishlistButton
                                                            item={{
                                                                id: story.id,
                                                                slug: story.slug,
                                                                title: story.title,
                                                                coverImage: story.coverImage,
                                                                price: `$${story.price}`
                                                            }}
                                                            size="sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6 flex flex-col flex-grow relative bg-white">
                                                <h4 className="text-xl font-serif text-charcoal-900 mb-2 leading-tight group-hover:text-purple-700 transition-colors">{story.title}</h4>

                                                <div className="flex items-center justify-between mt-auto pt-6">
                                                    <Link href={`/crear?story=${story.slug}`} className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 group-hover:bg-purple-700 transition-all shadow-md hover:shadow-lg">
                                                        Personalizar
                                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                    </Link>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-charcoal-400">
                                                        <BookOpen className="w-3.5 h-3.5" />
                                                        {story.pages} Pág
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Book Preview Modal */}
            {previewState.bookData && (
                <BookPreview
                    isOpen={previewState.isOpen}
                    onClose={closePreview}
                    bookTitle={previewState.bookData.title}
                    bookCover={previewState.bookData.cover}
                    pages={previewState.bookData.pages}
                    price={previewState.bookData.price}
                    slug={previewState.bookData.slug}
                />
            )}

            <style jsx>{`
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </section>
    )
}

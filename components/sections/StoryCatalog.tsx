"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ArrowRight, BookOpen, Eye, Filter } from "lucide-react"
import { STORIES, Story } from "@/lib/stories"
import { WishlistButton } from "@/components/features/wishlist"
import { BookPreview, useBookPreview } from "@/components/features/preview"

interface StoryCatalogProps {
    title?: React.ReactNode
    subtitle?: string
    stories?: Story[]
    className?: string
    showFilter?: boolean
}

export function StoryCatalog({
    title = "Nuestras historias",
    subtitle = "Cada cuento está diseñado para despertar la imaginación",
    stories = STORIES,
    className = "",
    showFilter = true
}: StoryCatalogProps) {
    const { previewState, openPreview, closePreview } = useBookPreview()
    const [genderFilter, setGenderFilter] = useState<"todos" | "niña" | "niño" | "unisex">("todos")
    const [ageFilter, setAgeFilter] = useState("Todas")
    const ageOptions = useMemo(
        () => ["Todas", ...Array.from(new Set(stories.map((story) => story.ages)))],
        [stories],
    )

    const filteredStories = useMemo(() => {
        return stories.filter((story) => {
            const genderMatches = genderFilter === "todos" || story.targetGender === genderFilter
            const ageMatches = ageFilter === "Todas" || story.ages === ageFilter
            return genderMatches && ageMatches
        })
    }, [genderFilter, ageFilter, stories])

    return (
        <section className={`py-24 ${className}`}>
            <div className="container mx-auto px-6">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    {typeof title === 'string' ? (
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif text-charcoal-900 mb-4 drop-shadow-sm">
                            {title}
                        </h2>
                    ) : (
                        title
                    )}

                    {subtitle && (
                        <p className="text-charcoal-500 font-medium tracking-[0.15em] uppercase text-xs">
                            {subtitle}
                        </p>
                    )}
                </motion.div>

                {showFilter && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-12 space-y-4"
                    >
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <Filter className="w-4 h-4 mr-2 text-charcoal-400" />
                            <span className="text-xs font-bold tracking-[0.14em] uppercase text-charcoal-500">Sexo</span>
                            {[
                                { id: "todos", label: "Todos" },
                                { id: "niña", label: "Niña" },
                                { id: "niño", label: "Niño" },
                                { id: "unisex", label: "Unisex" },
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setGenderFilter(option.id as "todos" | "niña" | "niño" | "unisex")}
                                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${genderFilter === option.id
                                        ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                                        : "bg-white text-charcoal-600 border border-purple-100 hover:bg-purple-50 hover:border-purple-200"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <span className="text-xs font-bold tracking-[0.14em] uppercase text-charcoal-500">Edad</span>
                            {ageOptions.map((age) => (
                                <button
                                    key={age}
                                    onClick={() => setAgeFilter(age)}
                                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${ageFilter === age
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                        : "bg-white text-charcoal-600 border border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200"
                                        }`}
                                >
                                    {age}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {filteredStories.length === 0 ? (
                    <div className="text-center py-12 text-charcoal-500">
                        <p>No se encontraron historias con estos criterios.</p>
                    </div>
                ) : (
                    <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <AnimatePresence>
                            {filteredStories.map((story, index) => (
                                <motion.div
                                    key={story.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    <Link href={`/cuentos/${story.slug}`} className="group h-full block">
                                        <motion.div
                                            className="relative bg-white/80 backdrop-blur-xl rounded-[32px] overflow-hidden border border-white shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] transition-all duration-500 h-full flex flex-col group-hover:-translate-y-2"
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            {/* Story cover image */}
                                            <div className="h-48 relative overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-700">
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
                                                        className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-charcoal-600 hover:bg-white hover:text-indigo-600 transition-colors shadow-lg"
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
                                            <div className="p-8 flex flex-col flex-grow relative">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className="px-3 py-1 rounded-xl bg-charcoal-900/5 text-charcoal-600 text-[10px] font-black uppercase tracking-widest border border-charcoal-900/5">
                                                        {story.style}
                                                    </span>
                                                    <span className="text-[10px] font-black text-charcoal-400 uppercase tracking-widest">{story.ages}</span>
                                                </div>

                                                <h3 className="text-xl font-serif text-charcoal-900 mb-3 leading-tight group-hover:text-indigo-900 transition-colors">{story.title}</h3>
                                                <p className="text-sm text-charcoal-500 line-clamp-2 mb-6 font-medium leading-relaxed">{story.shortDescription}</p>
                                                <div className="mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3 space-y-2">
                                                    <div className="flex items-center justify-between text-xs font-semibold text-indigo-700">
                                                        <span>Descarga online</span>
                                                        <span className="font-black">
                                                            {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(story.digitalPriceArs)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs font-semibold text-charcoal-700">
                                                        <span>Cuento impreso</span>
                                                        <span className="font-black">
                                                            {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(story.printPriceArs)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between mt-auto border-t border-charcoal-900/5 pt-4">
                                                    <span className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 group-hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
                                                        Personalizar Ahora
                                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-charcoal-400">
                                                        <BookOpen className="w-3.5 h-3.5" />
                                                        {story.pages} PÁGS
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>


            {/* Book Preview Modal */}
            {
                previewState.bookData && (
                    <BookPreview
                        isOpen={previewState.isOpen}
                        onClose={closePreview}
                        bookTitle={previewState.bookData.title}
                        bookCover={previewState.bookData.cover}
                        pages={previewState.bookData.pages}
                        price={previewState.bookData.price}
                        slug={previewState.bookData.slug}
                    />
                )
            }
        </section >
    )
}

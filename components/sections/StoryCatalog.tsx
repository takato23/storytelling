"use client"

import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Eye, Filter, Star } from "lucide-react"
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
    subtitle = "Elegí una aventura y personalizala",
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
                        <h2 className="play-title mb-4 text-3xl md:text-4xl lg:text-5xl">
                            {title}
                        </h2>
                    ) : (
                        title
                    )}

                    {subtitle && (
                        <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--play-text-muted)]">
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
                            <Filter className="mr-2 h-4 w-4 text-[var(--play-text-muted)]" />
                            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--play-text-muted)]">Personaje</span>
                            {[
                                { id: "todos", label: "Todos" },
                                { id: "niña", label: "Niña" },
                                { id: "niño", label: "Niño" },
                                { id: "unisex", label: "Unisex" },
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setGenderFilter(option.id as "todos" | "niña" | "niño" | "unisex")}
                                    className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${genderFilter === option.id
                                        ? "bg-[var(--play-primary)] text-white shadow-[0_10px_24px_-18px_rgba(0,93,167,0.3)]"
                                        : "play-pill border-[var(--play-outline)] bg-[var(--play-surface-lowest)] text-[var(--play-text-muted)] hover:border-[var(--play-primary)]/30 hover:text-[var(--play-primary)]"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--play-text-muted)]">Edad</span>
                            {ageOptions.map((age) => (
                                <button
                                    key={age}
                                    onClick={() => setAgeFilter(age)}
                                    className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${ageFilter === age
                                        ? "bg-[var(--play-primary)] text-white shadow-[0_10px_24px_-18px_rgba(0,93,167,0.3)]"
                                        : "play-pill border-[var(--play-outline)] bg-[var(--play-surface-lowest)] text-[var(--play-text-muted)] hover:border-[var(--play-primary)]/30 hover:text-[var(--play-primary)]"
                                        }`}
                                >
                                    {age}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {filteredStories.length === 0 ? (
                    <div className="py-12 text-center text-[var(--play-text-muted)]">
                        <p>No se encontraron historias con estos criterios.</p>
                    </div>
                ) : (
                    <motion.div layout className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
                                            className="group relative flex h-full flex-col overflow-hidden rounded-[32px] bg-[var(--play-surface-high)] p-4 shadow-[0_18px_42px_-30px_rgba(0,93,167,0.3)] transition-all duration-500 hover:-translate-y-1"
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            {/* Story cover image */}
                                            <div className="relative mb-5 aspect-[3/4] overflow-hidden rounded-[26px] shadow-lg">
                                                <img
                                                    src={story.coverImage}
                                                    alt={story.title}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                                                {/* Actions Overlay */}
                                                <div className="absolute right-3 top-3 z-10 flex translate-y-2 gap-2 opacity-0 transition-opacity duration-300 group-hover:translate-y-0 group-hover:opacity-100">
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
                                                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--play-surface-lowest)] text-[var(--play-text-muted)] shadow-lg transition-colors hover:text-[var(--play-primary)]"
                                                        title="Ver preview"
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
                                            <div className="relative flex flex-grow flex-col px-2 pb-2">
                                                <div className="mb-3 flex items-center gap-3">
                                                    <span className="rounded-full bg-[var(--play-surface-lowest)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--play-text-muted)]">
                                                        {story.style}
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--play-text-muted)]">{story.ages}</span>
                                                </div>

                                                <h3 className="mb-2 text-2xl font-black leading-tight text-[var(--play-text-main)]">{story.title}</h3>
                                                <p className="mb-4 text-sm font-medium leading-relaxed text-[var(--play-text-muted)]">{story.shortDescription}</p>

                                                <div className="mt-auto flex items-center justify-between gap-4">
                                                    <span className="flex items-center gap-1 text-sm font-bold text-[var(--play-secondary-strong)]">
                                                        <Star className="h-4 w-4 fill-current" />
                                                        {story.reviews[0]?.rating?.toFixed(1) ?? "4.9"}
                                                    </span>
                                                    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--play-primary)] px-4 py-3 text-sm font-black text-white shadow-lg transition-transform group-hover:scale-105">
                                                        Personalizar
                                                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                                    </span>
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
        </section>
    )
}

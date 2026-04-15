"use client"

import React, { useMemo, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { VALENTIN_PREVIEW_LAYOUTS } from "@/lib/books/valentin-preview-layout"

interface FlipbookPage {
    id: string
    imageUrl: string
    text: string
    pageNumber: number
    title?: string
    childName?: string
}

interface FlipbookPreviewProps {
    title: string
    pages: FlipbookPage[]
    onComplete?: () => void
    showWatermark?: boolean
    layout?: "spread" | "full-image"
}

export function FlipbookPreview({
    title,
    pages,
    onComplete,
    showWatermark = true,
    layout = "spread",
}: FlipbookPreviewProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const prefersReducedMotion = useReducedMotion()

    const safePages = useMemo(() => pages.filter((page) => page.imageUrl), [pages])
    const currentPage = safePages[currentIndex] ?? null
    const layoutPreset = currentPage ? VALENTIN_PREVIEW_LAYOUTS[currentPage.id] ?? null : null
    const isCoverScene = currentPage?.id === "cover"

    // Cover is square (21x21cm), spreads are wide (16:9)
    const aspectClass = isCoverScene ? "aspect-square" : "aspect-[16/10]"

    const handleNext = () => {
        if (currentIndex < safePages.length - 1) {
            setCurrentIndex((previous) => previous + 1)
            return
        }
        onComplete?.()
    }

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex((previous) => previous - 1)
        }
    }

    if (safePages.length === 0) {
        return (
            <div className="flex min-h-[380px] flex-col items-center justify-center rounded-[var(--play-radius-panel)] border border-dashed border-[var(--play-outline)]/40 bg-[var(--play-surface-low)] px-6 py-10 text-center">
                <Sparkles className="mb-4 h-10 w-10 text-[var(--play-primary)]" />
                <h3 className="text-xl font-bold text-[var(--play-text-main)]">Sin páginas para mostrar</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-[var(--play-text-muted)]">
                    Cuando la generación termine, aquí aparecerá la portada personalizada.
                </p>
            </div>
        )
    }

    return (
        <div className="relative flex flex-col items-center justify-center">
            {/* Image container — square for cover, wide for spreads */}
            <div className={`relative ${aspectClass} w-full ${isCoverScene ? "max-w-[520px]" : "max-w-[980px]"} overflow-hidden rounded-[var(--play-radius-panel)] border border-[var(--play-outline)]/20 bg-[var(--play-surface-low)] shadow-[var(--shadow-card)]`}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentPage?.id ?? "empty"}
                        initial={prefersReducedMotion ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0"
                    >
                        {layout === "full-image" ? (
                            <div className="relative h-full w-full overflow-hidden">
                                <img
                                    src={currentPage?.imageUrl}
                                    alt={`${title} · página ${currentPage?.pageNumber ?? currentIndex + 1}`}
                                    className="h-full w-full object-cover"
                                    draggable={false}
                                />

                                {/* Cover text overlay */}
                                {isCoverScene && (
                                    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-[7%]">
                                        <div className="text-center pt-[2%]">
                                            <h3
                                                className="font-serif font-bold leading-[1.08] tracking-tight text-white"
                                                style={{
                                                    fontSize: "clamp(1.4rem, 4.5vw, 2.4rem)",
                                                    textShadow: "0 2px 12px rgba(0,0,0,0.55), 0 1px 3px rgba(0,0,0,0.3)",
                                                }}
                                            >
                                                {title}
                                            </h3>
                                        </div>
                                        <div className="text-center pb-[1%]">
                                            <p
                                                className="font-serif font-medium tracking-wider text-white/85"
                                                style={{
                                                    fontSize: "clamp(0.6rem, 1.5vw, 0.9rem)",
                                                    textShadow: "0 1px 8px rgba(0,0,0,0.5)",
                                                    letterSpacing: "0.08em",
                                                }}
                                            >
                                                Un cuento solo para {currentPage?.childName || "ti"}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Spread text overlay with layout preset */}
                                {!isCoverScene && layoutPreset && currentPage?.text && (
                                    <div className="pointer-events-none absolute inset-0 text-white">
                                        <div
                                            className={`absolute font-serif font-semibold leading-none ${layoutPreset.title.align === "center" ? "text-center" : "text-left"}`}
                                            style={{
                                                left: `${layoutPreset.title.left}%`,
                                                top: `${layoutPreset.title.top}%`,
                                                width: `${layoutPreset.title.width}%`,
                                                fontSize: "clamp(0.85rem, 1.8vw, 1.4rem)",
                                                textShadow: "0 2px 8px rgba(0,0,0,0.7)",
                                            }}
                                        >
                                            {currentPage.title ?? ""}
                                        </div>
                                        <div
                                            className={`absolute font-serif leading-[1.2] ${layoutPreset.body.align === "center" ? "text-center" : "text-left"}`}
                                            style={{
                                                left: `${layoutPreset.body.left}%`,
                                                top: `${layoutPreset.body.top}%`,
                                                width: `${layoutPreset.body.width}%`,
                                                fontSize: "clamp(1rem, 2vw, 1.8rem)",
                                                textShadow: "0 2px 10px rgba(0,0,0,0.8)",
                                            }}
                                        >
                                            {currentPage.text}
                                        </div>
                                    </div>
                                )}

                                {/* Fallback text overlay */}
                                {!isCoverScene && !layoutPreset && currentPage?.text && (
                                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/30 to-transparent px-8 pb-5 pt-14">
                                        <p
                                            className="mx-auto max-w-2xl text-center font-serif text-white leading-relaxed"
                                            style={{
                                                fontSize: "clamp(0.85rem, 1.6vw, 1.15rem)",
                                                textShadow: "0 1px 6px rgba(0,0,0,0.4)",
                                            }}
                                        >
                                            {currentPage.text}
                                        </p>
                                    </div>
                                )}

                                {/* Watermark */}
                                {showWatermark && (
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <p
                                            className="rotate-[-22deg] font-black uppercase tracking-[0.25em] text-white/[0.18]"
                                            style={{
                                                fontSize: isCoverScene ? "clamp(1.5rem, 8vw, 3rem)" : "clamp(2rem, 5vw, 3.5rem)",
                                                textShadow: "0 2px 8px rgba(0,0,0,0.15)",
                                            }}
                                        >
                                            PREVIEW
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Spread layout with side text */
                            <div className="grid h-full grid-cols-1 md:grid-cols-[1.1fr_0.9fr]">
                                <div className="h-full overflow-hidden bg-[var(--play-surface-low)]">
                                    <img
                                        src={currentPage?.imageUrl}
                                        alt={`${title} · página ${currentPage?.pageNumber ?? currentIndex + 1}`}
                                        className="h-full w-full object-cover"
                                        draggable={false}
                                    />
                                </div>
                                <div className="flex h-full items-center justify-center bg-white px-6 py-8 md:px-10">
                                    <div className="text-center">
                                        <p className="font-serif text-lg leading-relaxed text-[var(--play-text-main)] md:text-2xl">
                                            {currentPage?.text || "..."}
                                        </p>
                                        <span className="mt-6 block text-xs font-bold uppercase tracking-[0.16em] text-[var(--play-text-muted)]">
                                            Página {currentPage?.pageNumber ?? currentIndex + 1}
                                        </span>
                                    </div>
                                </div>

                                {showWatermark && (
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <p className="rotate-[-22deg] text-3xl font-black uppercase tracking-[0.25em] text-black/[0.06]">
                                            PREVIEW
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation arrows — only show when multiple pages */}
                {safePages.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            aria-label="Página anterior"
                            className="absolute left-2.5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-md transition-all hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                        >
                            <ChevronLeft className="h-4 w-4 text-[var(--play-text-main)]" />
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentIndex >= safePages.length - 1}
                            aria-label="Página siguiente"
                            className="absolute right-2.5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-md transition-all hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-0 disabled:pointer-events-none"
                        >
                            <ChevronRight className="h-4 w-4 text-[var(--play-text-main)]" />
                        </button>
                    </>
                )}
            </div>

            {/* Page dots — only show when multiple pages */}
            {safePages.length > 1 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {safePages.map((page, index) => (
                        <button
                            key={page.id}
                            onClick={() => setCurrentIndex(index)}
                            className={`h-2.5 rounded-full transition-all ${currentIndex === index
                                ? "w-7 bg-[var(--play-primary)]"
                                : "w-2.5 bg-[var(--play-outline)]/40 hover:bg-[var(--play-primary-container)]"
                                }`}
                            aria-label={`Ir a página ${page.pageNumber}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

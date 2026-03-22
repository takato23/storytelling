"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Sparkles, BookOpen } from "lucide-react"
import { Canvas } from "@react-three/fiber"
import { MagicalReveal } from "@/components/effects/MagicalReveal"

interface FlipbookPage {
    id: string
    imageUrl: string
    text: string
    pageNumber: number
}

interface FlipbookPreviewProps {
    title: string
    pages: FlipbookPage[]
    onComplete?: () => void
    showWatermark?: boolean
}

export function FlipbookPreview({ title, pages, onComplete, showWatermark = true }: FlipbookPreviewProps) {
    const [currentPage, setCurrentPage] = useState(0)
    const [revealProgress, setRevealProgress] = useState(0)
    const [showOverlay, setShowOverlay] = useState(true)

    // Trigger reveal on mount
    React.useEffect(() => {
        // Start reveal after a short delay
        const timer = setTimeout(() => {
            setRevealProgress(1)
        }, 500)

        // Hide overlay layer after animation to allow clicks
        const cleanup = setTimeout(() => {
            setShowOverlay(false)
        }, 2500)

        return () => {
            clearTimeout(timer)
            clearTimeout(cleanup)
        }
    }, [])

    const handleNext = () => {
        if (currentPage < pages.length) {
            setCurrentPage(prev => prev + 1)
        } else if (onComplete) {
            onComplete()
        }
    }

    const handlePrev = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1)
        }
    }

    return (
        <div className="relative flex flex-col items-center justify-center py-2">
            {showOverlay && (
                <div className="absolute inset-0 z-50 pointer-events-none">
                    <Canvas>
                        <MagicalReveal progress={revealProgress} color="#4338ca" />
                    </Canvas>
                </div>
            )}
            <div className="relative aspect-[16/9] w-full max-w-[980px] perspective-[1500px]">
                <AnimatePresence mode="wait">
                    <div className="flex h-full items-center justify-center">
                        <motion.div
                            key={currentPage}
                            initial={{ rotateY: 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: -90, opacity: 0 }}
                            transition={{ duration: 0.6, type: "spring" }}
                            className="relative flex h-full w-full overflow-hidden rounded-[28px] border border-[#d9e2ff] bg-white shadow-2xl"
                            style={{ transformStyle: "preserve-3d" }}
                            onContextMenu={(event) => event.preventDefault()}
                        >
                            {/* Page Content */}
                            {currentPage === 0 ? (
                                // Cover
                                <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 p-8 text-center text-white">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
                                    <BookOpen className="mb-5 h-20 w-20 text-indigo-200" />
                                    <h1 className="mb-4 font-serif text-3xl font-bold drop-shadow-md md:text-5xl">{title}</h1>
                                    <p className="text-lg text-indigo-100 md:text-xl">Una historia mágica personalizada</p>

                                    <div className="mt-10 animate-bounce">
                                        <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-bold backdrop-blur-sm">
                                            ¡Abre el libro!
                                        </span>
                                    </div>

                                    {/* Cover Shine */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                                </div>
                            ) : (
                                // Story Page
                                <div className="flex h-full w-full flex-col md:flex-row">
                                    {/* Image Side */}
                                    <div className="relative h-1/2 w-full bg-gray-100 md:h-full md:w-1/2">
                                        {pages[currentPage - 1]?.imageUrl ? (
                                            <img
                                                src={pages[currentPage - 1].imageUrl}
                                                alt={`Página ${currentPage}`}
                                                className="w-full h-full object-cover"
                                                draggable={false}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-indigo-50">
                                                <Sparkles className="w-12 h-12 text-indigo-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Text Side */}
                                    <div className="flex h-1/2 w-full items-center justify-center bg-cream-50 p-6 md:h-full md:w-1/2 md:p-8">
                                        <div className="text-center">
                                            <p className="font-serif text-lg leading-relaxed text-charcoal-800 md:text-2xl">
                                                {pages[currentPage - 1]?.text || "..."}
                                            </p>
                                            <span className="mt-6 block text-sm font-bold text-charcoal-400">
                                                - {currentPage} -
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Center Spine Effect */}
                            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/16 to-transparent" />
                            {showWatermark && (
                                <div className="absolute inset-0 pointer-events-none select-none">
                                    <div className="absolute inset-0 grid place-items-center">
                                        <p className="text-[34px] md:text-[42px] font-black tracking-[0.2em] text-white/45 rotate-[-18deg] drop-shadow-[0_2px_6px_rgba(17,24,39,0.35)]">
                                            PREVIEW
                                        </p>
                                    </div>
                                    <div className="absolute inset-x-0 top-2 text-center text-[10px] font-bold tracking-[0.2em] text-indigo-50/85">
                                        STORYMAGIC · VISTA PREVIA
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </AnimatePresence>

                <button
                    onClick={handlePrev}
                    disabled={currentPage === 0}
                    className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/88 p-3 shadow-lg transition-all hover:bg-white hover:scale-105 disabled:opacity-30"
                >
                    <ChevronLeft className="h-5 w-5 text-indigo-900" />
                </button>

                <button
                    onClick={handleNext}
                    disabled={currentPage === pages.length}
                    className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/88 p-3 shadow-lg transition-all hover:bg-white hover:scale-105 disabled:opacity-30"
                >
                    <ChevronRight className="h-5 w-5 text-indigo-900" />
                </button>
            </div>

            {/* Page Indicators */}
            <div className="mt-4 flex gap-2">
                {[0, ...pages.map((_, i) => i + 1)].map((page) => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-3 h-3 rounded-full transition-all ${currentPage === page ? "bg-indigo-600 scale-125" : "bg-indigo-200 hover:bg-indigo-400"
                            }`}
                    />
                ))}
            </div>
        </div>
    )
}

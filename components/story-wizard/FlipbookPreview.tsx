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
        <div className="flex flex-col items-center justify-center py-8 relative">
            {showOverlay && (
                <div className="absolute inset-0 z-50 pointer-events-none">
                    <Canvas>
                        <MagicalReveal progress={revealProgress} color="#4338ca" />
                    </Canvas>
                </div>
            )}
            <div className="relative w-full max-w-4xl aspect-[3/2] perspective-[1500px]">
                <AnimatePresence mode="wait">
                    {/* Simplified Flipbook Representation for now using a nice slider/card carousel with 3D feel */}
                    <div className="w-full h-full flex items-center justify-center gap-8">
                        {/* Left Control */}
                        <button
                            onClick={handlePrev}
                            disabled={currentPage === 0}
                            className="p-3 bg-white/80 rounded-full shadow-lg disabled:opacity-30 hover:bg-white hover:scale-110 transition-all z-10"
                        >
                            <ChevronLeft className="w-6 h-6 text-indigo-900" />
                        </button>

                        {/* Book Content */}
                        <motion.div
                            key={currentPage}
                            initial={{ rotateY: 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: -90, opacity: 0 }}
                            transition={{ duration: 0.6, type: "spring" }}
                            className="flex-1 h-full bg-white rounded-r-2xl shadow-2xl flex overflow-hidden border-l-4 border-indigo-100 relative max-w-2xl"
                            style={{ transformStyle: "preserve-3d" }}
                            onContextMenu={(event) => event.preventDefault()}
                        >
                            {/* Page Content */}
                            {currentPage === 0 ? (
                                // Cover
                                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 p-8 flex flex-col items-center justify-center text-white text-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
                                    <BookOpen className="w-24 h-24 mb-6 text-indigo-200" />
                                    <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4 drop-shadow-md">{title}</h1>
                                    <p className="text-xl text-indigo-100">Una historia mágica personalizada</p>

                                    <div className="mt-12 animate-bounce">
                                        <span className="text-sm font-bold bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm">
                                            ¡Abre el libro!
                                        </span>
                                    </div>

                                    {/* Cover Shine */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
                                </div>
                            ) : (
                                // Story Page
                                <div className="w-full h-full flex flex-col md:flex-row">
                                    {/* Image Side */}
                                    <div className="w-full md:w-1/2 h-1/2 md:h-full relative bg-gray-100">
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
                                    <div className="w-full md:w-1/2 h-1/2 md:h-full p-8 flex items-center justify-center bg-cream-50">
                                        <div className="text-center">
                                            <p className="font-serif text-xl md:text-2xl text-charcoal-800 leading-relaxed">
                                                {pages[currentPage - 1]?.text || "..."}
                                            </p>
                                            <span className="block mt-8 text-sm text-charcoal-400 font-bold">
                                                - {currentPage} -
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Center Spine Effect */}
                            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
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

                        {/* Right Control */}
                        <button
                            onClick={handleNext}
                            disabled={currentPage === pages.length}
                            className="p-3 bg-white/80 rounded-full shadow-lg disabled:opacity-30 hover:bg-white hover:scale-110 transition-all z-10"
                        >
                            <ChevronRight className="w-6 h-6 text-indigo-900" />
                        </button>
                    </div>
                </AnimatePresence>
            </div>

            {/* Page Indicators */}
            <div className="mt-8 flex gap-2">
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

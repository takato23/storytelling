"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lightbulb, Volume2 } from "lucide-react"

// Word of the Day Widget
export function WordOfTheDay() {
    const [isFlipped, setIsFlipped] = useState(false)

    // Mock data - would come from API/Context
    const word = {
        term: "Serendipia",
        pronunciation: "/se.ren.di.pia/",
        type: "Sustantivo fem.",
        definition: "Hallazgo afortunado y valioso que se produce de manera accidental o casual.",
        example: "Encontrar este libro mágico fue una hermosa serendipia."
    }

    return (
        <div className="perspective-1000 w-full max-w-sm">
            <motion.div
                className="relative w-full aspect-[4/3] cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: "spring" }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl shadow-lg border-4 border-white p-6 flex flex-col items-center justify-center text-center">
                    <div className="bg-white p-3 rounded-full shadow-md mb-4">
                        <Lightbulb className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                    </div>
                    <span className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">Palabra del Día</span>
                    <h3 className="text-3xl font-serif font-bold text-charcoal-900 mb-1">{word.term}</h3>
                    <p className="text-charcoal-500 font-mono text-sm">{word.pronunciation}</p>
                    <p className="mt-4 text-xs text-charcoal-400 font-medium">Toca para descubrir</p>
                </div>

                {/* Back */}
                <div
                    className="absolute inset-0 backface-hidden bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-center border-4 border-yellow-200"
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-charcoal-900">{word.term}</h3>
                        <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">{word.type}</span>
                    </div>
                    <p className="text-charcoal-700 text-sm leading-relaxed mb-4">
                        {word.definition}
                    </p>
                    <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                        <p className="text-xs text-charcoal-600 italic">"{word.example}"</p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

// Vocabulary Highlight Component (Inline text tooltips)
interface VocabularyHighlightProps {
    word: string
    definition: string
    children: React.ReactNode
}

export function VocabularyHighlight({ word, definition, children }: VocabularyHighlightProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <span className="relative inline-block">
            <span
                className="cursor-help border-b-2 border-dotted border-purple-400 text-purple-700 font-medium hover:bg-purple-50 transition-colors"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                onClick={() => setIsOpen(!isOpen)}
            >
                {children}
            </span>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-charcoal-900 text-white text-xs p-3 rounded-xl shadow-xl z-50"
                    >
                        <div className="font-bold text-yellow-400 mb-1">{word}</div>
                        <div className="leading-snug opacity-90">{definition}</div>

                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-charcoal-900" />
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    )
}

"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Globe, Check, Loader2 } from "lucide-react"
import { useLanguage, LANGUAGES, Language } from "./LanguageContext"

export function LanguageSelector({ variant = "default" }: { variant?: "default" | "minimal" | "pill" }) {
    const { language, setLanguage, isTranslating } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const currentLang = LANGUAGES.find(l => l.id === language)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSelect = (lang: Language) => {
        setLanguage(lang)
        setIsOpen(false)
    }

    if (variant === "pill") {
        return (
            <div className="relative" ref={containerRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/50 hover:bg-white backdrop-blur-sm border border-charcoal-200 rounded-full text-sm font-medium transition-all text-charcoal-700"
                >
                    {isTranslating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-coral-500" />
                    ) : (
                        <span className="text-lg leading-none">{currentLang?.flag}</span>
                    )}
                    <span className="hidden sm:inline">{currentLang?.name}</span>
                </button>
                {/* Dropdown implementation below */}
                <Dropdown isOpen={isOpen} currentLang={language} onSelect={handleSelect} />
            </div>
        )
    }

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full transition-all relative group border ${isOpen
                    ? "bg-coral-50/50 border-coral-200 text-coral-500 shadow-sm"
                    : "border-transparent hover:bg-white/50 hover:border-charcoal-100 text-charcoal-500"}`}
            >
                {isTranslating ? (
                    <Loader2 className="w-5 h-5 animate-spin text-coral-500" />
                ) : (
                    <Globe className="w-5 h-5" />
                )}

                {variant !== "minimal" && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-coral-400 rounded-full border-2 border-white scale-0 group-hover:scale-100 transition-transform origin-bottom-left" />
                )}
            </button>

            <Dropdown isOpen={isOpen} currentLang={language} onSelect={handleSelect} />
        </div>
    )
}

function Dropdown({
    isOpen,
    currentLang,
    onSelect
}: {
    isOpen: boolean
    currentLang: Language
    onSelect: (lang: Language) => void
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-charcoal-100 py-2 z-50 overflow-hidden"
                >
                    <div className="px-3 py-2 border-b border-charcoal-50 mb-1">
                        <p className="text-xs font-bold text-charcoal-400 uppercase tracking-wider">Selecciona Idioma</p>
                    </div>
                    {LANGUAGES.map((lang) => (
                        <button
                            key={lang.id}
                            onClick={() => onSelect(lang.id)}
                            className="w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-coral-50 transition-colors group"
                        >
                            <span className="flex items-center gap-3">
                                <span className="text-xl leading-none">{lang.flag}</span>
                                <span className={`text-sm font-medium ${lang.id === currentLang ? "text-coral-600" : "text-charcoal-700 group-hover:text-charcoal-900"}`}>
                                    {lang.name}
                                </span>
                            </span>
                            {lang.id === currentLang && (
                                <motion.div layoutId="check">
                                    <Check className="w-4 h-4 text-coral-500" />
                                </motion.div>
                            )}
                        </button>
                    ))}

                    <div className="mt-1 px-3 py-2 bg-purple-50 border-t border-purple-100">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-purple-600 font-medium">✨ Traducción por IA</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

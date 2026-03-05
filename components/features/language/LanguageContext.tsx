"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

export type Language = "es" | "en" | "fr" | "de" | "it" | "pt"

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string, defaultText: string) => string
    isTranslating: boolean
    simulateTranslation: () => Promise<void>
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LANGUAGES: { id: Language; name: string; flag: string }[] = [
    { id: "es", name: "Español", flag: "🇪🇸" },
    { id: "en", name: "English", flag: "🇺🇸" },
    { id: "fr", name: "Français", flag: "🇫🇷" },
    { id: "de", name: "Deutsch", flag: "🇩🇪" },
    { id: "it", name: "Italiano", flag: "🇮🇹" },
    { id: "pt", name: "Português", flag: "🇧🇷" },
]

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>("es")
    const [isTranslating, setIsTranslating] = useState(false)

    // Simulate translation effect
    const simulateTranslation = async () => {
        setIsTranslating(true)
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000))
        setIsTranslating(false)
    }

    // A very basic translation function dummy
    // In a real app, this would use a library like i18next or next-intl
    const t = (key: string, defaultText: string) => {
        return defaultText
    }

    const handleSetLanguage = async (lang: Language) => {
        if (lang === language) return
        await simulateTranslation()
        setLanguage(lang)
    }

    return (
        <LanguageContext.Provider value={{
            language,
            setLanguage: handleSetLanguage,
            t,
            isTranslating,
            simulateTranslation
        }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider")
    }
    return context
}

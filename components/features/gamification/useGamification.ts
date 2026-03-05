"use client"

import { useState, useEffect } from 'react'

export interface Sticker {
    id: string
    name: string
    emoji: string
    unlocked: boolean
    description: string
    color: string
}

export const INITIAL_STICKERS: Sticker[] = [
    { id: "1", name: "Primer Cuento", emoji: "🐣", unlocked: true, description: "Leíste tu primera historia", color: "bg-yellow-100" },
    { id: "2", name: "Búho Nocturno", emoji: "🦉", unlocked: false, description: "Leíste 3 noches seguidas", color: "bg-indigo-100" },
    { id: "3", name: "Explorador", emoji: "🧭", unlocked: false, description: "Lee cuentos de 3 categorías", color: "bg-green-100" },
    { id: "4", name: "Ratón de Biblio", emoji: "📚", unlocked: false, description: "Completa 10 historias", color: "bg-red-100" },
    { id: "5", name: "Super Lector", emoji: "🦸", unlocked: false, description: "Racha de 7 días", color: "bg-blue-100" },
    { id: "6", name: "Mágico", emoji: "✨", unlocked: false, description: "Crea tu primer cuento con IA", color: "bg-purple-100" },
]

export function useGamification() {
    const [stickers, setStickers] = useState<Sticker[]>(INITIAL_STICKERS)
    const [streakDays, setStreakDays] = useState(0)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from localStorage
    useEffect(() => {
        const savedStickers = localStorage.getItem('gamification-stickers')
        const savedStreak = localStorage.getItem('gamification-streak')

        if (savedStickers) {
            try {
                // Merge saved unlock status with initial sticker definitions (in case definitions change)
                const parsedSaved = JSON.parse(savedStickers)
                const mergedStickers = INITIAL_STICKERS.map(initial => {
                    const saved = parsedSaved.find((s: Sticker) => s.id === initial.id)
                    return saved ? { ...initial, unlocked: saved.unlocked } : initial
                })
                setStickers(mergedStickers)
            } catch (e) {
                console.error("Error parsing stickers", e)
            }
        }

        if (savedStreak) {
            setStreakDays(parseInt(savedStreak))
        }

        setIsLoaded(true)
    }, [])

    // Save to localStorage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('gamification-stickers', JSON.stringify(stickers))
            localStorage.setItem('gamification-streak', streakDays.toString())
        }
    }, [stickers, streakDays, isLoaded])

    const unlockSticker = (id: string) => {
        setStickers(prev => prev.map(s =>
            s.id === id && !s.unlocked ? { ...s, unlocked: true } : s
        ))
    }

    const incrementStreak = () => {
        setStreakDays(prev => prev + 1)
    }

    return {
        stickers,
        streakDays,
        unlockSticker,
        incrementStreak
    }
}

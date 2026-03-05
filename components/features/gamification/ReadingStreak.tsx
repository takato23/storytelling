"use client"

import React from "react"
import { motion } from "framer-motion"
import { Flame } from "lucide-react"

import { useGamification } from "./useGamification"

export function ReadingStreak({ days = 3 }: { days?: number }) {
    const { streakDays, incrementStreak } = useGamification()
    // Use prop as initial/fallback if 0, or just use hook state. 
    // Let's prioritize hook state but if 0 maybe show prop (or just hook).
    // For now, let's use the hook state purely.

    return (
        <div
            onClick={incrementStreak} // Demo interaction
            className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-full border border-orange-100 cursor-pointer hover:bg-orange-100 transition-colors"
            title="Racha de lectura (Click para Demo)"
        >
            <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            </motion.div>
            <span className="font-bold text-orange-700 text-sm">{streakDays > 0 ? streakDays : days} días</span>
        </div>
    )
}

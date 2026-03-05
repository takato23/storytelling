"use client"

import React from "react"
import { motion } from "framer-motion"
import { Sparkles, BookOpen, GraduationCap } from "lucide-react"

export type ReadingLevel = 'basic' | 'intermediate' | 'advanced'

interface ReadingLevelSelectorProps {
    selectedLevel: ReadingLevel
    onSelect: (level: ReadingLevel) => void
}

const LEVELS = [
    {
        id: 'basic',
        title: 'Explorador (Básico)',
        icon: Sparkles,
        description: 'Frases cortas, vocabulario sencillo y mucha repetición. Ideal para primeros lectores.',
        color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        activeColor: 'bg-emerald-100/90 border-emerald-500 ring-emerald-500',
        badge: '3-5 años'
    },
    {
        id: 'intermediate',
        title: 'Aventurero (Intermedio)',
        icon: BookOpen,
        description: 'Oraciones más complejas y vocabulario variado. Para niños que ya leen solos.',
        color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        activeColor: 'bg-indigo-100/90 border-indigo-500 ring-indigo-500',
        badge: '6-8 años'
    },
    {
        id: 'advanced',
        title: 'Maestro (Avanzado)',
        icon: GraduationCap,
        description: 'Narrativa rica, metáforas y vocabulario desafiante. Para lectores ávidos.',
        color: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700',
        activeColor: 'bg-fuchsia-100/90 border-fuchsia-500 ring-fuchsia-500',
        badge: '+9 años'
    }
]

export function ReadingLevelSelector({ selectedLevel, onSelect }: ReadingLevelSelectorProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold text-charcoal-900 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-700" />
                Nivel de Lectura
            </h3>

            <div className="grid md:grid-cols-3 gap-4">
                {LEVELS.map((level) => (
                    <motion.button
                        key={level.id}
                        onClick={() => onSelect(level.id as ReadingLevel)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                            relative p-5 rounded-2xl border-2 text-left transition-all
                            ${selectedLevel === level.id
                                ? `${level.activeColor} shadow-[0_16px_30px_-22px_rgba(79,70,229,0.7)]`
                                : "bg-white/75 border-white/80 hover:border-indigo-200 hover:bg-white"}
                        `}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className={`p-2 rounded-lg ${level.color} bg-opacity-20`}>
                                <level.icon className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/90 border border-white shadow-sm text-charcoal-600">
                                {level.badge}
                            </span>
                        </div>

                        <h4 className="font-bold text-charcoal-900 mb-2">{level.title}</h4>
                        <p className="text-sm text-charcoal-600 leading-relaxed">
                            {level.description}
                        </p>
                    </motion.button>
                ))}
            </div>
        </div>
    )
}

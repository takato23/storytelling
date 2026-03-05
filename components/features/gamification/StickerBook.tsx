"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Lock, Trophy, X, BookOpen, Shield, Compass, Zap, Moon, Sparkles } from "lucide-react"

import { useGamification } from "./useGamification"

const STICKER_ICONS: Record<string, any> = {
    "1": BookOpen,
    "2": Moon,
    "3": Compass,
    "4": Star,
    "5": Shield,
    "6": Sparkles,
}

export function StickerBook() {
    const [isOpen, setIsOpen] = useState(false)
    const { stickers, unlockSticker } = useGamification()

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-full border border-yellow-200 hover:bg-yellow-100 transition-colors"
                title="Mis Logros"
            >
                <Trophy className="w-4 h-4 text-yellow-600" />
                <span className="font-bold text-yellow-700 text-sm hidden sm:inline">Nivel 2</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-6 bg-gradient-to-r from-yellow-400 to-orange-400 text-white flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <Star className="w-6 h-6 fill-current" />
                                        Álbum de Logros
                                    </h2>
                                    <p className="text-yellow-50 text-sm opacity-90">¡Sigue leyendo para coleccionarlos todos!</p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {stickers.map((sticker) => {
                                        const Icon = STICKER_ICONS[sticker.id] || Star
                                        return (
                                            <motion.div
                                                key={sticker.id}
                                                whileHover={{ scale: 1.05 }}
                                                onClick={() => !sticker.unlocked && unlockSticker(sticker.id)} // Demo: click to unlock
                                                className={`
                                                    relative aspect-square rounded-2xl flex flex-col items-center justify-center p-4 text-center border-2 border-dashed cursor-pointer
                                                    ${sticker.unlocked
                                                        ? `border-transparent ${sticker.color} shadow-sm`
                                                        : "border-charcoal-200 bg-charcoal-50 opacity-70 hover:opacity-100 transition-opacity"
                                                    }
                                                `}
                                            >
                                                {sticker.unlocked ? (
                                                    <>
                                                        <div className="mb-2 p-2 bg-white/50 rounded-full">
                                                            <Icon className={`w-8 h-8 ${sticker.id === '6' ? 'text-purple-500' : 'text-charcoal-700'}`} />
                                                        </div>
                                                        <span className="font-bold text-charcoal-800 text-sm leading-tight">{sticker.name}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Lock className="w-8 h-8 text-charcoal-300 mb-2" />
                                                        <span className="font-medium text-charcoal-400 text-xs">{sticker.name}</span>
                                                    </>
                                                )}
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-charcoal-100 bg-charcoal-50 text-center text-xs text-charcoal-500 shrink-0">
                                Sigue leyendo para desbloquear más sorpresas
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    )
}

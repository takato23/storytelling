"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { TypewriterText } from "@/components/ui/TypewriterText"
import confetti from "canvas-confetti"

interface LetterProps {
    sender: string
    senderIcon: string
    subject: string
    content: string
    date: string
    themeColor: string
    isNew?: boolean
}

export function CharacterLetter({ sender, senderIcon, subject, content, date, themeColor, isNew = false }: LetterProps) {
    const [isOpen, setIsOpen] = useState(false)
    const { playClick, playMagic } = useSound() // Assuming standard sound hook context is available or will handle gracefully if not

    const handleOpen = () => {
        setIsOpen(true)
        // playMagic() // Optional sound
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FF69B4', '#00BFFF']
        })
    }

    // Dynamic styles based on theme
    const getThemeStyles = () => {
        switch (themeColor) {
            case 'indigo': return 'from-indigo-50 to-indigo-100 border-indigo-200'
            case 'emerald': return 'from-emerald-50 to-emerald-100 border-emerald-200'
            case 'rose': return 'from-rose-50 to-rose-100 border-rose-200'
            default: return 'from-cream-50 to-cream-100 border-cream-200'
        }
    }

    return (
        <>
            {/* Sealed Envelope (Card View) */}
            <motion.div
                onClick={handleOpen}
                whileHover={{ scale: 1.03, rotate: -1, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="relative cursor-pointer group"
            >
                {/* Envelope Body */}
                <div className={`
                    relative aspect-[16/10] bg-gradient-to-br ${getThemeStyles()}
                    rounded-3xl shadow-lg shadow-indigo-900/5 
                    border-2 overflow-hidden
                    flex flex-col items-center justify-center text-center p-6
                    transition-all duration-300
                    group-hover:shadow-2xl group-hover:shadow-indigo-500/10
                `}>
                    {/* Decorative pattern/texture overlay */}
                    <div className="absolute inset-0 opacity-30 mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat opacity-[0.03]" />

                    {/* Animated Stamp/Icon */}
                    <motion.div
                        className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg mb-3 text-4xl border-2 border-white/80"
                        whileHover={{ rotate: 12, scale: 1.1 }}
                        animate={{ rotate: [0, 3, -3, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        {senderIcon}
                    </motion.div>

                    {/* Decorative corner accents */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-200/30 to-transparent rounded-bl-[50px]" />
                    <div className="absolute bottom-0 left-0 w-12 h-12 bg-gradient-to-tr from-purple-200/20 to-transparent rounded-tr-[40px]" />

                    <h3 className="font-bold text-charcoal-900 text-lg mb-1 leading-tight">{sender}</h3>
                    <p className="text-xs text-charcoal-500 uppercase tracking-widest mb-1 font-bold opacity-60">Asunto:</p>
                    <p className="text-sm text-charcoal-600 line-clamp-1 font-medium italic">"{subject}"</p>

                    {/* Wax Seal */}
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        className={`
                            absolute bottom-4 right-4 w-10 h-10 rounded-full 
                            bg-gradient-to-br from-red-600 to-red-800 shadow-md border-2 border-red-400/30 
                            flex items-center justify-center text-white text-[10px] font-serif font-black tracking-widest
                        `}
                    >
                        SM
                    </motion.div>
                </div>

                {isNew && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full shadow-lg border border-white/20"
                    >
                        Nuevo
                    </motion.div>
                )}
            </motion.div>

            {/* Opened Letter (Modal) */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-md"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 100, rotateX: 20 }}
                            animate={{ scale: 1, y: 0, rotateX: 0 }}
                            exit={{ scale: 0.8, y: 100, rotateX: -20, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#fffdf7] max-w-lg w-full rounded-[3px] shadow-2xl relative overflow-hidden"
                            style={{
                                boxShadow: "0 0 0 1px #e5e5e5, 0 20px 50px -10px rgba(0,0,0,0.3)"
                            }}
                        >
                            {/* Realistic Paper Texture Look */}
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-50 mix-blend-multiply" />

                            {/* Content Wrapper */}
                            <div className="relative p-8 md:p-12 flex flex-col items-center">
                                {/* Close Button */}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 text-charcoal-400 hover:text-charcoal-800 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <motion.div
                                    className="text-6xl mb-4 inline-block"
                                    animate={{ rotate: [-5, 5, -5], y: [0, -5, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    {senderIcon}
                                </motion.div>

                                <h2 className="text-2xl md:text-3xl font-bold font-serif text-charcoal-900 mb-2 text-center">{subject}</h2>
                                <p className="text-charcoal-400 text-xs uppercase tracking-[0.2em] mb-4">📅 {date}</p>

                                {/* Decorative divider */}
                                <div className="flex items-center justify-center gap-4 mb-8 w-full">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-charcoal-200" />
                                    <span className="text-charcoal-300">✦</span>
                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-charcoal-200" />
                                </div>

                                <div className="font-serif text-lg text-charcoal-800 leading-relaxed space-y-4 text-justify opacity-90 min-h-[200px]">
                                    <TypewriterText text={content} speed={0.01} delay={0.5} />
                                </div>

                                <div className="mt-8 flex items-center justify-between border-t border-charcoal-100 pt-6">
                                    <motion.button
                                        whileHover={{ scale: 1.05, x: 5 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="text-sm font-bold text-charcoal-400 hover:text-purple-600 transition-colors flex items-center gap-2 px-4 py-2 rounded-full hover:bg-purple-50"
                                    >
                                        <span className="text-lg">↩️</span> Responder
                                    </motion.button>

                                    <div className="text-right font-serif">
                                        <p className="text-charcoal-600 text-sm">Con cariño mágico,</p>
                                        <p className="font-handwriting text-2xl text-charcoal-900 rotate-2 transform origin-bottom-right mt-1">
                                            - {sender}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative edges */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-black/5 to-transparent" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
// Stub for usage if context fails
function useSound() { return { playClick: () => { }, playMagic: () => { } } }

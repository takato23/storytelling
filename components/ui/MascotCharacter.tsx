"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { X, Sparkles, HelpCircle, ChevronRight, MessageSquareText } from "lucide-react"
import { usePathname } from "next/navigation"

const TIPS = [
    { text: "¡Hola! Soy Magi, tu asistente mágico ✨", category: "greeting" },
    { text: "¡Sube una foto clara del rostro de tu pequeño! 📸", category: "tip" },
    { text: "Tenemos aventuras de dinosaurios, princesas, espacio... 🚀", category: "tip" },
    { text: "Tu libro estará listo en minutos ⚡", category: "info" },
    { text: "¡Cada cuento es 100% único y especial! 🌟", category: "tip" },
    { text: "Puedes elegir libro digital, PDF o impreso tapa dura 📖", category: "info" },
    { text: "¿Sabías que puedes elegir las enseñanzas de la historia? 🎭", category: "tip" },
    { text: "¡15% OFF en tu primer libro impreso! 🚚", category: "promo" },
]

const QUICK_ACTIONS = [
    { label: "Probar Magia IA", href: "/crear", icon: "✨", color: "from-purple-500 to-indigo-500" },
    { label: "Ver Catálogo", href: "#catalogo", icon: "📚", color: "from-teal-400 to-emerald-500" },
    { label: "Preguntas (FAQ)", href: "#faq", icon: "❓", color: "from-amber-400 to-orange-500" },
]

interface MascotCharacterProps {
    className?: string
    showTips?: boolean
}

export function MascotCharacter({ className = "", showTips = true }: MascotCharacterProps) {
    const [currentTipIndex, setCurrentTipIndex] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const [showBubble, setShowBubble] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const pathname = usePathname()

    // Shuffle tips on mount so it's not always the same sequence
    const [activeTips, setActiveTips] = useState(TIPS)

    useEffect(() => {
        const shuffled = [...TIPS].sort(() => 0.5 - Math.random())
        setActiveTips(shuffled)

        // Delay initial appearance
        const showTimer = setTimeout(() => setIsVisible(true), 1500)
        return () => clearTimeout(showTimer)
    }, [])

    useEffect(() => {
        if (!showTips || !isVisible || isMinimized || isExpanded) return

        // Initial friendly pop after mounting
        const showBubbleTimer = setTimeout(() => setShowBubble(true), 3000)

        // Rotate tips every 12 seconds
        const tipInterval = setInterval(() => {
            setShowBubble(false)
            setTimeout(() => {
                setCurrentTipIndex((prev) => (prev + 1) % activeTips.length)
                setShowBubble(true)
            }, 600) // wait for exit animation
        }, 12000)

        return () => {
            clearTimeout(showBubbleTimer)
            clearInterval(tipInterval)
        }
    }, [showTips, isVisible, isExpanded, isMinimized, activeTips.length])

    // Hide mascot in creation flow
    if (pathname === '/crear') return null

    const handleMascotClick = useCallback(() => {
        if (isMinimized) {
            setIsMinimized(false)
            setShowBubble(true)
        } else {
            setIsExpanded(!isExpanded)
            if (!isExpanded) setShowBubble(false)
        }
    }, [isMinimized, isExpanded])

    const handleMinimize = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        setIsMinimized(true)
        setShowBubble(false)
        setIsExpanded(false)
    }, [])

    if (!isVisible) return null

    const currentTip = activeTips[currentTipIndex]

    return (
        <div className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 flex flex-col items-end ${className}`}>

            {/* Expanded Premium Panel */}
            <AnimatePresence>
                {isExpanded && !isMinimized && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30, transformOrigin: "bottom right" }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="mb-6 w-[320px] md:w-[360px]"
                    >
                        {/* Liquid Glass Container */}
                        <div className="relative rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] bg-white/70 backdrop-blur-2xl border border-white/60 overflow-hidden ring-1 ring-black/5">

                            {/* Animated Background Gradients inside the panel */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                            {/* Header */}
                            <div className="relative px-6 py-5 flex items-center justify-between border-b border-white/40">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px] shadow-sm">
                                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-lg">
                                            🦉
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-charcoal-900 leading-none">Magi</h3>
                                        <p className="text-xs font-medium text-charcoal-500 mt-1 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            En línea y listo
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleMinimize}
                                    className="w-8 h-8 rounded-full bg-charcoal-50/50 hover:bg-charcoal-100 flex items-center justify-center transition-colors text-charcoal-400 hover:text-charcoal-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Magic Tip Bubble Area */}
                            <div className="relative p-6">
                                <motion.div
                                    className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={currentTipIndex}
                                >
                                    <Sparkles className="absolute -top-3 -right-3 w-6 h-6 text-amber-400 animate-pulse" />
                                    <p className="text-sm font-medium text-charcoal-800 leading-relaxed">
                                        "{currentTip.text}"
                                    </p>
                                </motion.div>
                            </div>

                            {/* Quick Actions */}
                            <div className="px-6 pb-6 space-y-3 relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-charcoal-400 mb-2 pl-2">
                                    Sugerencias
                                </p>
                                {QUICK_ACTIONS.map((action, i) => (
                                    <motion.a
                                        key={action.label}
                                        href={action.href}
                                        className="relative flex items-center justify-between p-4 rounded-2xl bg-white/50 hover:bg-white border border-white/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 group overflow-hidden"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-inner`}>
                                                <span className="text-sm">{action.icon}</span>
                                            </div>
                                            <span className="text-sm font-bold text-charcoal-800">{action.label}</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-charcoal-50 flex items-center justify-center group-hover:bg-purple-50 group-hover:scale-110 transition-all">
                                            <ChevronRight className="w-4 h-4 text-charcoal-400 group-hover:text-purple-600 transition-colors" />
                                        </div>
                                    </motion.a>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Soft Speech Bubble */}
            <AnimatePresence>
                {showBubble && showTips && !isExpanded && !isMinimized && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 15, transformOrigin: "bottom right" }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="mb-4 mr-4 w-[280px]"
                    >
                        <div className="relative bg-white/90 backdrop-blur-xl rounded-[1.5rem] rounded-br-sm shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] p-5 border border-white/80 ring-1 ring-black/5 cursor-pointer group hover:bg-white transition-colors"
                            onClick={() => setIsExpanded(true)}
                        >
                            <p className="text-sm font-medium text-charcoal-800 leading-relaxed pr-6">
                                {currentTip.text}
                            </p>

                            {/* Animated glowing tail */}
                            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white/90 backdrop-blur-xl border-r border-b border-white/80 transform rotate-45 group-hover:bg-white transition-colors" />

                            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-600">
                                <MessageSquareText className="w-3.5 h-3.5" />
                                <span>Ver sugerencias</span>
                            </div>

                            {/* Tiny close button for the bubble */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowBubble(false)
                                }}
                                className="absolute top-3 right-3 w-6 h-6 rounded-full bg-charcoal-50 hover:bg-charcoal-100 flex items-center justify-center text-charcoal-400 transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Interactive Avatar (Magi) */}
            <motion.div
                initial={{ scale: 0, rotate: 180, y: 50, opacity: 0 }}
                animate={{
                    scale: isMinimized ? 0.75 : 1,
                    rotate: 0,
                    y: 0,
                    opacity: 1
                }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="relative cursor-pointer group z-10"
                onClick={handleMascotClick}
                whileHover={{ scale: isMinimized ? 0.85 : 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {/* Premium Animated Glow Aura */}
                <div className={`absolute inset-0 rounded-full transition-all duration-700 pointer-events-none 
                    ${isExpanded
                        ? 'bg-purple-400/30 scale-125 blur-2xl animate-pulse'
                        : isMinimized
                            ? 'bg-purple-300/10 scale-100 blur-xl'
                            : 'bg-purple-400/20 scale-[1.15] blur-xl group-hover:scale-125 group-hover:bg-purple-400/30'
                    }`} />

                {/* Subtle Breathing Animation for idle state */}
                {!isExpanded && !showBubble && !isMinimized && (
                    <motion.div
                        className="absolute inset-0 rounded-full bg-white/20 blur-md pointer-events-none"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                )}

                {/* Magical rotating sparkles ring for idle state */}
                {!isExpanded && !isMinimized && (
                    <motion.div
                        className="absolute inset-[-15%] rounded-full border-[1.5px] border-purple-300/20 border-dashed pointer-events-none"
                        animate={{ rotate: 360, scale: [0.95, 1.05, 0.95] }}
                        transition={{
                            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                            scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                        }}
                    >
                        <Sparkles className="absolute top-0 right-4 w-3.5 h-3.5 text-purple-400/60" />
                        <Sparkles className="absolute bottom-2 left-2 w-4.5 h-4.5 text-pink-400/60" />
                    </motion.div>
                )}

                {/* Notification dot when minimized/unread */}
                {isMinimized && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-0 right-0 w-5 h-5 bg-gradient-to-tr from-rose-500 to-pink-500 rounded-full border-[3px] border-white shadow-lg z-20 flex items-center justify-center"
                    >
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    </motion.div>
                )}

                {/* Character Image Container with Continuous Floating */}
                <motion.div
                    animate={
                        !isExpanded && !isMinimized
                            ? { y: [0, -8, 0] }
                            : { y: 0 }
                    }
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                    className={`relative transition-colors duration-500 ease-out z-10 
                    ${isMinimized ? 'w-16 h-16' : 'w-24 h-24 md:w-28 md:h-28'}
                    drop-shadow-[0_10px_15px_rgba(0,0,0,0.15)] group-hover:drop-shadow-[0_15px_25px_rgba(168,85,247,0.4)]
                `}>
                    <div className="absolute inset-0 rounded-full shadow-inner border-[1.5px] border-white/60 overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
                        <Image
                            src="/images/magi_avatar.png"
                            alt="Magi Assistant"
                            fill
                            className="object-cover scale-[1.3] translate-y-1 group-hover:scale-[1.35] transition-transform duration-500 ease-out"
                            sizes="(max-width: 768px) 64px, 112px"
                        />
                        {/* Inner glass highlight */}
                        <div className="absolute inset-0 rounded-full shadow-[inset_0_4px_10px_rgba(255,255,255,0.8)] pointer-events-none" />
                    </div>
                </motion.div>

                {/* Name Tag (Only when fully visible) */}
                <AnimatePresence>
                    {!isMinimized && !isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-20 pointer-events-none"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.1)] border border-purple-100 ring-1 ring-black/5 block">
                                Magi
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}

export default MascotCharacter

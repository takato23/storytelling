"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import { Sparkles, ArrowRight } from "lucide-react"
import { useSound } from "@/lib/contexts/SoundContext"

interface MagicalButtonProps {
    onClick: () => void
    text?: string
    icon?: React.ReactNode
    disabled?: boolean
    variant?: "primary" | "secondary"
    className?: string
    onHoldComplete?: () => void
    holdDuration?: number // ms
}

export function MagicalButton({
    onClick,
    text = "Continuar",
    icon,
    disabled = false,
    variant = "primary",
    className = "",
    onHoldComplete,
    holdDuration = 1500
}: MagicalButtonProps) {
    const [isHolding, setIsHolding] = useState(false)
    const [progress, setProgress] = useState(0)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const controls = useAnimation()

    // Audio Context (Mocked for now if not ready, but we should import it)
    const { playHover, playMagic, playClick } = useSound()

    const startHolding = () => {
        if (disabled) return
        setIsHolding(true)
        playHover() // Start a charging sound ideally

        let start = Date.now()
        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - start
            const newProgress = Math.min((elapsed / holdDuration) * 100, 100)
            setProgress(newProgress)

            if (newProgress >= 100) {
                completeHold()
            }
        }, 16)
    }

    const stopHolding = () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setIsHolding(false)
        setProgress(0)
    }

    // Flag to prevent double triggering if hold completes
    const [justCompletedHold, setJustCompletedHold] = useState(false)

    const completeHold = () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setIsHolding(false)
        setJustCompletedHold(true)
        playMagic()

        // Trigger completion animation, then callback
        controls.start({
            scale: [1, 1.2, 0],
            opacity: 0,
            transition: { duration: 0.3 }
        }).then(() => {
            if (onHoldComplete) onHoldComplete()
            else onClick()

            // Reset after a delay
            setTimeout(() => {
                controls.set({ scale: 1, opacity: 1 })
                setProgress(0)
                setJustCompletedHold(false)
            }, 1000)
        })
    }

    // Standard click handler fallback
    const handleClick = () => {
        if (disabled || justCompletedHold) return

        // If it was a quick tap (progress is low)
        playClick()
        onClick()
    }

    return (
        <motion.div
            className="relative inline-block rounded-full"
            onHoverStart={() => !disabled && playHover()}
        >
            <motion.button
                animate={controls}
                onMouseDown={onHoldComplete ? startHolding : undefined}
                onMouseUp={onHoldComplete ? stopHolding : undefined}
                onMouseLeave={onHoldComplete ? stopHolding : undefined}
                onTouchStart={onHoldComplete ? startHolding : undefined}
                onTouchEnd={onHoldComplete ? stopHolding : undefined}
                onClick={handleClick}
                disabled={disabled}
                className={`
                    relative overflow-hidden group
                    px-8 py-4 rounded-full font-bold text-lg
                    flex items-center justify-center gap-2
                    transition-all duration-300
                    ${className}
                    ${disabled ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer"}
                    ${variant === "primary"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02]"
                        : "bg-white text-indigo-900 border-2 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50"
                    }
                `}
                whileTap={!disabled ? { scale: 0.98 } : {}}
            >
                {/* Progress Fill Background */}
                {onHoldComplete && (
                    <div
                        className="absolute inset-0 bg-white/20 origin-left z-0"
                        style={{ width: `${progress}%`, transition: isHolding ? 'none' : 'width 0.2s' }}
                    />
                )}

                {/* Particles when holding */}
                {isHolding && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                                initial={{
                                    x: "50%",
                                    y: "50%",
                                    scale: 0,
                                    opacity: 0
                                }}
                                animate={{
                                    x: `${Math.random() * 100}%`,
                                    y: `${Math.random() * 100}%`,
                                    scale: [0, 1.5, 0],
                                    opacity: [0, 1, 0]
                                }}
                                transition={{
                                    duration: 0.5 + Math.random() * 0.5,
                                    repeat: Infinity,
                                    ease: "easeOut"
                                }}
                            />
                        ))}
                    </div>
                )}

                <span className="relative z-10 flex items-center gap-2">
                    {icon || <Sparkles className={`w-5 h-5 ${isHolding ? "animate-spin" : ""}`} />}
                    {text}
                    {variant === "primary" && (
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    )}
                </span>
            </motion.button>

            {/* Tooltip hint for "Hold" */}
            {onHoldComplete && !isHolding && !disabled && (
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] uppercase font-bold text-indigo-300 tracking-wider opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Mantén para lanzar hechizo
                </div>
            )}
        </motion.div>
    )
}

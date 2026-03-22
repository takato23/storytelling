"use client"

import React, { useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "@/lib/contexts/ThemeContext"

export function ThemeToggle() {
    const { resolvedTheme, toggleTheme, isTransitioning, mounted } = useTheme()
    const buttonRef = useRef<HTMLButtonElement>(null)

    const handleClick = () => {
        if (isTransitioning) return
        const rect = buttonRef.current?.getBoundingClientRect()
        toggleTheme(rect ?? undefined)
    }

    const isDark = resolvedTheme === "dark"

    // Avoid hydration mismatch by not rendering theme-dependent UI until mounted
    if (!mounted) {
        return <div className="theme-toggle-btn opacity-0" />
    }

    return (
        <button
            ref={buttonRef}
            onClick={handleClick}
            disabled={isTransitioning}
            aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="theme-toggle-btn"
        >
            <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                    <motion.div
                        key="moon"
                        initial={{ rotate: -90, scale: 0, opacity: 0 }}
                        animate={{ rotate: 0, scale: 1, opacity: 1 }}
                        exit={{ rotate: 90, scale: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        className="theme-toggle-icon"
                    >
                        {/* Moon SVG */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                        {/* Tiny stars */}
                        <motion.span
                            className="theme-toggle-star star-1"
                            animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.span
                            className="theme-toggle-star star-2"
                            animate={{ opacity: [1, 0.4, 1], scale: [1.1, 0.7, 1.1] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                        <motion.span
                            className="theme-toggle-star star-3"
                            animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.3, 0.9] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ rotate: 90, scale: 0, opacity: 0 }}
                        animate={{ rotate: 0, scale: 1, opacity: 1 }}
                        exit={{ rotate: -90, scale: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                        className="theme-toggle-icon"
                    >
                        {/* Sun SVG */}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" />
                            <line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                    </motion.div>
                )}
            </AnimatePresence>
        </button>
    )
}

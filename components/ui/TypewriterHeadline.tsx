"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface TypewriterHeadlineProps {
    prefix?: string
    words: string[]
    suffix?: string
    className?: string
    typingSpeed?: number
    deletingSpeed?: number
    pauseDuration?: number
}

export function TypewriterHeadline({
    prefix = "",
    words,
    suffix = "",
    className = "",
    typingSpeed = 100,
    deletingSpeed = 50,
    pauseDuration = 2000,
}: TypewriterHeadlineProps) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0)
    const [currentText, setCurrentText] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const currentWord = words[currentWordIndex]

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                // Typing
                if (currentText.length < currentWord.length) {
                    setCurrentText(currentWord.slice(0, currentText.length + 1))
                } else {
                    // Pause at end, then start deleting
                    setTimeout(() => setIsDeleting(true), pauseDuration)
                }
            } else {
                // Deleting
                if (currentText.length > 0) {
                    setCurrentText(currentText.slice(0, -1))
                } else {
                    // Move to next word
                    setIsDeleting(false)
                    setCurrentWordIndex((prev) => (prev + 1) % words.length)
                }
            }
        }, isDeleting ? deletingSpeed : typingSpeed)

        return () => clearTimeout(timeout)
    }, [currentText, isDeleting, currentWordIndex, words, typingSpeed, deletingSpeed, pauseDuration])

    return (
        <span className={className}>
            {prefix}
            <span className="relative">
                <span className="text-gradient-animated">{currentText}</span>
                <motion.span
                    className="inline-block w-[3px] h-[1em] bg-purple-500 ml-1 align-middle"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                />
            </span>
            {suffix}
        </span>
    )
}

export default TypewriterHeadline

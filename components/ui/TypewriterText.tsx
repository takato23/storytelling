"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"

interface TypewriterTextProps {
    text: string
    className?: string
    speed?: number
    delay?: number
}

export function TypewriterText({ text, className = "", speed = 0.02, delay = 0 }: TypewriterTextProps) {
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true, margin: "-20%" })

    const words = text.split(" ")

    // Text container variants
    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: speed, delayChildren: delay * i },
        }),
    }

    // Effect for each character could be too heavy for long text, so let's animate words or characters depending on length.
    // For letter body, words is safer for performance.
    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring" as const,
                damping: 12,
                stiffness: 100,
            },
        },
        hidden: {
            opacity: 0,
            y: 5, // slight slide up
        },
    }

    return (
        <motion.div
            ref={ref}
            style={{ display: "inline-block", overflow: "hidden", whiteSpace: "pre-wrap" }}
            variants={container}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className={className}
        >
            {words.map((word, index) => (
                <motion.span variants={child} key={index} className="inline-block mr-1">
                    {word}
                </motion.span>
            ))}
        </motion.div>
    )
}

"use client"

import React, { useEffect, useState, useMemo } from "react"
import { motion } from "framer-motion"

interface Bubble {
    id: number
    x: number
    size: number
    duration: number
    delay: number
    opacity: number
}

interface FloatingBubblesProps {
    count?: number
    className?: string
}

export function FloatingBubbles({ count = 20, className = "" }: FloatingBubblesProps) {
    const [bubbles, setBubbles] = useState<Bubble[]>([])

    // Generate bubbles only on client to avoid hydration mismatch
    useEffect(() => {
        const generated: Bubble[] = []
        for (let i = 0; i < count; i++) {
            generated.push({
                id: i,
                x: Math.random() * 100,
                size: 8 + Math.random() * 24,
                duration: 8 + Math.random() * 12,
                delay: Math.random() * 10,
                opacity: 0.1 + Math.random() * 0.3,
            })
        }
        setBubbles(generated)
    }, [count])

    if (bubbles.length === 0) return null

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
            {bubbles.map((bubble) => (
                <motion.div
                    key={bubble.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${bubble.x}%`,
                        bottom: -bubble.size,
                        width: bubble.size,
                        height: bubble.size,
                        background: `radial-gradient(circle at 30% 30%, 
              rgba(255, 255, 255, 0.8), 
              rgba(78, 205, 196, ${bubble.opacity}) 40%, 
              rgba(255, 107, 107, ${bubble.opacity * 0.5}) 100%)`,
                        boxShadow: `
              inset -2px -2px 4px rgba(0,0,0,0.1),
              inset 2px 2px 4px rgba(255,255,255,0.5),
              0 0 ${bubble.size / 2}px rgba(255, 107, 107, 0.2)
            `,
                    }}
                    animate={{
                        y: [0, -window?.innerHeight - 100 || -1000],
                        x: [0, Math.sin(bubble.id) * 50, 0],
                        scale: [1, 1.1, 0.9, 1],
                        rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                        duration: bubble.duration,
                        delay: bubble.delay,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            ))}
        </div>
    )
}

export default FloatingBubbles

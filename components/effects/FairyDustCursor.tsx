"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface Particle {
    id: number
    x: number
    y: number
    color: string
}

export function FairyDustCursor() {
    const [particles, setParticles] = useState<Particle[]>([])

    // Limit particle creation to improve performance
    useEffect(() => {
        let lastTime = 0
        const throttleDelay = 20 // ms

        const handleMouseMove = (e: MouseEvent) => {
            const now = Date.now()
            if (now - lastTime < throttleDelay) return
            lastTime = now

            const colors = ["#FFD700", "#FF69B4", "#00CED1", "#E0FFFF", "#FFFACD"] // Gold, Pink, Turquoise, LightCyan, LemonChiffon
            const newParticle = {
                id: Math.random(),
                x: e.clientX,
                y: e.clientY,
                color: colors[Math.floor(Math.random() * colors.length)]
            }

            setParticles(prev => [...prev, newParticle])

            // Cleanup particle after animation
            setTimeout(() => {
                setParticles(prev => prev.filter(p => p.id !== newParticle.id))
            }, 1000)
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [])

    return (
        <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
            <AnimatePresence>
                {particles.map(particle => (
                    <motion.div
                        key={particle.id}
                        initial={{
                            opacity: 1,
                            scale: Math.random() * 0.5 + 0.3, // Random size
                            x: particle.x,
                            y: particle.y
                        }}
                        animate={{
                            opacity: 0,
                            scale: 0,
                            y: particle.y + 30 + Math.random() * 20, // Fall down with gravity variance
                            x: particle.x + (Math.random() - 0.5) * 30 // Drift sideways
                        }}
                        transition={{
                            duration: 0.8,
                            ease: "easeOut"
                        }}
                        className="absolute w-3 h-3 rounded-full blur-[1px]"
                        style={{
                            backgroundColor: particle.color,
                            boxShadow: `0 0 6px ${particle.color}, 0 0 10px white`
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    )
}

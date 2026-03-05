"use client"

import { motion } from "framer-motion"
import { useSound } from "@/lib/contexts/SoundContext"
import { useEffect, useState } from "react"
import { Sparkles, Star, Zap, Camera, BookOpen, Palette } from "lucide-react"

export function AlchemistLoading() {
    const { playMagic } = useSound()
    const [phase, setPhase] = useState(0) // 0: Drop ingredients, 1: Swirl, 2: Explosion

    useEffect(() => {
        // Timeline of the ceremony
        setTimeout(() => setPhase(1), 1000)
        setTimeout(() => setPhase(2), 3500)
    }, [])

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] relative">
            {/* The Cauldron / Vortex Center */}
            <div className="relative w-64 h-64 flex items-center justify-center">

                {/* Spinning Vortex Rings */}
                <motion.div
                    className="absolute inset-0 border-4 border-indigo-500/30 rounded-full border-t-indigo-500"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute inset-4 border-4 border-purple-500/30 rounded-full border-b-purple-500"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />

                {/* Phase 0: Ingredients Falling In */}
                {phase === 0 && (
                    <>
                        <motion.div
                            className="absolute bg-white p-2 rounded-xl shadow-lg border border-indigo-100"
                            initial={{ x: -100, y: -100, opacity: 0, scale: 0 }}
                            animate={{ x: 0, y: 0, opacity: 1, scale: 0.5, rotate: 360 }}
                            transition={{ duration: 0.8, type: "spring" }}
                        >
                            <Camera className="w-8 h-8 text-indigo-600" />
                        </motion.div>
                        <motion.div
                            className="absolute bg-white p-2 rounded-xl shadow-lg border border-purple-100"
                            initial={{ x: 100, y: -100, opacity: 0, scale: 0 }}
                            animate={{ x: 0, y: 0, opacity: 1, scale: 0.5, rotate: -360 }}
                            transition={{ delay: 0.2, duration: 0.8, type: "spring" }}
                        >
                            <BookOpen className="w-8 h-8 text-purple-600" />
                        </motion.div>
                        <motion.div
                            className="absolute bg-white p-2 rounded-xl shadow-lg border border-pink-100"
                            initial={{ x: 0, y: 100, opacity: 0, scale: 0 }}
                            animate={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
                            transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
                        >
                            <Palette className="w-8 h-8 text-pink-500" />
                        </motion.div>
                    </>
                )}

                {/* Phase 1: Alchemy Reaction (Glowing Core) */}
                {phase >= 1 && (
                    <motion.div
                        className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-400 rounded-full shadow-[0_0_50px_rgba(99,102,241,0.6)] flex items-center justify-center z-10"
                        initial={{ scale: 0 }}
                        animate={phase === 2 ? { scale: [1, 1.5, 0], opacity: 0 } : { scale: [0.8, 1.2, 0.8] }}
                        transition={phase === 2 ? { duration: 0.5 } : { repeat: Infinity, duration: 1 }}
                    >
                        <Sparkles className="text-white w-10 h-10 animate-spin" />
                    </motion.div>
                )}

                {/* Phase 2: Magic Explosion Particles */}
                {phase === 2 && (
                    <>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                                initial={{ x: 0, y: 0, scale: 0 }}
                                animate={{
                                    x: (Math.random() - 0.5) * 300,
                                    y: (Math.random() - 0.5) * 300,
                                    scale: [0, 1.5, 0],
                                    opacity: [1, 0]
                                }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        ))}
                    </>
                )}
            </div>

            <motion.div
                className="mt-8 text-center space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {phase === 0 && "Reuniendo ingredientes..."}
                    {phase === 1 && "Mezclando magia..."}
                    {phase === 2 && "¡Casi listo!"}
                </h3>
                <p className="text-charcoal-500 text-sm">
                    {phase === 0 && "Detectando sonrisas"}
                    {phase === 1 && "Escribiendo tu aventura"}
                    {phase === 2 && "Aplicando polvos de hadas"}
                </p>
            </motion.div>
        </div>
    )
}

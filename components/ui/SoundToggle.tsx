"use client"

import React from "react"
import { motion } from "framer-motion"
import { Volume2, VolumeX } from "lucide-react"
import { useSound } from "@/lib/contexts/SoundContext"

export function SoundToggle() {
    const { isMuted, toggleMute } = useSound()

    return (
        <motion.button
            onClick={toggleMute}
            className={`p-2 rounded-full transition-all group relative ${isMuted ? "text-charcoal-400 hover:bg-charcoal-100" : "text-indigo-600 hover:bg-indigo-50"
                }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={isMuted ? "Activar sonido" : "Silenciar"}
        >
            {isMuted ? (
                <VolumeX className="w-5 h-5" />
            ) : (
                <div className="relative">
                    <Volume2 className="w-5 h-5" />
                    <motion.div
                        className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>
            )}
        </motion.button>
    )
}

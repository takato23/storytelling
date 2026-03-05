"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Music, Volume2, VolumeX } from "lucide-react"
import { useBedtime } from "./BedtimeContext"

export function SoothingPlayer() {
    const { isBedtimeEnabled } = useBedtime()
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // React to bedtime mode changes
    useEffect(() => {
        if (isBedtimeEnabled) {
            // Auto-play softly when entered (optional, maybe better requires user interaction first for browser policy)
            // For now, we just show the player. user must click play.
        } else {
            if (audioRef.current) {
                audioRef.current.pause()
                setIsPlaying(false)
            }
        }
    }, [isBedtimeEnabled])

    const togglePlay = () => {
        if (!audioRef.current) return

        if (isPlaying) {
            audioRef.current.pause()
        } else {
            // Audio files are currently placeholders (0 bytes) in this environment.
            // Disable playback to prevent 416 errors.
            console.log("Audio playback disabled: ambient.mp3 is empty.");
            return;
            // audioRef.current.play().catch(e => console.log("Audio play failed interaction needed", e))
        }
        setIsPlaying(!isPlaying)
    }

    const toggleMute = () => {
        if (!audioRef.current) return
        audioRef.current.muted = !isMuted
        setIsMuted(!isMuted)
    }

    if (!isBedtimeEnabled) return null

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-4 p-4 rounded-2xl bg-indigo-950/90 backdrop-blur-md border border-indigo-800 text-indigo-100 shadow-2xl"
        >
            <div className="flex flex-col">
                <span className="text-xs font-medium text-indigo-300 uppercase tracking-wider">Modo Sueño</span>
                <span className="text-sm font-bold">Música Relajante</span>
            </div>

            {/* <audio
                ref={audioRef}
                src="/sounds/ambient.mp3"
                loop
            /> */}
            {/* Placeholder audio element for when files are available */}
            <audio ref={audioRef} loop />

            <div className="flex items-center gap-2">
                <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-indigo-700 hover:bg-indigo-600 flex items-center justify-center transition-colors"
                >
                    {isPlaying ? (
                        <span className="w-3 h-3 bg-white rounded-sm" /> // Pause icon (square)
                    ) : (
                        <Music className="w-5 h-5" />
                    )}
                </button>

                <button onClick={toggleMute} className="p-2 text-indigo-400 hover:text-white transition-colors">
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            </div>
        </motion.div>
    )
}

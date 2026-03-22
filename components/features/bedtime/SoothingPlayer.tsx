"use client"

import React, { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
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
                requestAnimationFrame(() => setIsPlaying(false))
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
            className="fixed bottom-5 right-5 z-40 flex items-center gap-4 rounded-2xl border border-purple-200/70 bg-white/88 p-4 text-charcoal-800 shadow-[0_18px_40px_-24px_rgba(38,25,44,0.45)] backdrop-blur-md"
        >
            <div className="flex flex-col">
                <span className="text-xs font-medium uppercase tracking-wider text-purple-500">Modo Sueño</span>
                <span className="text-sm font-bold">Música relajante</span>
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
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-charcoal-900 text-white transition-colors hover:bg-purple-700"
                >
                    {isPlaying ? (
                        <span className="w-3 h-3 bg-white rounded-sm" /> // Pause icon (square)
                    ) : (
                        <Music className="w-5 h-5" />
                    )}
                </button>

                <button onClick={toggleMute} className="p-2 text-purple-400 transition-colors hover:text-charcoal-900">
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            </div>
        </motion.div>
    )
}

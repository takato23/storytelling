"use client"

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

interface SoundContextType {
    playClick: () => void
    playHover: () => void
    playMagic: () => void
    playSuccess: () => void
    toggleMute: () => void
    isMuted: boolean
}

const SoundContext = createContext<SoundContextType | undefined>(undefined)

export function SoundProvider({ children }: { children: React.ReactNode }) {
    const [isMuted, setIsMuted] = useState(false)
    const [audioAllowed, setAudioAllowed] = useState(false)
    const audioContextRef = useRef<AudioContext | null>(null)

    useEffect(() => {
        // Initialize AudioContext
        const initAudio = () => {
            if (!audioContextRef.current) {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
                audioContextRef.current = new AudioContextClass()
            }
            if (audioContextRef.current.state === 'suspended') {
                audioContextRef.current.resume()
            }
            setAudioAllowed(true)
        }

        const handleInteraction = () => {
            initAudio()
            window.removeEventListener('click', handleInteraction)
            window.removeEventListener('keydown', handleInteraction)
        }

        window.addEventListener('click', handleInteraction)
        window.addEventListener('keydown', handleInteraction)

        return () => {
            window.removeEventListener('click', handleInteraction)
            window.removeEventListener('keydown', handleInteraction)
            if (audioContextRef.current) {
                audioContextRef.current.close()
            }
        }
    }, [])

    const playTone = (freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
        if (isMuted || !audioContextRef.current) return

        const ctx = audioContextRef.current
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = type
        osc.frequency.setValueAtTime(freq, ctx.currentTime)

        gain.gain.setValueAtTime(vol, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start()
        osc.stop(ctx.currentTime + duration)
    }

    const playClick = () => {
        // Crisp high click
        playTone(800, 'sine', 0.1, 0.1)
    }

    const playHover = () => {
        // Very subtle pop
        playTone(400, 'sine', 0.05, 0.05)
    }

    const playMagic = () => {
        // Sparkle effect (multiple tones)
        if (isMuted || !audioContextRef.current) return
        const ctx = audioContextRef.current
        const now = ctx.currentTime

        const createSparkle = (offset: number, freq: number) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'sine'
            osc.frequency.setValueAtTime(freq, now + offset)
            gain.gain.setValueAtTime(0.1, now + offset)
            gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.3)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(now + offset)
            osc.stop(now + offset + 0.3)
        }

        createSparkle(0, 800)
        createSparkle(0.1, 1200)
        createSparkle(0.2, 1600)
    }

    const playSuccess = () => {
        // Major chord uplift
        if (isMuted || !audioContextRef.current) return
        const ctx = audioContextRef.current
        const now = ctx.currentTime

        const playNote = (freq: number, startTime: number) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'triangle'
            osc.frequency.setValueAtTime(freq, startTime)
            gain.gain.setValueAtTime(0.1, startTime)
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1.5)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(startTime)
            osc.stop(startTime + 1.5)
        }

        playNote(440, now) // A4
        playNote(554.37, now + 0.1) // C#5
        playNote(659.25, now + 0.2) // E5
    }

    const toggleMute = () => setIsMuted(prev => !prev)

    return (
        <SoundContext.Provider value={{ playClick, playHover, playMagic, playSuccess, toggleMute, isMuted }}>
            {children}
        </SoundContext.Provider>
    )
}

export const useSound = () => {
    const context = useContext(SoundContext)
    if (context === undefined) {
        throw new Error('useSound must be used within a SoundProvider')
    }
    return context
}

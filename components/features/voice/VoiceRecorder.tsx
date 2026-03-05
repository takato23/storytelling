"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Mic, Square, Play, RefreshCw, CheckCircle2 } from "lucide-react"

export function VoiceRecorder() {
    const [isRecording, setIsRecording] = useState(false)
    const [recordingComplete, setRecordingComplete] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)

    // Simulate recording timer
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isRecording])

    const startRecording = () => {
        setIsRecording(true)
        setRecordingComplete(false)
        setRecordingTime(0)
    }

    const stopRecording = () => {
        setIsRecording(false)
        setRecordingComplete(true)
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Fake visualizer bars
    const bars = Array.from({ length: 20 })

    return (
        <div className="bg-white rounded-3xl shadow-premium p-8 max-w-md mx-auto border border-charcoal-100">
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-purple-100">
                    <Mic className={`w-8 h-8 ${isRecording ? "text-red-500 animate-pulse" : "text-purple-600"}`} />
                </div>
                <h3 className="text-xl font-bold text-charcoal-900 mb-2">
                    {isRecording ? "Grabando tu voz..." : recordingComplete ? "¡Grabación lista!" : "Grabar muestra de voz"}
                </h3>
                <p className="text-sm text-charcoal-500">
                    {isRecording
                        ? "Lee el texto que aparece en pantalla"
                        : "Necesitamos 1 minuto de tu voz para clonarla mágicamente"}
                </p>
            </div>

            {/* Visualizer / Status */}
            <div className="h-24 bg-charcoal-50 rounded-2xl mb-8 flex items-center justify-center gap-1 overflow-hidden relative">
                {isRecording ? (
                    bars.map((_, i) => (
                        <motion.div
                            key={i}
                            className="w-1.5 bg-purple-500 rounded-full"
                            animate={{
                                height: [10, Math.random() * 60 + 10, 10]
                            }}
                            transition={{
                                duration: 0.5,
                                repeat: Infinity,
                                delay: i * 0.05
                            }}
                        />
                    ))
                ) : recordingComplete ? (
                    <div className="flex items-center gap-2 text-teal-600 font-medium">
                        <CheckCircle2 className="w-6 h-6" />
                        <span>Audio procesado correctamente</span>
                    </div>
                ) : (
                    <span className="text-charcoal-400 text-sm">Presiona el micrófono para comenzar</span>
                )}

                {isRecording && (
                    <div className="absolute top-2 right-3 text-xs font-mono font-bold text-red-500 flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        REC {formatTime(recordingTime)}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4">
                {!isRecording && !recordingComplete && (
                    <button
                        onClick={startRecording}
                        className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-105"
                    >
                        <Mic className="w-8 h-8" />
                    </button>
                )}

                {isRecording && (
                    <button
                        onClick={stopRecording}
                        className="w-16 h-16 bg-charcoal-900 hover:bg-black rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-105"
                    >
                        <Square className="w-6 h-6 fill-current" />
                    </button>
                )}

                {recordingComplete && (
                    <>
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="flex-1 py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                            {isPlaying ? "Detener" : "Escuchar"}
                        </button>
                        <button
                            onClick={() => setRecordingComplete(false)}
                            className="w-12 h-12 border-2 border-charcoal-200 rounded-xl flex items-center justify-center text-charcoal-500 hover:border-charcoal-400 hover:text-charcoal-700 transition-colors"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </>
                )}
            </div>

            {/* Sample Text Script */}
            {isRecording && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-center">
                    <p className="font-serif text-lg text-charcoal-800 leading-relaxed">
                        "Había una vez, en un bosque encantado muy lejano, un pequeño dragón que soñaba con tocar las estrellas..."
                    </p>
                </div>
            )}
        </div>
    )
}

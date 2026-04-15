"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { Sparkles, Camera, Palette, BookOpen, Bell } from "lucide-react"

const FUN_FACTS = [
    "Los dinosaurios más grandes podían medir hasta 40 metros de largo",
    "El T-Rex tenía los brazos más cortos que tus piernas",
    "Los dinosaurios vivieron en la Tierra durante más de 160 millones de años",
    "Algunos dinosaurios tenían plumas de colores brillantes",
    "El cerebro de un Stegosaurus era del tamaño de una nuez",
    "Los Velociraptors eran del tamaño de un pavo grande",
    "Los dinosaurios ponían huevos como las gallinas",
    "El cuello del Brachiosaurus era tan largo como una jirafa entera",
]

const PHASES = [
    { icon: Camera, label: "Analizando la foto...", detail: "Detectando rasgos faciales" },
    { icon: Sparkles, label: "Personalizando...", detail: "Cambiando la cara del protagonista" },
    { icon: Palette, label: "Renderizando...", detail: "Integrando en la ilustración" },
    { icon: BookOpen, label: "Últimos retoques...", detail: "Verificando calidad" },
]

export function AlchemistLoading() {
    const prefersReducedMotion = useReducedMotion()
    const [elapsed, setElapsed] = useState(0)
    const [factIndex, setFactIndex] = useState(0)
    const [notifyRequested, setNotifyRequested] = useState(false)
    const [notifySupported, setNotifySupported] = useState(false)

    useEffect(() => {
        setNotifySupported("Notification" in window)
    }, [])

    useEffect(() => {
        const interval = setInterval(() => setElapsed((p) => p + 1), 1000)
        return () => clearInterval(interval)
    }, [])

    // Rotate fun facts every 8 seconds
    useEffect(() => {
        if (elapsed > 0 && elapsed % 8 === 0) {
            setFactIndex((p) => (p + 1) % FUN_FACTS.length)
        }
    }, [elapsed])

    const phaseIndex = elapsed < 8 ? 0 : elapsed < 30 ? 1 : elapsed < 55 ? 2 : 3
    const currentPhase = PHASES[phaseIndex]
    const PhaseIcon = currentPhase.icon
    const progress = Math.min((elapsed / 70) * 100, 95)

    const handleNotify = async () => {
        if (!("Notification" in window)) return
        const perm = await Notification.requestPermission()
        if (perm === "granted") {
            setNotifyRequested(true)
        }
    }

    // Send notification when parent component unmounts this (generation done)
    useEffect(() => {
        return () => {
            if (notifyRequested && "Notification" in window && Notification.permission === "granted") {
                new Notification("¡Tu portada está lista!", {
                    body: "Volvé a la app para ver la preview personalizada.",
                    icon: "/favicon.ico",
                })
            }
        }
    }, [notifyRequested])

    return (
        <div className="flex flex-col items-center justify-center min-h-[340px] md:min-h-[420px] relative px-4 py-6">
            {/* Vortex */}
            <div className="relative w-44 h-44 md:w-52 md:h-52 flex items-center justify-center mb-6">
                {!prefersReducedMotion && (
                    <>
                        <motion.div
                            className="absolute inset-0 border-[3px] border-[var(--play-primary)]/15 rounded-full border-t-[var(--play-primary)]/60"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div
                            className="absolute inset-5 border-[3px] border-[var(--play-primary-container)]/15 rounded-full border-b-[var(--play-primary-container)]/60"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                        />
                    </>
                )}
                <motion.div
                    className="w-20 h-20 bg-gradient-to-tr from-[var(--play-primary)] to-[var(--play-primary-container)] rounded-full shadow-[0_0_30px_rgba(0,93,167,0.35)] flex items-center justify-center z-10"
                    animate={prefersReducedMotion ? {} : { scale: [0.92, 1.08, 0.92] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                >
                    <PhaseIcon className="text-white w-9 h-9" />
                </motion.div>
            </div>

            {/* Progress */}
            <div className="w-full max-w-sm space-y-3 text-center">
                <div>
                    <h3 className="text-lg font-bold text-[var(--play-text-main)]">{currentPhase.label}</h3>
                    <p className="mt-0.5 text-sm text-[var(--play-text-muted)]">{currentPhase.detail}</p>
                </div>

                <div className="w-full h-1.5 bg-[var(--play-surface-low)] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[var(--play-primary)] to-[var(--play-primary-container)] rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                </div>

                <p className="text-xs text-[var(--play-text-muted)]">
                    {elapsed < 5
                        ? "Esto suele tardar entre 30 y 90 segundos"
                        : `${elapsed}s`}
                </p>
            </div>

            {/* Fun fact - appears after 6 seconds */}
            {elapsed >= 6 && (
                <motion.div
                    className="mt-6 w-full max-w-sm rounded-2xl border border-[var(--play-outline)]/15 bg-[var(--play-surface-low)]/60 px-5 py-4 text-center"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={factIndex}
                >
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--play-primary)] mb-1.5">
                        ¿Sabías que...?
                    </p>
                    <p className="text-sm text-[var(--play-text-muted)] leading-relaxed">
                        {FUN_FACTS[factIndex]}
                    </p>
                </motion.div>
            )}

            {/* Notify me button - appears after 15 seconds */}
            {elapsed >= 15 && notifySupported && !notifyRequested && (
                <motion.button
                    onClick={handleNotify}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--play-outline)]/20 bg-white/70 px-4 py-2.5 text-sm font-semibold text-[var(--play-primary)] transition-colors hover:bg-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <Bell className="h-4 w-4" />
                    Avisame cuando esté lista
                </motion.button>
            )}

            {notifyRequested && (
                <p className="mt-3 text-xs text-[var(--play-accent-success)] font-medium">
                    Te avisamos cuando termine. Podés hacer otra cosa mientras tanto.
                </p>
            )}
        </div>
    )
}

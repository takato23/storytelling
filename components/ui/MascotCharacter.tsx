"use client"

import React, { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronRight, MessageCircle, X } from "lucide-react"
import { usePathname } from "next/navigation"

const TIPS = [
    "¡Hola! Soy Magi. Te ayudo a elegir el mejor cuento.",
    "Si querés avanzar rápido, empezá por subir una foto clara.",
    "Podés explorar el catálogo o ir directo a crear el cuento.",
]

const QUICK_ACTIONS = [
    { label: "Crear cuento", href: "/crear" },
    { label: "Ver catálogo", href: "/nuestros-libros" },
    { label: "FAQ", href: "/#faq" },
]

interface MascotCharacterProps {
    className?: string
    showTips?: boolean
}

export function MascotCharacter({ className = "", showTips = true }: MascotCharacterProps) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const tip = useMemo(() => {
        const index = pathname.length % TIPS.length
        return TIPS[index]
    }, [pathname])

    if (pathname === "/crear") return null

    return (
        <div
            className={`z-40 flex items-end ${className}`}
            style={{
                position: "fixed",
                right: "20px",
                bottom: "20px",
                left: "auto",
                top: "auto",
                width: "auto",
            }}
        >
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="mr-3 w-[280px] sm:w-[320px]"
                    >
                        <div className="page-panel rounded-[28px] p-4 shadow-[0_24px_45px_-28px_rgba(34,24,39,0.45)]">
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-white/70 bg-white">
                                        <Image
                                            src="/images/magi_avatar.png"
                                            alt="Magi"
                                            fill
                                            className="object-cover scale-[1.2]"
                                            sizes="40px"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-charcoal-900">Magi</p>
                                        <p className="text-xs font-medium text-purple-600">Asistente StoryMagic</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal-50 text-charcoal-500 transition-colors hover:bg-charcoal-100"
                                    aria-label="Cerrar chat"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {showTips && (
                                <div className="page-card mb-3 rounded-[20px] px-4 py-3">
                                    <p className="text-sm font-medium leading-relaxed text-charcoal-700">{tip}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                {QUICK_ACTIONS.map((action) => (
                                    <Link
                                        key={action.label}
                                        href={action.href}
                                        className="flex items-center justify-between rounded-[18px] border border-charcoal-100 bg-white px-4 py-3 text-sm font-bold text-charcoal-800 transition-all hover:border-purple-200 hover:text-purple-700"
                                    >
                                        <span>{action.label}</span>
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/70 bg-white/92 shadow-[0_20px_40px_-24px_rgba(34,24,39,0.5)] backdrop-blur-sm transition-transform hover:scale-[1.03]"
                whileTap={{ scale: 0.97 }}
                aria-label="Abrir chat de Magi"
            >
                <div className="absolute inset-[5px] overflow-hidden rounded-full bg-gradient-to-br from-purple-50 to-rose-50">
                    <Image
                        src="/images/magi_avatar.png"
                        alt="Magi"
                        fill
                        className="object-cover scale-[1.18]"
                        sizes="80px"
                    />
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-charcoal-900 text-white shadow-lg">
                    <MessageCircle className="h-4 w-4" />
                </div>
            </motion.button>
        </div>
    )
}

export default MascotCharacter

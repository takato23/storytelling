"use client"

import React from "react"
import { motion } from "framer-motion"
import { CharacterLetter } from "./CharacterLetter"
import { ScheduleManager } from "./ScheduleManager"
import { Sparkles, Gift, Mail, Star } from "lucide-react"

import { useMagicMail } from "./useMagicMail"

export function MagicMailDashboard() {
    const { letters } = useMagicMail()

    // Floating sparkle particles
    const sparkles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 8 + 4,
        delay: Math.random() * 2,
        duration: Math.random() * 3 + 2,
    }))

    return (
        <div className="container mx-auto px-4 py-8 pb-32 max-w-6xl">
            {/* Header Area */}
            <div className="relative mb-12 p-8 md:p-12 rounded-[40px] bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-teal-500/10" />
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" />
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-400/15 rounded-full blur-[60px]" />

                {/* Floating Sparkles */}
                {sparkles.map((sparkle) => (
                    <motion.div
                        key={sparkle.id}
                        className="absolute pointer-events-none"
                        style={{
                            left: `${sparkle.x}%`,
                            top: `${sparkle.y}%`,
                        }}
                        animate={{
                            y: [0, -15, 0],
                            opacity: [0.3, 1, 0.3],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: sparkle.duration,
                            delay: sparkle.delay,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        <Sparkles className="w-3 h-3 text-yellow-400/60" />
                    </motion.div>
                ))}

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-sm border border-white/80 text-sm font-bold text-indigo-600 mb-4 shadow-sm"
                        >
                            <motion.div
                                animate={{ rotate: [0, 15, -15, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Sparkles className="w-4 h-4 fill-indigo-400" />
                            </motion.div>
                            <span>Mensajería Encantada</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-bold text-charcoal-900 mb-4 tracking-tight drop-shadow-sm"
                        >
                            Buzón <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">Mágico</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg md:text-xl text-charcoal-600 max-w-md leading-relaxed"
                        >
                            Aquí llegan las cartas especiales de tus personajes favoritos. ¡Revisa si tienes algo nuevo!
                        </motion.p>
                    </div>

                    {/* Animated Mascot Area */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="relative"
                    >
                        {/* Orbit rings */}
                        <motion.div
                            className="absolute -inset-4 border-2 border-dashed border-indigo-200/50 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div
                            className="absolute -inset-8 border border-dashed border-purple-200/30 rounded-full"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        />

                        {/* Orbiting mini icons */}
                        {/* Orbiting mini icons */}
                        <motion.div
                            className="absolute -inset-4"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        >
                            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                <Mail className="w-6 h-6 text-indigo-400" />
                            </span>
                        </motion.div>
                        <motion.div
                            className="absolute -inset-6"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        >
                            <span className="absolute bottom-0 right-0">
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            </span>
                        </motion.div>

                        {/* Main Mailbox */}
                        <motion.div
                            className="w-36 h-36 md:w-44 md:h-44 bg-gradient-to-b from-indigo-100 via-white to-indigo-50 rounded-full flex items-center justify-center border-4 border-white shadow-2xl relative z-10"
                            animate={{
                                y: [0, -8, 0],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <motion.div
                                className="text-indigo-600 filter drop-shadow-lg"
                                animate={{
                                    rotateZ: [0, 5, -5, 0],
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 0.5,
                                }}
                            >
                                <Mail className="w-20 h-20 md:w-24 md:h-24 stroke-1" />
                            </motion.div>


                            {/* New mail indicator */}
                            {letters.some(l => l.isNew) && (
                                <motion.div
                                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                >
                                    <span className="text-white text-xs font-bold">
                                        {letters.filter(l => l.isNew).length}
                                    </span>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Glow effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-400/30 blur-[50px] -z-10 rounded-full" />
                    </motion.div>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left: Letters Grid (8 cols) */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-charcoal-800 flex items-center gap-3">
                            <Mail className="w-7 h-7 text-indigo-600" />
                            <span>Tus Cartas</span>
                            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">{letters.length}</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {letters.map((letter, index) => (
                            <motion.div
                                key={letter.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <CharacterLetter
                                    {...letter}
                                />
                            </motion.div>
                        ))}
                    </div>

                    {letters.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20 bg-white/40 backdrop-blur-md rounded-[32px] border-2 border-dashed border-indigo-200/50 flex flex-col items-center"
                        >
                            <motion.div
                                className="mb-4 text-charcoal-300"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Mail className="w-16 h-16 opacity-50" />
                            </motion.div>
                            <p className="text-charcoal-400 font-medium">El buzón está vacío por ahora...</p>
                            <p className="text-charcoal-300 text-sm mt-2">¡Pero pronto llegará correo mágico!</p>
                        </motion.div>
                    )}
                </div>

                {/* Right: Scheduler & Tools (4 cols) */}
                <div className="lg:col-span-4 space-y-8">
                    <ScheduleManager />

                    {/* Promo Card */}
                    <motion.div
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white shadow-xl shadow-indigo-500/30 cursor-pointer"
                    >
                        {/* Animated background pattern */}
                        <motion.div
                            className="absolute inset-0 opacity-10"
                            style={{
                                backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                            }}
                            animate={{ x: [0, 60], y: [0, 60] }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        />

                        <div className="absolute top-0 right-0 p-6 opacity-30">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            >
                                <Sparkles className="w-20 h-20" />
                            </motion.div>
                        </div>

                        <div className="relative z-10">
                            <motion.div
                                className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/30"
                                whileHover={{ rotate: 15 }}
                            >
                                <Gift className="w-7 h-7 text-yellow-300" />
                            </motion.div>
                            <h3 className="font-bold text-2xl mb-2">¡Pide un saludo!</h3>
                            <p className="text-white/80 text-sm mb-6 leading-relaxed">
                                ¿Quieres que el T-Rex o el Hada del Bosque te saluden por tu cumpleaños?
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full bg-white text-indigo-700 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                <span>Ver opciones mágicas</span>
                                <motion.div
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <Sparkles className="w-4 h-4 text-indigo-500" />
                                </motion.div>
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div >
    )
}

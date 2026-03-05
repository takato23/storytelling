"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Check, Home, Sparkles, BookOpen } from "lucide-react"

export default function SuccessPage() {
    const [showContent, setShowContent] = useState(false)

    useEffect(() => {
        // Clear cart on success
        localStorage.removeItem('storymagic_cart')

        const timer = setTimeout(() => {
            setShowContent(true)
        }, 500)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="min-h-screen bg-[#f5f0eb] flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background Decorations */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />

                {/* Floating Particles */}
                {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                        initial={{
                            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                            y: typeof window !== 'undefined' ? window.innerHeight : 1000,
                            scale: 0
                        }}
                        animate={{
                            y: -100,
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0]
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 5,
                            ease: "easeOut"
                        }}
                    />
                ))}
            </div>

            <motion.div
                className="max-w-lg w-full bg-white/80 backdrop-blur-xl rounded-[40px] shadow-2xl p-10 border border-white text-center relative z-10"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ duration: 0.6, type: "spring" }}
            >
                {/* Success Icon Animation */}
                <div className="relative mb-8 flex justify-center">
                    <motion.div
                        className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 z-10"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                        <motion.div
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                        >
                            <Check className="w-12 h-12 text-white stroke-[3]" />
                        </motion.div>
                    </motion.div>

                    {/* Ring Pulse */}
                    <motion.div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 border-4 border-green-500 rounded-full"
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ delay: 0.4, duration: 1 }}
                    />
                </div>

                <div className="space-y-4 mb-10">
                    <motion.h1
                        className="text-4xl font-bold text-gray-900 font-serif"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        ¡Magia en camino!
                    </motion.h1>
                    <motion.p
                        className="text-gray-600 text-lg leading-relaxed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        Tu pedido ha sido confirmado. Estamos preparando los hechizos necesarios para crear tu libro.
                    </motion.p>
                </div>

                {/* Order Details Card */}
                <motion.div
                    className="bg-indigo-50 rounded-2xl p-6 mb-8 text-left border border-indigo-100"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm text-2xl">
                            🪄
                        </div>
                        <div>
                            <h3 className="font-bold text-indigo-900">Orden #magic-{Math.floor(Math.random() * 10000)}</h3>
                            <p className="text-sm text-indigo-700/80 mt-1">
                                Recibirás un correo con la confirmación y el enlace de seguimiento mágico.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    className="flex flex-col gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                >
                    <Link href="/cuenta/pedidos">
                        <motion.button
                            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 transition-shadow flex items-center justify-center gap-2 group"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <BookOpen className="w-5 h-5" />
                            Ver mis pedidos
                        </motion.button>
                    </Link>

                    <Link href="/crear">
                        <motion.button
                            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-shadow flex items-center justify-center gap-2 group"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            Crear otra historia
                        </motion.button>
                    </Link>

                    <Link href="/">
                        <button className="w-full py-4 text-gray-500 font-bold hover:text-gray-800 transition-colors flex items-center justify-center gap-2">
                            <Home className="w-4 h-4" />
                            Volver al inicio
                        </button>
                    </Link>
                </motion.div>

            </motion.div>
        </div>
    )
}

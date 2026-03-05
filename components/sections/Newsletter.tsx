"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Send, Sparkles, Mail } from "lucide-react"

export function Newsletter({ className = "" }: { className?: string }) {
    const [email, setEmail] = useState("")
    const [status, setStatus] = useState<"idle" | "loading" | "success">("idle")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setStatus("loading")
        setTimeout(() => setStatus("success"), 1500)
    }

    return (
        <section className={`py-20 relative overflow-hidden bg-[#0c051a] text-white ${className}`}>
            {/* Background patterns */}
            <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }}
            />

            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-5xl mx-auto bg-white/5 backdrop-blur-2xl rounded-[40px] p-8 md:p-14 shadow-2xl border border-white/10 flex flex-col md:flex-row items-center gap-12">

                    {/* Text Content */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-sm">
                            <Sparkles className="w-3 h-3" /> Club Mágico
                        </div>
                        <h2 className="text-3xl md:text-4xl font-serif mb-4 drop-shadow-sm">
                            Únete a <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500">+100,000 padres</span> mágicos
                        </h2>
                        <p className="text-white/60 mb-8 font-light leading-relaxed text-lg">
                            Recibe consejos de crianza, novedades y un <span className="text-white font-bold border-b border-white/30">10% de descuento</span> en tu primer cuento.
                        </p>

                        {status === "success" ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-green-500/20 border border-green-500/50 text-green-300 px-6 py-4 rounded-xl text-center"
                            >
                                ¡Gracias! Tu código mágico está en camino <Mail className="w-5 h-5 inline-block ml-1" />
                            </motion.div>
                        ) : (
                            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="email"
                                    placeholder="Tu correo electrónico"
                                    className="flex-1 px-6 py-5 rounded-[20px] bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-coral-400 transition-all font-medium"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={status === "loading"}
                                />
                                <button
                                    type="submit"
                                    disabled={status === "loading"}
                                    className="px-8 py-5 bg-coral-500 hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-[20px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-coral-500/30 hover:scale-105 active:scale-95 text-sm uppercase tracking-wider"
                                >
                                    {status === "loading" ? "Enviando..." : <>Suscribirme <Send className="w-4 h-4" /></>}
                                </button>
                            </form>
                        )}
                        <p className="text-[10px] text-white/30 mt-6 uppercase tracking-widest font-bold">
                            Respetamos tu privacidad. Cero spam, solo magia.
                        </p>
                    </div>

                    {/* Visual */}
                    <div className="w-48 md:w-64 flex-shrink-0 relative">
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            className="text-center drop-shadow-2xl flex justify-center"
                        >
                            <Sparkles className="w-32 h-32 text-white/80" />
                        </motion.div>
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/40 rounded-full blur-xl filter" />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Newsletter

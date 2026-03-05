"use client"

import React from "react"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

interface GiftMessageProps {
    message: string
    senderName: string
    recipientName: string
    onUpdate: (field: string, value: string) => void
}

export function GiftMessage({ message, senderName, recipientName, onUpdate }: GiftMessageProps) {
    return (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Form Side */}
            <div className="space-y-6 wizard-liquid-panel rounded-3xl p-6 md:p-7">
                <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-charcoal-900">Escribe tu dedicatoria</h3>
                    <p className="text-charcoal-500">Este mensaje aparecerá en la primera página del libro.</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-charcoal-700 mb-1">De parte de</label>
                        <input
                            type="text"
                            value={senderName}
                            onChange={(e) => onUpdate('senderName', e.target.value)}
                            placeholder="Ej: La Tía Ana"
                            className="wizard-input w-full px-4 py-3 rounded-xl outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-charcoal-700 mb-1">Para</label>
                        <input
                            type="text"
                            value={recipientName}
                            onChange={(e) => onUpdate('recipientName', e.target.value)}
                            placeholder="Ej: El pequeño Leo"
                            className="wizard-input w-full px-4 py-3 rounded-xl outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-charcoal-700 mb-1">
                            Tu mensaje mágico <span className="text-charcoal-400 font-normal">(Máx 300 carácteres)</span>
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => onUpdate('message', e.target.value)}
                            maxLength={300}
                            placeholder="Espero que disfrutes de esta aventura mágica y recuerdes que..."
                            className="wizard-input w-full h-32 px-4 py-3 rounded-xl outline-none transition-all resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Preview Side */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/65 via-cyan-100/55 to-fuchsia-100/55 rounded-3xl transform rotate-3 scale-95 opacity-70 blur-sm" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative wizard-liquid-panel p-8 rounded-2xl overflow-hidden"
                >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />
                    <Sparkles className="absolute top-6 right-6 text-amber-400 w-8 h-8 opacity-50" />

                    <div className="text-center space-y-6 py-6 font-serif">
                        <div className="space-y-1">
                            <p className="text-charcoal-400 text-sm tracking-widest uppercase">Para</p>
                            <h4 className="text-2xl font-bold text-charcoal-900 border-b-2 border-dashed border-charcoal-100 pb-2 inline-block min-w-[150px]">
                                {recipientName || "..."}
                            </h4>
                        </div>

                        <div className="relative py-4">
                            <p className="text-lg text-charcoal-700 leading-relaxed italic relative z-10 min-h-[100px] whitespace-pre-wrap">
                                {message || "Tu mensaje aparecerá aquí..."}
                            </p>
                            <div className="absolute -top-4 -left-4 text-6xl text-purple-100 font-serif leading-none select-none">&ldquo;</div>
                            <div className="absolute -bottom-12 -right-4 text-6xl text-purple-100 font-serif leading-none select-none rotate-180">&rdquo;</div>
                        </div>

                        <div className="space-y-1 pt-4">
                            <p className="text-charcoal-400 text-sm tracking-widest uppercase">Con amor,</p>
                            <h4 className="text-xl font-bold text-indigo-600">
                                {senderName || "..."}
                            </h4>
                        </div>
                    </div>

                    {/* Footer decoration */}
                    <div className="mt-8 flex justify-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-fuchsia-300" />
                        <div className="w-2 h-2 rounded-full bg-indigo-300" />
                        <div className="w-2 h-2 rounded-full bg-cyan-300" />
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

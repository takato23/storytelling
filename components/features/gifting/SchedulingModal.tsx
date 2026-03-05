"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Clock, X, Check } from "lucide-react"

interface SchedulingModalProps {
    isOpen: boolean
    onClose: () => void
    onSchedule: (date: string, time: string) => void
    initialDate?: string
    initialTime?: string
}

export function SchedulingModal({ isOpen, onClose, onSchedule, initialDate = "", initialTime = "10:00" }: SchedulingModalProps) {
    const [date, setDate] = useState(initialDate)
    const [time, setTime] = useState(initialTime)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSchedule(date, time)
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white flex justify-between items-center">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Programar Entrega
                            </h3>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <p className="text-charcoal-600 text-sm">
                                Elige el momento exacto para sorprenderlos. Enviaremos el email mágico en esta fecha.
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-charcoal-700">Fecha de entrega</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            required
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]} // Min today
                                            className="w-full px-4 py-3 pl-10 rounded-xl border border-charcoal-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all appearance-none"
                                        />
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 w-5 h-5" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-charcoal-700">Hora (Tu hora local)</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            required
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="w-full px-4 py-3 pl-10 rounded-xl border border-charcoal-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all appearance-none"
                                        />
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 px-6 rounded-xl border border-charcoal-200 text-charcoal-600 font-medium hover:bg-charcoal-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!date || !time}
                                    className="flex-1 py-3 px-6 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Check className="w-5 h-5" />
                                    Confirmar
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

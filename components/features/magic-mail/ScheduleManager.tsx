"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calendar, Plus, Gift, Sparkles, Star } from "lucide-react"

import { useMagicMail, SpecialDate } from "./useMagicMail"
import { Trash2 } from "lucide-react"

export function ScheduleManager() {
    const { events, addEvent, deleteEvent } = useMagicMail()
    const [isAdding, setIsAdding] = useState(false)
    const [newEvent, setNewEvent] = useState<Omit<SpecialDate, 'id'>>({
        title: "",
        date: "",
        character: "",
        type: "other"
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (newEvent.title && newEvent.date && newEvent.character) {
            addEvent(newEvent)
            setIsAdding(false)
            setNewEvent({ title: "", date: "", character: "", type: "other" })
        }
    }

    return (
        <div className="bg-white/60 backdrop-blur-xl rounded-[32px] p-8 shadow-xl border border-white/80">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-xl font-bold text-charcoal-900 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-purple-600" />
                        Fechas Mágicas
                    </h3>
                    <p className="text-sm text-charcoal-500 mt-1">
                        Programa cartas para días especiales
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsAdding(!isAdding)}
                    className={`
                        w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md
                        ${isAdding ? 'bg-charcoal-100 text-charcoal-500 rotate-45' : 'bg-purple-600 text-white hover:bg-purple-700'}
                    `}
                >
                    <Plus className="w-5 h-5" />
                </motion.button>
            </div>

            <div className="space-y-4">
                {events.map((event) => (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={event.id}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 border border-white/60 hover:border-purple-200 hover:shadow-md transition-all group"
                    >
                        <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0
                            ${event.type === 'birthday' ? 'bg-gradient-to-br from-pink-400 to-rose-500' :
                                event.type === 'tooth_fairy' ? 'bg-gradient-to-br from-teal-400 to-emerald-500' :
                                    event.type === 'holiday' ? 'bg-gradient-to-br from-red-400 to-orange-500' : 'bg-gradient-to-br from-indigo-400 to-purple-500'}
                        `}>
                            {event.type === 'birthday' ? <Gift className="w-6 h-6" /> :
                                event.type === 'tooth_fairy' ? <Sparkles className="w-6 h-6" /> :
                                    event.type === 'holiday' ? <Star className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-charcoal-900 text-base truncate">{event.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-charcoal-500 mt-1">
                                <span className="bg-charcoal-100 px-2 py-0.5 rounded-md font-medium">{event.date}</span>
                                <span>•</span>
                                <span className="text-purple-600 font-medium">{event.character}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => deleteEvent(event.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-charcoal-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}

                {events.length === 0 && !isAdding && (
                    <div className="text-center py-10 px-4 border-2 border-dashed border-charcoal-100 rounded-2xl">
                        <Calendar className="w-10 h-10 text-charcoal-200 mx-auto mb-3" />
                        <p className="text-charcoal-400 text-sm mb-3">No tienes eventos programados.</p>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="text-purple-600 font-bold text-sm hover:underline"
                        >
                            Añadir fecha especial
                        </button>
                    </div>
                )}
            </div>

            {/* Add Event Form */}
            <AnimatePresence>
                {isAdding && (
                    <motion.form
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        onSubmit={handleSubmit}
                        className="bg-purple-50/50 rounded-2xl border border-purple-100/50 p-4 overflow-hidden"
                    >
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-purle-900 uppercase tracking-widest mb-1.5 ml-1">Título</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Cumpleaños de Leo"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-purple-100 focus:border-purple-300 focus:ring-4 focus:ring-purple-100 outline-none text-sm transition-all"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-charcoal-500 uppercase tracking-widest mb-1.5 ml-1">Fecha</label>
                                    <input
                                        type="date"
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-purple-100 focus:border-purple-300 focus:ring-4 focus:ring-purple-100 outline-none text-sm transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-charcoal-500 uppercase tracking-widest mb-1.5 ml-1">Tipo</label>
                                    <select
                                        value={newEvent.type}
                                        onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                                        className="w-full px-4 py-3 rounded-xl bg-white border border-purple-100 focus:border-purple-300 focus:ring-4 focus:ring-purple-100 outline-none text-sm transition-all appearance-none"
                                    >
                                        <option value="other">Otro</option>
                                        <option value="birthday">Cumpleaños</option>
                                        <option value="tooth_fairy">Ratón Pérez</option>
                                        <option value="holiday">Festividad</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-charcoal-500 uppercase tracking-widest mb-1.5 ml-1">Personaje</label>
                                <input
                                    type="text"
                                    placeholder="Quién enviará la carta"
                                    value={newEvent.character}
                                    onChange={(e) => setNewEvent({ ...newEvent, character: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-white border border-purple-100 focus:border-purple-300 focus:ring-4 focus:ring-purple-100 outline-none text-sm transition-all"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all"
                            >
                                Programar Carta
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    )
}

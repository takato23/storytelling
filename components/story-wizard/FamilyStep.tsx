"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Plus, X, PawPrint } from "lucide-react"

interface FamilyMember {
    id: string
    role: "Papá" | "Mamá" | "Hermano" | "Hermana" | "Abuelo" | "Abuela" | "Mascota" | "Otro"
    name: string
    photo: string | null
}

interface FamilyStepProps {
    members: FamilyMember[]
    onChange: (members: FamilyMember[]) => void
}

export function FamilyStep({ members, onChange }: FamilyStepProps) {
    const [isAddingMode, setIsAddingMode] = useState(false)
    const [newMember, setNewMember] = useState<{ role: FamilyMember["role"], name: string }>({ role: "Papá", name: "" })

    const roles: FamilyMember["role"][] = ["Papá", "Mamá", "Hermano", "Hermana", "Abuelo", "Abuela", "Mascota", "Otro"]

    const handleAddMember = () => {
        if (newMember.role && newMember.name) {
            onChange([
                ...members,
                {
                    id: Math.random().toString(36).substr(2, 9),
                    role: newMember.role,
                    name: newMember.name,
                    photo: null
                }
            ])
            setNewMember({ role: "Papá", name: "" })
            setIsAddingMode(false)
        }
    }

    const removeMember = (id: string) => {
        onChange(members.filter(m => m.id !== id))
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-indigo-600/85 mb-3">Paso 3 de 6</p>
                <h2 className="text-3xl md:text-4xl font-serif text-charcoal-900 mb-2">
                    Elenco Familiar
                </h2>
                <p className="text-charcoal-600">
                    Añade a los miembros de la familia para incluirlos en la historia.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-8">
                <AnimatePresence>
                    {members.map((member) => (
                        <motion.div
                            key={member.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="relative wizard-liquid-soft p-5 rounded-[24px] flex flex-col items-center group hover:bg-white/75 hover:shadow-[0_20px_35px_-25px_rgba(79,70,229,0.6)] hover:-translate-y-0.5 transition-all duration-300"
                        >
                            <button
                                onClick={() => removeMember(member.id)}
                                className="absolute top-3 right-3 p-1.5 text-charcoal-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>

                            <div className="w-16 h-16 bg-gradient-to-br from-white to-indigo-50 rounded-2xl flex items-center justify-center mb-3 text-3xl border border-white/85 shadow-sm group-hover:scale-110 transition-transform">
                                {member.role === "Mascota" ? <PawPrint className="w-8 h-8 text-charcoal-700" /> : <User className="w-8 h-8 text-charcoal-700" />}
                            </div>
                            <span className="font-bold text-charcoal-800 text-sm mb-0.5">{member.name}</span>
                            <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">{member.role}</span>
                        </motion.div>
                    ))}

                    <motion.button
                        layout
                        onClick={() => setIsAddingMode(true)}
                        className={`
                            h-full min-h-[160px] rounded-[24px] border-2 border-dashed border-indigo-200/70 
                            flex flex-col items-center justify-center gap-3 text-indigo-400/80
                            hover:border-indigo-400 hover:text-indigo-600 hover:bg-white/65 transition-all wizard-liquid-soft
                            ${isAddingMode ? 'hidden' : 'flex'}
                        `}
                    >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-white to-indigo-50 border border-indigo-100/70 flex items-center justify-center">
                            <Plus className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-xs uppercase tracking-wide">Añadir miembro</span>
                    </motion.button>
                </AnimatePresence>
            </div>

            {/* Add Member Form */}
            <AnimatePresence>
                {isAddingMode && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-8"
                    >
                        <div className="wizard-liquid-panel p-8 rounded-[32px]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-xl text-charcoal-900">Nuevo integrante</h3>
                                <button onClick={() => setIsAddingMode(false)} className="p-2 hover:bg-charcoal-50 rounded-full transition-colors"><X className="w-5 h-5 text-charcoal-400" /></button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-3">¿Quién es?</label>
                                    <div className="flex flex-wrap gap-2">
                                        {roles.map(role => (
                                            <button
                                                key={role}
                                                onClick={() => setNewMember({ ...newMember, role })}
                                                className={`px-4 py-2 rounded-xl text-sm transition-all border ${newMember.role === role
                                                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-500/25"
                                                    : "bg-white/75 border-white/80 text-charcoal-600 hover:border-indigo-200 hover:bg-indigo-50/60"
                                                    }`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-2">Nombre</label>
                                    <input
                                        type="text"
                                        value={newMember.name}
                                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                        placeholder="Ej: Sofía"
                                        className="wizard-input w-full px-5 py-3 rounded-2xl transition-all"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    onClick={handleAddMember}
                                    disabled={!newMember.name}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                                >
                                    Guardar integrante
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

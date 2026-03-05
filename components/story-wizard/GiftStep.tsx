"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { Calendar } from "lucide-react"
import { GiftOptions } from "@/components/features/gifting/GiftOptions"
import { GiftMessage } from "@/components/features/gifting/GiftMessage"
import { SchedulingModal } from "@/components/features/gifting/SchedulingModal"

interface GiftData {
    type: "digital" | "physical" | null
    message: string
    senderName: string
    recipientName: string
    scheduledDate: string
    scheduledTime: string
}

interface GiftStepProps {
    giftData: GiftData
    onUpdate: (field: string, value: string | null) => void
}

export function GiftStep({
    giftData,
    onUpdate
}: GiftStepProps) {
    const [isScheduling, setIsScheduling] = useState(false)

    return (
        <div className="max-w-5xl mx-auto">
            <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-indigo-600/85 mb-3">Paso 6 de 7</p>
                <h2 className="text-3xl md:text-4xl font-serif text-charcoal-900 mb-2">
                    Prepara tu regalo mágico
                </h2>
                <p className="text-charcoal-600">
                    Personaliza la experiencia de entrega
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-12"
            >
                <GiftOptions
                    selectedType={giftData.type}
                    onSelect={(type) => onUpdate('type', type)}
                />

                <div className="border-t border-charcoal-100 my-8" />

                <GiftMessage
                    message={giftData.message}
                    senderName={giftData.senderName}
                    recipientName={giftData.recipientName}
                    onUpdate={onUpdate}
                />

                {/* Scheduling Preview/Button */}
                <div className="wizard-liquid-panel rounded-2xl p-5 md:p-6 flex items-center justify-between gap-4">
                    <div>
                        <h4 className="font-semibold text-charcoal-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            Programar Entrega
                        </h4>
                        <p className="text-sm text-charcoal-600 mt-1 leading-relaxed">
                            {giftData.scheduledDate
                                ? `Programado para el ${giftData.scheduledDate} a las ${giftData.scheduledTime}`
                                : "Envío inmediato al finalizar la compra"
                            }
                        </p>
                    </div>
                    <button
                        onClick={() => setIsScheduling(true)}
                        className="wizard-liquid-pill px-4 py-2.5 text-indigo-700 font-semibold rounded-lg hover:text-indigo-900 transition-colors shrink-0"
                    >
                        {giftData.scheduledDate ? "Cambiar fecha" : "Programar"}
                    </button>
                </div>
            </motion.div>

            <SchedulingModal
                isOpen={isScheduling}
                onClose={() => setIsScheduling(false)}
                onSchedule={(date, time) => {
                    onUpdate('scheduledDate', date)
                    onUpdate('scheduledTime', time)
                }}
                initialDate={giftData.scheduledDate}
                initialTime={giftData.scheduledTime}
            />
        </div>
    )
}

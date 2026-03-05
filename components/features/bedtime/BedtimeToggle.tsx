"use client"

import React from "react"
import { Moon, Sun } from "lucide-react"
import { useBedtime } from "./BedtimeContext"
import { motion } from "framer-motion"

export function BedtimeToggle() {
    const { isBedtimeEnabled, toggleBedtime } = useBedtime()

    return (
        <button
            onClick={toggleBedtime}
            className={`
                relative p-2 rounded-full transition-all duration-500
                ${isBedtimeEnabled
                    ? "bg-indigo-900 text-yellow-300 shadow-[0_0_15px_rgba(253,224,71,0.3)]"
                    : "bg-blue-50 text-orange-500 hover:bg-blue-100"
                }
            `}
            aria-label={isBedtimeEnabled ? "Desactivar modo sueño" : "Activar modo sueño"}
            title={isBedtimeEnabled ? "Desactivar modo sueño" : "Activar modo sueño"}
        >
            <motion.div
                initial={false}
                animate={{ rotate: isBedtimeEnabled ? 360 : 0 }}
                transition={{ duration: 0.5, type: "spring" }}
            >
                {isBedtimeEnabled ? (
                    <Moon className="w-5 h-5 fill-current" />
                ) : (
                    <Sun className="w-5 h-5 fill-current" />
                )}
            </motion.div>

            {/* Tooltip for first-time discovery could go here */}
        </button>
    )
}

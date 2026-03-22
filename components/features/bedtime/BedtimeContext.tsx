"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface BedtimeContextType {
    isBedtimeEnabled: boolean
    toggleBedtime: () => void
}

const BedtimeContext = createContext<BedtimeContextType | undefined>(undefined)

export function BedtimeProvider({ children }: { children: React.ReactNode }) {
    const [isBedtimeEnabled, setIsBedtimeEnabled] = useState(() => {
        if (typeof window === "undefined") return false
        return localStorage.getItem("bedtimeMode") === "true"
    })

    useEffect(() => {
        if (isBedtimeEnabled) {
            document.documentElement.classList.add("bedtime-mode")
        } else {
            document.documentElement.classList.remove("bedtime-mode")
        }
    }, [isBedtimeEnabled])

    const toggleBedtime = () => {
        setIsBedtimeEnabled(prev => {
            const newValue = !prev
            localStorage.setItem("bedtimeMode", String(newValue))
            if (newValue) {
                document.documentElement.classList.add("bedtime-mode")
            } else {
                document.documentElement.classList.remove("bedtime-mode")
            }
            return newValue
        })
    }

    return (
        <BedtimeContext.Provider value={{ isBedtimeEnabled, toggleBedtime }}>
            {children}
        </BedtimeContext.Provider>
    )
}

export function useBedtime() {
    const context = useContext(BedtimeContext)
    if (context === undefined) {
        throw new Error("useBedtime must be used within a BedtimeProvider")
    }
    return context
}

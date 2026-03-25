"use client"

import React, { createContext, useContext, useEffect, useSyncExternalStore } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
    theme: Theme
    resolvedTheme: Theme
    themePreference: Theme | null
    setTheme: (_theme: Theme) => void
    toggleTheme: (_buttonRect?: DOMRect) => void
    isTransitioning: boolean
    mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function subscribeToHydration() {
    return () => { }
}

const noopSetTheme = (_theme: Theme) => { }
const noopToggleTheme = (_buttonRect?: DOMRect) => { }

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const mounted = useSyncExternalStore<boolean>(
        subscribeToHydration,
        () => true,
        () => false,
    )

    useEffect(() => {
        document.documentElement.classList.remove("dark")
        localStorage.removeItem("theme")
    }, [])

    return (
        <ThemeContext.Provider
            value={{
                theme: "light",
                resolvedTheme: "light",
                themePreference: null,
                setTheme: noopSetTheme,
                toggleTheme: noopToggleTheme,
                isTransitioning: false,
                mounted,
            }}
        >
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error("useTheme must be used within a ThemeProvider")
    return ctx
}

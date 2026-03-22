"use client"

import React, { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
    theme: Theme
    resolvedTheme: Theme
    themePreference: Theme | null
    setTheme: (theme: Theme) => void
    toggleTheme: (buttonRect?: DOMRect) => void
    isTransitioning: boolean
    mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

function getMaxRadius(x: number, y: number) {
    const w = window.innerWidth
    const h = window.innerHeight
    return Math.ceil(Math.sqrt(Math.max(
        x * x + y * y,
        (w - x) ** 2 + y * y,
        x * x + (h - y) ** 2,
        (w - x) ** 2 + (h - y) ** 2,
    )))
}

function subscribeToSystemTheme(callback: () => void) {
    if (typeof window === "undefined") return () => { }

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    media.addEventListener("change", callback)
    return () => media.removeEventListener("change", callback)
}

function getSystemThemeSnapshot(): Theme {
    if (typeof window === "undefined") return "light"
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function subscribeToHydration() {
    return () => { }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themePreference, setThemePreference] = useState<Theme | null>(() => {
        if (typeof window === "undefined") return null
        const savedTheme = localStorage.getItem("theme")
        return savedTheme === "light" || savedTheme === "dark" ? savedTheme : null
    })
    const mounted = useSyncExternalStore<boolean>(
        subscribeToHydration,
        () => true,
        () => false,
    )
    const systemTheme = useSyncExternalStore<Theme>(
        subscribeToSystemTheme,
        getSystemThemeSnapshot,
        () => "light",
    )
    const resolvedTheme: Theme = mounted ? (themePreference ?? systemTheme) : "light"

    // Use ref for transitioning guard — avoids triggering re-renders on flag change
    const transitioning = useRef(false)
    const [isTransitioning, setIsTransitioning] = useState(false)

    // Timers ref for cleanup on unmount
    const timers = useRef<ReturnType<typeof setTimeout>[]>([])

    useEffect(() => {
        document.documentElement.classList.toggle("dark", resolvedTheme === "dark")

        if (!mounted) return
        if (themePreference) {
            localStorage.setItem("theme", themePreference)
            return
        }

        localStorage.removeItem("theme")
    }, [resolvedTheme, mounted, themePreference])

    // Cleanup pending timers on unmount
    useEffect(() => {
        return () => { timers.current.forEach(clearTimeout) }
    }, [])

    const setTheme = (theme: Theme) => {
        setThemePreference(theme)
    }

    const toggleTheme = (buttonRect?: DOMRect) => {
        if (transitioning.current) return

        const newTheme = resolvedTheme === "dark" ? "light" : "dark"
        const cx = buttonRect ? buttonRect.left + buttonRect.width / 2 : window.innerWidth / 2
        const cy = buttonRect ? buttonRect.top + buttonRect.height / 2 : 80
        const maxRadius = getMaxRadius(cx, cy)

        const overlay = document.createElement("div")
        overlay.className = "theme-transition-overlay"
        overlay.style.cssText = `--cx:${cx}px;--cy:${cy}px;--max-r:${maxRadius}px;background:${newTheme === "dark" ? "#1d1622" : "#fff8f1"}`
        document.body.appendChild(overlay)

        // Trigger reflow then animate (requestAnimationFrame ensures paint before class add)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => { overlay.classList.add("expanding") })
        })

        transitioning.current = true
        setIsTransitioning(true)

        const t1 = setTimeout(() => {
            setThemePreference(newTheme)
        }, 500)

        const t2 = setTimeout(() => {
            overlay.remove()
            transitioning.current = false
            setIsTransitioning(false)
        }, 820)

        timers.current = [t1, t2]
    }

    // Provide 'mounted' state so consumers can avoid rendering theme-dependent info during SSR
    return (
        <ThemeContext.Provider value={{ theme: resolvedTheme, resolvedTheme, themePreference, setTheme, toggleTheme, isTransitioning, mounted }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error("useTheme must be used within a ThemeProvider")
    return ctx
}

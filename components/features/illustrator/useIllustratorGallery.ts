"use client"

import { useState, useEffect } from 'react'

export interface Drawing {
    id: string
    title: string
    dataUrl: string
    date: string
}

export function useIllustratorGallery() {
    const [drawings, setDrawings] = useState<Drawing[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        const savedDrawings = localStorage.getItem('illustrator-gallery')
        if (savedDrawings) {
            try {
                setDrawings(JSON.parse(savedDrawings))
            } catch (e) {
                console.error("Failed to parse saved drawings", e)
            }
        }
        setIsLoaded(true)
    }, [])

    // Save to localStorage whenever state changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('illustrator-gallery', JSON.stringify(drawings))
        }
    }, [drawings, isLoaded])

    const saveDrawing = (dataUrl: string, title: string = "Mi Dibujo Mágico") => {
        const newDrawing: Drawing = {
            id: Date.now().toString(),
            title: title + " " + (drawings.length + 1),
            dataUrl,
            date: new Date().toLocaleDateString()
        }
        setDrawings(prev => [newDrawing, ...prev])
        return newDrawing
    }

    const deleteDrawing = (id: string) => {
        setDrawings(prev => prev.filter(d => d.id !== id))
    }

    return {
        drawings,
        saveDrawing,
        deleteDrawing
    }
}

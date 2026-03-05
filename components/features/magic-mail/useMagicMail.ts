"use client"

import { useState, useEffect } from 'react'

export interface SpecialDate {
    id: string
    title: string
    date: string
    character: string
    type: 'birthday' | 'tooth_fairy' | 'holiday' | 'other'
}

export interface Letter {
    id: number
    sender: string
    senderIcon: string
    subject: string
    content: string
    date: string
    themeColor: string
    isNew: boolean
}

const INITIAL_LETTERS: Letter[] = [
    {
        id: 1,
        sender: "El Capitán Espacial",
        senderIcon: "🚀",
        subject: "¡Misión Cumplida!",
        content: "¡Hola pequeño explorador!\n\nMe he enterado de que has completado tu primera semana de lectura. ¡Eso es fantástico! En la galaxia Andrómeda estamos celebrando tu éxito.\n\nSigue leyendo y soñando a lo grande.\n\nTu amigo,\nCapitán Lucas",
        date: "Hace 2 horas",
        themeColor: "indigo",
        isNew: true
    },
    {
        id: 2,
        sender: "Hada del Bosque",
        senderIcon: "🧚",
        subject: "Un secreto mágico",
        content: "Querido amigo,\n\nLas flores me han contado que ayer fuiste muy valiente en el dentista. ¡Bravo! La valentía es la magia más poderosa de todas.\n\nTe envío un poco de polvo de hadas para que tengas dulces sueños.\n\nCon luz de luna,\nHada Flora",
        date: "Ayer",
        themeColor: "emerald",
        isNew: false
    }
]

export function useMagicMail() {
    const [events, setEvents] = useState<SpecialDate[]>([])
    const [letters, setLetters] = useState<Letter[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        const savedEvents = localStorage.getItem('magic-mail-events')
        const savedLetters = localStorage.getItem('magic-mail-letters')

        if (savedEvents) {
            setEvents(JSON.parse(savedEvents))
        }

        if (savedLetters) {
            setLetters(JSON.parse(savedLetters))
        } else {
            // Set initial mock data if no saved data
            setLetters(INITIAL_LETTERS)
        }
        setIsLoaded(true)
    }, [])

    // Save to localStorage whenever state changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('magic-mail-events', JSON.stringify(events))
        }
    }, [events, isLoaded])

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('magic-mail-letters', JSON.stringify(letters))
        }
    }, [letters, isLoaded])

    const addEvent = (event: Omit<SpecialDate, 'id'>) => {
        const newEvent = {
            ...event,
            id: Date.now().toString()
        }
        setEvents(prev => [...prev, newEvent])
    }

    const deleteEvent = (id: string) => {
        setEvents(prev => prev.filter(e => e.id !== id))
    }

    const markRead = (id: number) => {
        setLetters(prev => prev.map(l => l.id === id ? { ...l, isNew: false } : l))
    }

    return {
        events,
        letters,
        addEvent,
        deleteEvent,
        markRead
    }
}

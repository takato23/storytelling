"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"

export interface WishlistItem {
    id: string
    slug: string
    title: string
    coverImage: string
    price: string
    addedAt: Date
}

interface WishlistContextType {
    items: WishlistItem[]
    itemCount: number
    isInWishlist: (id: string) => boolean
    addToWishlist: (item: Omit<WishlistItem, 'addedAt'>) => void
    removeFromWishlist: (id: string) => void
    clearWishlist: () => void
    toggleWishlist: (item: Omit<WishlistItem, 'addedAt'>) => void
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

const STORAGE_KEY = 'storymagic-wishlist'

export function WishlistProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<WishlistItem[]>([])
    const [isHydrated, setIsHydrated] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            if (saved) {
                const parsed = JSON.parse(saved)
                // Convert date strings back to Date objects
                const itemsWithDates = parsed.map((item: any) => ({
                    ...item,
                    addedAt: new Date(item.addedAt)
                }))
                setItems(itemsWithDates)
            }
        } catch (error) {
            console.error('Error loading wishlist:', error)
        }
        setIsHydrated(true)
    }, [])

    // Save to localStorage when items change
    useEffect(() => {
        if (isHydrated) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
            } catch (error) {
                console.error('Error saving wishlist:', error)
            }
        }
    }, [items, isHydrated])

    const isInWishlist = useCallback((id: string) => {
        return items.some(item => item.id === id)
    }, [items])

    const addToWishlist = useCallback((item: Omit<WishlistItem, 'addedAt'>) => {
        setItems(prev => {
            if (prev.some(i => i.id === item.id)) return prev
            return [...prev, { ...item, addedAt: new Date() }]
        })
    }, [])

    const removeFromWishlist = useCallback((id: string) => {
        setItems(prev => prev.filter(item => item.id !== id))
    }, [])

    const clearWishlist = useCallback(() => {
        setItems([])
    }, [])

    const toggleWishlist = useCallback((item: Omit<WishlistItem, 'addedAt'>) => {
        if (isInWishlist(item.id)) {
            removeFromWishlist(item.id)
        } else {
            addToWishlist(item)
        }
    }, [isInWishlist, addToWishlist, removeFromWishlist])

    return (
        <WishlistContext.Provider value={{
            items,
            itemCount: items.length,
            isInWishlist,
            addToWishlist,
            removeFromWishlist,
            clearWishlist,
            toggleWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    )
}

export function useWishlist() {
    const context = useContext(WishlistContext)
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider')
    }
    return context
}

"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export interface CartItem {
    id: string
    title: string
    description: string
    price: number
    quantity: number
    image?: string
    format: "digital" | "print"
}

interface CartContextType {
    items: CartItem[]
    isOpen: boolean
    addToCart: (item: CartItem) => void
    removeFromCart: (itemId: string) => void
    updateQuantity: (itemId: string, quantity: number) => void
    toggleCart: () => void
    clearCart: () => void
    total: number
    itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from local storage
    useEffect(() => {
        const savedCart = localStorage.getItem("storymagic_cart")
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart))
            } catch (e) {
                console.error("Failed to parse cart", e)
            }
        }
        setIsLoaded(true)
    }, [])

    // Save to local storage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("storymagic_cart", JSON.stringify(items))
        }
    }, [items, isLoaded])

    const addToCart = (newItem: CartItem) => {
        setItems(prev => {
            const existing = prev.find(item => item.id === newItem.id)
            if (existing) {
                return prev.map(item =>
                    item.id === newItem.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { ...newItem, quantity: 1 }]
        })
        setIsOpen(true)
    }

    const removeFromCart = (itemId: string) => {
        setItems(prev => prev.filter(item => item.id !== itemId))
    }

    const updateQuantity = (itemId: string, quantity: number) => {
        if (quantity < 1) {
            removeFromCart(itemId)
            return
        }
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, quantity } : item
        ))
    }

    const toggleCart = () => setIsOpen(prev => !prev)
    const clearCart = () => setItems([])

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    return (
        <CartContext.Provider value={{
            items,
            isOpen,
            addToCart,
            removeFromCart,
            updateQuantity,
            toggleCart,
            clearCart,
            total,
            itemCount
        }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}

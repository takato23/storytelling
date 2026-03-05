"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart } from "lucide-react"
import { useWishlist } from "@/lib/contexts/WishlistContext"

interface WishlistButtonProps {
    item: {
        id: string
        slug: string
        title: string
        coverImage: string
        price: string
    }
    size?: "sm" | "md" | "lg"
    className?: string
    showLabel?: boolean
}

export function WishlistButton({
    item,
    size = "md",
    className = "",
    showLabel = false
}: WishlistButtonProps) {
    const { isInWishlist, toggleWishlist } = useWishlist()
    const isWished = isInWishlist(item.id)

    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-10 h-10",
        lg: "w-12 h-12"
    }

    const iconSizes = {
        sm: "w-4 h-4",
        md: "w-5 h-5",
        lg: "w-6 h-6"
    }

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        toggleWishlist(item)
    }

    return (
        <motion.button
            onClick={handleClick}
            className={`
                ${sizeClasses[size]} 
                rounded-full 
                flex items-center justify-center gap-2
                transition-all duration-300
                ${isWished
                    ? 'bg-coral-500 text-white shadow-lg shadow-coral-500/30'
                    : 'bg-white/90 backdrop-blur-sm text-charcoal-400 hover:text-coral-500 hover:bg-white shadow-md'
                }
                ${showLabel ? 'px-4 w-auto' : ''}
                ${className}
            `}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={isWished ? 'filled' : 'empty'}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                    <Heart
                        className={`${iconSizes[size]} ${isWished ? 'fill-current' : ''}`}
                    />
                </motion.div>
            </AnimatePresence>
            {showLabel && (
                <span className="text-sm font-medium">
                    {isWished ? 'Guardado' : 'Guardar'}
                </span>
            )}
        </motion.button>
    )
}

export default WishlistButton

"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Heart, Trash2, ShoppingCart, Gift, Share2 } from "lucide-react"
import { useWishlist } from "@/lib/contexts/WishlistContext"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

interface WishlistDrawerProps {
    isOpen: boolean
    onClose: () => void
}

export function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
    const { items, removeFromWishlist, clearWishlist, itemCount } = useWishlist()

    const handleShare = async () => {
        const itemList = items.map(item => `• ${item.title}`).join('\n')
        const text = `Mi lista de deseos de StoryMagic 📚✨\n\n${itemList}\n\n¡Estos son los cuentos que quiero para mi pequeño! 💝`

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Mi Wishlist de StoryMagic', text })
            } catch (error) {
                console.log('Error sharing:', error)
            }
        } else {
            navigator.clipboard.writeText(text)
            alert('¡Lista copiada al portapapeles!')
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[70] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-charcoal-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-400 to-rose-500 flex items-center justify-center">
                                    <Heart className="w-5 h-5 text-white fill-current" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-charcoal-900">Mi Lista de Deseos</h2>
                                    <p className="text-sm text-charcoal-500">{itemCount} {itemCount === 1 ? 'cuento guardado' : 'cuentos guardados'}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-charcoal-100 hover:bg-charcoal-200 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-charcoal-600" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                    <div className="w-24 h-24 rounded-full bg-charcoal-50 flex items-center justify-center mb-6">
                                        <Heart className="w-12 h-12 text-charcoal-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-charcoal-900 mb-2">
                                        Tu lista está vacía
                                    </h3>
                                    <p className="text-charcoal-500 mb-6 max-w-xs">
                                        Explora nuestros cuentos y guarda tus favoritos tocando el corazón ❤️
                                    </p>
                                    <Link href="/nuestros-libros" onClick={onClose}>
                                        <Button className="rounded-full bg-gradient-to-r from-coral-500 to-rose-500">
                                            Explorar cuentos
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="p-4 space-y-4">
                                    {items.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="flex gap-4 p-4 bg-cream-50 rounded-2xl group relative"
                                        >
                                            {/* Cover image */}
                                            <div className="relative w-20 h-28 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                                                <Image
                                                    src={item.coverImage}
                                                    alt={item.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-charcoal-900 mb-1 truncate pr-8">
                                                    {item.title}
                                                </h4>
                                                <p className="text-lg font-bold text-coral-500 mb-3">
                                                    {item.price}
                                                </p>
                                                <Link href={`/crear?story=${item.slug}`} onClick={onClose}>
                                                    <Button size="sm" className="rounded-full bg-indigo-950 hover:bg-black text-xs px-4">
                                                        <ShoppingCart className="w-3 h-3 mr-1" />
                                                        Personalizar
                                                    </Button>
                                                </Link>
                                            </div>

                                            {/* Remove button */}
                                            <button
                                                onClick={() => removeFromWishlist(item.id)}
                                                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-charcoal-400 hover:text-coral-500 hover:bg-coral-50 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 border-t border-charcoal-100 bg-gradient-to-t from-charcoal-50 to-white">
                                <div className="flex gap-3 mb-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1 rounded-full border-2"
                                        onClick={handleShare}
                                    >
                                        <Gift className="w-4 h-4 mr-2" />
                                        Compartir lista
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="text-charcoal-400 hover:text-coral-500"
                                        onClick={clearWishlist}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                                <p className="text-xs text-center text-charcoal-400">
                                    💡 Comparte tu lista con familiares para que sepan qué regalarte
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

export default WishlistDrawer

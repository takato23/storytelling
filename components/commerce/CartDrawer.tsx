"use client"

import { useCart } from "@/lib/contexts/CartContext"
import { motion, AnimatePresence } from "framer-motion"
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function CartDrawer() {
    const { items, isOpen, toggleCart, updateQuantity, removeFromCart, total } = useCart()
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [checkoutError, setCheckoutError] = useState<string | null>(null)
    const router = useRouter()

    const handleCheckout = async () => {
        if (items.length === 0) return

        setIsCheckingOut(true)
        setCheckoutError(null)

        try {
            const quoteResponse = await fetch("/api/orders/quote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items })
            })

            if (quoteResponse.status === 401) {
                const nextPath = `${window.location.pathname}${window.location.search}`
                router.push(`/login?next=${encodeURIComponent(nextPath)}`)
                return
            }

            const quotePayload = await quoteResponse.json()
            if (!quoteResponse.ok) {
                throw new Error(quotePayload.error ?? "No se pudo calcular el total.")
            }

            const quote = quotePayload.quote ?? quotePayload
            if (!quote || !Array.isArray(quote.items)) {
                throw new Error("Respuesta inválida al calcular cotización.")
            }

            const checkoutResponse = await fetch("/api/checkout/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: quote.items.map((item: {
                        id: string
                        title: string
                        description: string
                        unitPrice: number
                        quantity: number
                        format: "digital" | "print"
                        image?: string
                    }) => ({
                        id: item.id,
                        title: item.title,
                        description: item.description,
                        price: item.unitPrice,
                        quantity: item.quantity,
                        format: item.format,
                        image: item.image
                    }))
                })
            })

            if (checkoutResponse.status === 401) {
                const nextPath = `${window.location.pathname}${window.location.search}`
                router.push(`/login?next=${encodeURIComponent(nextPath)}`)
                return
            }

            const checkoutPayload = await checkoutResponse.json()
            if (!checkoutResponse.ok) {
                throw new Error(checkoutPayload.error ?? "No se pudo iniciar el checkout.")
            }

            if (!checkoutPayload.url) {
                throw new Error("El checkout no devolvió una URL válida.")
            }

            window.location.href = checkoutPayload.url
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error al iniciar checkout."
            setCheckoutError(message)
        } finally {
            setIsCheckingOut(false)
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
                        onClick={toggleCart}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-indigo-50"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-indigo-50 flex items-center justify-between bg-white z-10">
                            <h2 className="text-xl font-bold font-serif text-charcoal-900 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-indigo-600" />
                                Tu Magia
                                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {items.length}
                                </span>
                            </h2>
                            <button
                                onClick={toggleCart}
                                className="p-2 hover:bg-charcoal-50 rounded-full transition-colors text-charcoal-400 hover:text-charcoal-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 text-charcoal-400">
                                    <ShoppingBag className="w-16 h-16 opacity-20" />
                                    <p>Tu carrito está vacío</p>
                                    <button
                                        onClick={toggleCart}
                                        className="text-indigo-600 font-bold hover:underline"
                                    >
                                        Explorar libros
                                    </button>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <motion.div
                                        layout
                                        key={item.id}
                                        className="flex gap-4 p-4 rounded-xl bg-charcoal-50/50 border border-charcoal-100"
                                    >
                                        {/* Image */}
                                        <div className="w-20 h-24 bg-white rounded-lg shadow-sm border border-charcoal-100 flex-shrink-0 relative overflow-hidden">
                                            {item.image ? (
                                                <Image src={item.image} alt={item.title} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-indigo-50 text-indigo-200">
                                                    <ShoppingBag className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 flex flex-col">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-charcoal-800 line-clamp-1">{item.title}</h3>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-charcoal-300 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-sm text-charcoal-500 mb-auto line-clamp-1">{item.description}</p>

                                            <div className="flex items-center justify-between mt-3">
                                                <div className="flex items-center gap-3 bg-white border border-charcoal-200 rounded-lg p-1">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-charcoal-50 text-charcoal-500"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-charcoal-50 text-charcoal-500"
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <span className="font-bold text-indigo-900">
                                                    ${(item.price * item.quantity).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 border-t border-indigo-50 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-charcoal-600">
                                        <span>Subtotal</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-xl text-charcoal-900">
                                        <span>Total</span>
                                        <span>${total.toFixed(2)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    disabled={isCheckingOut}
                                    className="w-full py-4 bg-indigo-950 text-white rounded-xl font-bold text-lg hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 disabled:opacity-70 disabled:cursor-not-allowed group"
                                >
                                    {isCheckingOut ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            Checkout Seguro
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                                {checkoutError && (
                                    <p className="mt-3 text-sm text-red-600">
                                        {checkoutError}
                                    </p>
                                )}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

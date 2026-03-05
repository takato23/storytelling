"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, X, BookOpen, ShoppingCart, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface BookPage {
    image: string
    text?: string
}

interface BookPreviewProps {
    isOpen: boolean
    onClose: () => void
    bookTitle: string
    bookCover: string
    pages: BookPage[]
    price: string
    slug: string
}

export function BookPreview({
    isOpen,
    onClose,
    bookTitle,
    bookCover,
    pages,
    price,
    slug
}: BookPreviewProps) {
    const [currentPage, setCurrentPage] = useState(0)
    const [direction, setDirection] = useState(0)

    // Include cover as first "page"
    const allPages = [
        { image: bookCover, text: undefined },
        ...pages.slice(0, 4) // Only show first 4 pages as preview
    ]

    const goToPage = (newPage: number) => {
        if (newPage >= 0 && newPage < allPages.length) {
            setDirection(newPage > currentPage ? 1 : -1)
            setCurrentPage(newPage)
        }
    }

    const nextPage = () => goToPage(currentPage + 1)
    const prevPage = () => goToPage(currentPage - 1)

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-4xl bg-gradient-to-br from-cream-50 to-white rounded-3xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-charcoal-100 bg-white/80 backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                                <Eye className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-charcoal-900">{bookTitle}</h3>
                                <p className="text-xs text-charcoal-500">Vista previa • {allPages.length} páginas de muestra</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-charcoal-100 hover:bg-charcoal-200 flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5 text-charcoal-600" />
                        </button>
                    </div>

                    {/* Book Preview Area */}
                    <div className="relative aspect-[16/10] bg-gradient-to-br from-charcoal-800 to-charcoal-900 overflow-hidden">
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-5">
                            <div className="absolute inset-0" style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                            }} />
                        </div>

                        {/* Page Display */}
                        <div className="absolute inset-0 flex items-center justify-center p-8">
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={currentPage}
                                    custom={direction}
                                    initial={{
                                        rotateY: direction > 0 ? 90 : -90,
                                        opacity: 0
                                    }}
                                    animate={{
                                        rotateY: 0,
                                        opacity: 1
                                    }}
                                    exit={{
                                        rotateY: direction > 0 ? -90 : 90,
                                        opacity: 0
                                    }}
                                    transition={{ duration: 0.4 }}
                                    className="relative w-full max-w-md aspect-[3/4] rounded-lg overflow-hidden shadow-2xl"
                                    style={{ perspective: 1000 }}
                                >
                                    {/* Page content */}
                                    <div className="absolute inset-0 bg-white">
                                        <img
                                            src={allPages[currentPage].image}
                                            alt={`Página ${currentPage}`}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Text overlay if present */}
                                        {allPages[currentPage].text && (
                                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
                                                <p className="text-white text-lg font-serif leading-relaxed">
                                                    {allPages[currentPage].text}
                                                </p>
                                            </div>
                                        )}

                                        {/* Cover badge */}
                                        {currentPage === 0 && (
                                            <div className="absolute top-4 left-4">
                                                <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                                                    Portada
                                                </span>
                                            </div>
                                        )}

                                        {/* Preview watermark */}
                                        {currentPage > 0 && (
                                            <div className="absolute top-4 right-4">
                                                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-charcoal-600 text-xs font-bold rounded-full shadow-sm">
                                                    Vista Previa
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Page edge effect */}
                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-r from-charcoal-200 to-charcoal-300" />
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Navigation arrows */}
                        <button
                            onClick={prevPage}
                            disabled={currentPage === 0}
                            className={`absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center transition-all ${currentPage === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white hover:scale-110'
                                }`}
                        >
                            <ChevronLeft className="w-6 h-6 text-charcoal-700" />
                        </button>

                        <button
                            onClick={nextPage}
                            disabled={currentPage === allPages.length - 1}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center transition-all ${currentPage === allPages.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white hover:scale-110'
                                }`}
                        >
                            <ChevronRight className="w-6 h-6 text-charcoal-700" />
                        </button>

                        {/* Page indicator */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                            {allPages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToPage(index)}
                                    className={`h-2 rounded-full transition-all ${index === currentPage
                                            ? 'w-8 bg-white'
                                            : 'w-2 bg-white/40 hover:bg-white/60'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Footer with CTA */}
                    <div className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-t border-purple-100">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <p className="text-sm text-charcoal-500 mb-1">
                                    ¿Te gustó lo que viste? ¡Personalízalo con tu pequeño!
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-charcoal-900">{price}</span>
                                    <span className="text-sm text-charcoal-400">/ libro personalizado</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="rounded-full border-2 border-charcoal-200"
                                    onClick={onClose}
                                >
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    Seguir viendo
                                </Button>
                                <Link href={`/crear?story=${slug}`}>
                                    <Button className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-500/25">
                                        <ShoppingCart className="w-4 h-4 mr-2" />
                                        Crear mi libro
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

// Hook para manejar la vista previa
export function useBookPreview() {
    const [previewState, setPreviewState] = useState<{
        isOpen: boolean
        bookData: {
            title: string
            cover: string
            pages: BookPage[]
            price: string
            slug: string
        } | null
    }>({
        isOpen: false,
        bookData: null
    })

    const openPreview = (bookData: {
        title: string
        cover: string
        pages: BookPage[]
        price: string
        slug: string
    }) => {
        setPreviewState({ isOpen: true, bookData })
    }

    const closePreview = () => {
        setPreviewState({ isOpen: false, bookData: null })
    }

    return { previewState, openPreview, closePreview }
}

export default BookPreview

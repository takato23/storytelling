"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { BookOpen, Eye, X } from "lucide-react"
import * as Dialog from "@radix-ui/react-dialog"

interface CreatedBook {
    id: string
    title: string
    childName: string
    style: string
    coverImage: string
    color: string
}

const CREATED_BOOKS: CreatedBook[] = [
    { id: "1", title: "El Explorador Espacial", childName: "Lucas", style: "pixar", coverImage: "/stories/space-1.jpg", color: "#4F46E5" },
    { id: "2", title: "El Reino del Bosque Mágico", childName: "Sofía", style: "watercolor", coverImage: "/stories/forest-1.jpg", color: "#EC4899" },
    { id: "3", title: "El Domador de Dinosaurios", childName: "Mateo", style: "cartoon", coverImage: "/stories/dino-1.jpg", color: "#F59E0B" },
    { id: "4", title: "La Estrella del Fútbol", childName: "Emma", style: "vector", coverImage: "/stories/soccer-1.jpg", color: "#10B981" },
    { id: "5", title: "El Explorador Espacial", childName: "Valentina", style: "pixar", coverImage: "/stories/space-1.jpg", color: "#4F46E5" },
    { id: "6", title: "El Reino del Bosque Mágico", childName: "Martín", style: "watercolor", coverImage: "/stories/forest-1.jpg", color: "#EC4899" },
    { id: "7", title: "El Domador de Dinosaurios", childName: "Isabella", style: "cartoon", coverImage: "/stories/dino-1.jpg", color: "#F59E0B" },
    { id: "8", title: "La Estrella del Fútbol", childName: "Diego", style: "vector", coverImage: "/stories/soccer-1.jpg", color: "#10B981" },
]

interface CreatedBooksGalleryProps {
    className?: string
}

export function CreatedBooksGallery({ className = "" }: CreatedBooksGalleryProps) {
    const [selectedBook, setSelectedBook] = useState<CreatedBook | null>(null)

    return (
        <section className={`py-24 bg-white ${className}`}>
            <div className="container mx-auto px-6">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-coral-100 text-coral-700 text-sm font-medium mb-4">
                        <BookOpen className="w-4 h-4" />
                        Galería
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-charcoal-900 mb-4">
                        Cuentos <span className="text-coral-500">creados</span> por familias
                    </h2>
                    <p className="text-charcoal-600 text-lg max-w-2xl mx-auto">
                        Cada libro es único, personalizado y lleno de magia
                    </p>
                </motion.div>

                {/* Masonry grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {CREATED_BOOKS.map((book, index) => (
                        <motion.div
                            key={book.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ y: -8 }}
                            className="cursor-pointer"
                            onClick={() => setSelectedBook(book)}
                        >
                            <div
                                className="relative rounded-2xl overflow-hidden shadow-lg group"
                                style={{ aspectRatio: "3/4" }}
                            >
                                {/* Book cover background */}
                                <div
                                    className="absolute inset-0"
                                    style={{ backgroundColor: book.color }}
                                />

                                {/* White border effect */}
                                <div className="absolute inset-2 bg-white/10 rounded-xl" />
                                <div className="absolute inset-3 bg-white/90 rounded-lg" />

                                {/* Content */}
                                <div className="absolute inset-4 flex flex-col items-center justify-center text-center p-2">
                                    <div className="w-24 h-32 mx-auto mb-3 shadow-md rotate-3 transition-transform group-hover:rotate-0">
                                        <img
                                            src={book.coverImage}
                                            alt={book.title}
                                            className="w-full h-full object-cover rounded-md"
                                        />
                                    </div>
                                    <h3 className="text-xs md:text-sm font-bold text-charcoal-800 leading-tight mb-1">
                                        {book.title}
                                    </h3>
                                    <p className="text-xs text-charcoal-500">
                                        para {book.childName}
                                    </p>
                                </div>

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="flex items-center gap-1 px-3 py-2 bg-white rounded-full text-sm font-medium text-charcoal-800">
                                        <Eye className="w-4 h-4" />
                                        Ver más
                                    </div>
                                </div>

                                {/* Style badge */}
                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-white/90 rounded-full text-xs font-medium text-charcoal-600 capitalize">
                                    {book.style}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Dialog for book preview */}
                <Dialog.Root open={!!selectedBook} onOpenChange={() => setSelectedBook(null)}>
                    <Dialog.Portal>
                        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
                        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-8 max-w-md w-full mx-4 z-50 shadow-2xl">
                            {selectedBook && (
                                <>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <Dialog.Title className="text-2xl font-bold text-charcoal-900">
                                                {selectedBook.title}
                                            </Dialog.Title>
                                            <Dialog.Description className="text-charcoal-600">
                                                Un cuento mágico para {selectedBook.childName}
                                            </Dialog.Description>
                                        </div>
                                        <Dialog.Close className="p-2 hover:bg-charcoal-100 rounded-full transition-colors">
                                            <X className="w-5 h-5 text-charcoal-500" />
                                        </Dialog.Close>
                                    </div>

                                    {/* Book preview */}
                                    <div
                                        className="rounded-2xl p-8 text-center mb-6 flex flex-col items-center"
                                        style={{ backgroundColor: selectedBook.color }}
                                    >
                                        <img
                                            src={selectedBook.coverImage}
                                            alt={selectedBook.title}
                                            className="w-48 h-64 object-cover rounded-lg shadow-2xl mb-6 transform hover:scale-105 transition-transform"
                                        />
                                        <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm capitalize">
                                            Estilo {selectedBook.style}
                                        </span>
                                    </div>

                                    {/* CTA */}
                                    <motion.button
                                        className="w-full py-4 bg-coral-500 hover:bg-coral-600 text-white rounded-xl font-semibold transition-colors"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Crear mi propio cuento
                                    </motion.button>
                                </>
                            )}
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>

                {/* CTA */}
                <motion.div
                    className="mt-16 text-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <p className="text-charcoal-600 mb-4">
                        ¿Listo para crear el tuyo?
                    </p>
                    <motion.button
                        className="px-8 py-4 bg-coral-500 hover:bg-coral-600 text-white rounded-full font-semibold text-lg shadow-lg shadow-coral-500/25 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Empezar ahora
                    </motion.button>
                </motion.div>
            </div>
        </section>
    )
}

export default CreatedBooksGallery

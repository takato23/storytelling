"use client"

import React, { useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Download, Share2, X, Award, Sparkles, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HeroCertificateProps {
    isOpen: boolean
    onClose: () => void
    childName: string
    storyTitle: string
    completionDate?: Date
    storyImage?: string
}

export function HeroCertificate({
    isOpen,
    onClose,
    childName,
    storyTitle,
    completionDate = new Date(),
    storyImage
}: HeroCertificateProps) {
    const certificateRef = useRef<HTMLDivElement>(null)
    const [isDownloading, setIsDownloading] = useState(false)

    const formattedDate = completionDate.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })

    const handleDownload = async () => {
        setIsDownloading(true)

        try {
            // Dynamic import html2canvas only when needed
            const html2canvas = (await import('html2canvas')).default

            if (certificateRef.current) {
                const canvas = await html2canvas(certificateRef.current, {
                    scale: 2,
                    backgroundColor: null,
                    logging: false
                })

                const link = document.createElement('a')
                link.download = `certificado-${childName.toLowerCase().replace(/\s+/g, '-')}.png`
                link.href = canvas.toDataURL('image/png')
                link.click()
            }
        } catch (error) {
            console.error('Error generating certificate:', error)
            // Fallback: could show an alert or just print
            window.print()
        } finally {
            setIsDownloading(false)
        }
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `¡${childName} completó una aventura!`,
                    text: `${childName} terminó de leer "${storyTitle}" y recibió su Certificado de Héroe. 🏆✨`,
                    url: window.location.href
                })
            } catch (error) {
                console.log('Error sharing:', error)
            }
        } else {
            // Fallback: copy to clipboard
            const text = `¡${childName} completó la aventura "${storyTitle}"! 🏆✨ #StoryMagic`
            navigator.clipboard.writeText(text)
            alert('¡Texto copiado al portapapeles!')
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, rotateX: -15 }}
                    animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 200 }}
                    className="relative w-full max-w-2xl my-8"
                    onClick={(e) => e.stopPropagation()}
                    style={{ perspective: 1000 }}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute -top-3 -right-3 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-charcoal-50 transition-colors"
                    >
                        <X className="w-5 h-5 text-charcoal-600" />
                    </button>

                    {/* Certificate */}
                    <div
                        ref={certificateRef}
                        className="relative bg-gradient-to-br from-amber-50 via-cream-50 to-orange-50 rounded-3xl overflow-hidden shadow-2xl"
                    >
                        {/* Decorative background elements */}
                        <div className="absolute inset-0 overflow-hidden">
                            {/* Stars pattern */}
                            <div className="absolute top-4 left-4 text-4xl opacity-20 animate-pulse">✨</div>
                            <div className="absolute top-8 right-12 text-3xl opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }}>⭐</div>
                            <div className="absolute bottom-12 left-8 text-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}>🌟</div>
                            <div className="absolute bottom-8 right-4 text-4xl opacity-20 animate-pulse" style={{ animationDelay: '0.3s' }}>✨</div>

                            {/* Gradient orbs */}
                            <div className="absolute -top-20 -left-20 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl" />
                            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl" />
                        </div>

                        {/* Border */}
                        <div className="absolute inset-4 border-4 border-double border-amber-400/50 rounded-2xl pointer-events-none" />
                        <div className="absolute inset-6 border-2 border-amber-300/30 rounded-xl pointer-events-none" />

                        {/* Content */}
                        <div className="relative p-8 md:p-12 text-center">
                            {/* Top decoration */}
                            <div className="flex justify-center mb-4">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                        <Award className="w-10 h-10 text-white" />
                                    </div>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                        className="absolute -inset-2 border-2 border-dashed border-amber-400/40 rounded-full"
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="text-lg md:text-xl font-medium text-amber-700 uppercase tracking-[0.3em] mb-2">
                                Certificado
                            </h2>
                            <h1 className="text-3xl md:text-4xl font-serif font-bold text-charcoal-900 mb-1">
                                de Héroe
                            </h1>

                            {/* Decorative line */}
                            <div className="flex items-center justify-center gap-4 my-6">
                                <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400" />
                                <Sparkles className="w-5 h-5 text-amber-500" />
                                <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400" />
                            </div>

                            {/* Body text */}
                            <p className="text-charcoal-600 text-lg mb-2">
                                Este diploma certifica que
                            </p>

                            {/* Child name */}
                            <div className="relative inline-block my-4">
                                <h3 className="text-4xl md:text-5xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-coral-500 to-amber-500 px-8 py-2">
                                    {childName}
                                </h3>
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full" />
                            </div>

                            <p className="text-charcoal-600 text-lg mt-4 mb-2">
                                ha completado exitosamente la aventura
                            </p>

                            {/* Story title */}
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl py-3 px-6 inline-block mb-6 border border-amber-200/50">
                                <p className="text-xl md:text-2xl font-serif font-bold text-charcoal-800 flex items-center gap-2">
                                    <span>📖</span>
                                    "{storyTitle}"
                                </p>
                            </div>

                            {/* Virtues */}
                            <div className="flex flex-wrap justify-center gap-3 mb-6">
                                {['Valentía', 'Imaginación', 'Curiosidad'].map((virtue, i) => (
                                    <span
                                        key={virtue}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-full text-sm font-bold flex items-center gap-1"
                                    >
                                        <Star className="w-3 h-3 fill-current" />
                                        {virtue}
                                    </span>
                                ))}
                            </div>

                            {/* Date and signature */}
                            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-8 pt-6 border-t border-amber-200/50">
                                <div className="text-center">
                                    <p className="text-sm text-charcoal-400 mb-1">Fecha de logro</p>
                                    <p className="font-serif font-bold text-charcoal-700">{formattedDate}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm text-charcoal-400 mb-1">Otorgado por</p>
                                    <p className="font-serif font-bold text-charcoal-700 flex items-center gap-2">
                                        <span className="text-xl">🦉</span>
                                        Magi & StoryMagic
                                    </p>
                                </div>
                            </div>

                            {/* Seal */}
                            <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center shadow-lg opacity-80">
                                    <div className="text-white text-center">
                                        <div className="text-2xl">🏆</div>
                                        <div className="text-[8px] font-bold uppercase tracking-wider">Héroe</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-center gap-4 mt-6">
                        <Button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25 px-6"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            {isDownloading ? 'Generando...' : 'Descargar'}
                        </Button>
                        <Button
                            onClick={handleShare}
                            variant="outline"
                            className="rounded-full border-2 border-white/50 text-white hover:bg-white/10 px-6"
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            Compartir
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

// Hook para manejar certificados
export function useHeroCertificate() {
    const [certificateState, setCertificateState] = useState<{
        isOpen: boolean
        data: {
            childName: string
            storyTitle: string
            completionDate?: Date
            storyImage?: string
        } | null
    }>({
        isOpen: false,
        data: null
    })

    const showCertificate = (data: {
        childName: string
        storyTitle: string
        completionDate?: Date
        storyImage?: string
    }) => {
        setCertificateState({ isOpen: true, data })
    }

    const closeCertificate = () => {
        setCertificateState({ isOpen: false, data: null })
    }

    return { certificateState, showCertificate, closeCertificate }
}

export default HeroCertificate

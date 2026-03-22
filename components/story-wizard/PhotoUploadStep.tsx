"use client"

import React, { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Upload, X, Check, Sparkles, Camera } from "lucide-react"

interface PhotoUploadStepProps {
    image: File | null
    onImageSelect: (file: File | null) => void
    childFeatures: Record<string, unknown> | null
    isAnalyzing: boolean
}

export function PhotoUploadStep({
    image,
    onImageSelect,
    childFeatures,
    isAnalyzing
}: PhotoUploadStepProps) {
    const [isDragging, setIsDragging] = useState(false)
    const previewUrl = useMemo(() => (image ? URL.createObjectURL(image) : null), [image])

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
    }, [previewUrl])

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith("image/")) {
            onImageSelect(file)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            onImageSelect(file)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--play-primary)] mb-3">Paso 1 de 4</p>
                <h2 className="play-title text-3xl md:text-4xl mb-3">
                    Sube la foto de tu pequeño héroe
                </h2>
                <p className="play-copy max-w-2xl mx-auto">
                    Asegúrate de que el rostro se vea claramente para lograr una mejor personalización.
                </p>
            </motion.div>

            {previewUrl ? (
                <motion.div
                    className="relative rounded-[32px] overflow-hidden aspect-square max-w-md mx-auto wizard-liquid-panel p-2.5"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-[24px]"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button
                            onClick={() => onImageSelect(null)}
                            className="p-5 bg-white/25 hover:bg-red-500 text-white rounded-full transition-all border border-white/30 backdrop-blur-md shadow-lg transform hover:scale-110"
                        >
                            <X className="w-8 h-8" />
                        </button>
                    </div>
                    <div className="absolute bottom-6 left-6 right-6">
                        <div className={`px-5 py-4 rounded-2xl text-sm font-semibold flex items-center gap-3 justify-center shadow-xl transition-all backdrop-blur-md border ${isAnalyzing ? "bg-indigo-50/90 border-indigo-200 text-indigo-800" : "bg-emerald-500/88 border-emerald-300 text-white"}`}>
                            {isAnalyzing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                    <span>Analizando rasgos mágicos...</span>
                                </>
                            ) : childFeatures ? (
                                <>
                                    <div className="bg-white/20 p-1 rounded-full">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span>¡Rasgos detectados!</span>
                                </>
                            ) : (
                                <>
                                    <div className="bg-white/20 p-1 rounded-full">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <span>¡Foto lista!</span>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    className={`relative border-2 border-dashed rounded-[36px] p-10 md:p-12 text-center transition-all cursor-pointer overflow-hidden group wizard-liquid-soft ${isDragging
                        ? "border-indigo-500/70 bg-indigo-50/80 scale-[1.015] shadow-[0_28px_50px_-30px_rgba(79,70,229,0.7)]"
                        : "border-indigo-200/70 hover:border-indigo-400/70 hover:bg-white/70 hover:shadow-[0_24px_45px_-30px_rgba(79,70,229,0.55)]"
                        }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                    />

                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-cyan-400/10 pointer-events-none" />

                    <motion.div
                        className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-6 rounded-[2rem] bg-gradient-to-br from-white to-indigo-50 border border-indigo-100/70 flex items-center justify-center relative z-10 shadow-[0_16px_30px_-20px_rgba(79,70,229,0.6)] group-hover:scale-110 transition-transform duration-300"
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Upload className="w-12 h-12 text-indigo-600 group-hover:text-indigo-700 transition-colors" />
                    </motion.div>

                    <h3 className="text-2xl md:text-3xl font-semibold text-indigo-950 mb-3 relative z-10 font-serif">
                        Arrastra una foto aquí
                    </h3>
                    <p className="text-charcoal-600 mb-7 relative z-10 text-base md:text-lg">
                        o haz clic para seleccionar de tu galería
                    </p>

                    <div className="wizard-liquid-pill inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold text-indigo-700 relative z-10 group-hover:shadow-md transition-all">
                        <Camera className="w-4 h-4" />
                        PNG, JPG hasta 10MB
                    </div>
                </motion.div>
            )}
            {/* Tips */}
            <motion.div
                className="mt-8 p-6 rounded-3xl wizard-liquid-soft"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <h4 className="font-bold text-indigo-900 mb-4 flex items-center gap-2.5 text-sm uppercase tracking-wide">
                    <Sparkles className="w-4 h-4" />
                    Consejos mágicos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        "Rostro de frente",
                        "Buena iluminación",
                        "Sin filtros ni gafas oscuras"
                    ].map((tip, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm font-medium text-charcoal-700 bg-white/55 p-3 rounded-xl border border-white/65">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            {tip}
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}

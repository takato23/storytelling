"use client"

import React, { useCallback, useState } from "react"
import { Upload, X, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
    onImageSelect: (file: File | null) => void
    selectedImage: File | null
    className?: string
}

export function ImageUpload({ onImageSelect, selectedImage, className }: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setIsDragging(false)
            const file = e.dataTransfer.files[0]
            if (file && file.type.startsWith("image/")) {
                onImageSelect(file)
                const url = URL.createObjectURL(file)
                setPreviewUrl(url)
            }
        },
        [onImageSelect]
    )

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (file) {
                onImageSelect(file)
                const url = URL.createObjectURL(file)
                setPreviewUrl(url)
            }
        },
        [onImageSelect]
    )

    const clearImage = useCallback(() => {
        onImageSelect(null)
        setPreviewUrl(null)
    }, [onImageSelect])

    return (
        <div className={cn("w-full max-w-md mx-auto", className)}>
            {selectedImage && previewUrl ? (
                <div className="relative rounded-xl overflow-hidden shadow-lg border-2 border-primary/20 bg-background aspect-square group">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                            onClick={clearImage}
                            className="p-3 bg-red-500/90 text-white rounded-full hover:bg-red-600 transition-transform hover:scale-110"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                        "relative border-3 border-dashed rounded-xl aspect-[4/3] flex flex-col items-center justify-center p-6 text-center transition-all duration-300 cursor-pointer",
                        isDragging
                            ? "border-primary bg-primary/5 scale-[1.02]"
                            : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                    )}
                >
                    <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleFileInput}
                    />
                    <div className="bg-primary/10 p-4 rounded-full mb-4">
                        <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Upload your child's photo
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 max-w-xs">
                        Drag & drop or click to choose. Ensure face is clearly visible.
                    </p>
                    <div className="flex gap-2 justify-center">
                        <div className="w-2 h-2 rounded-full bg-gray-200" />
                        <div className="w-2 h-2 rounded-full bg-gray-200" />
                        <div className="w-2 h-2 rounded-full bg-gray-200" />
                    </div>
                </div>
            )}
        </div>
    )
}

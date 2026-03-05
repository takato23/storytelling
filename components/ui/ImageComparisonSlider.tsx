"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"

interface ImageComparisonSliderProps {
    beforeImage: string
    afterImage: string
    beforeLabel?: string
    afterLabel?: string
    className?: string
}

export function ImageComparisonSlider({
    beforeImage,
    afterImage,
    beforeLabel = "Original",
    afterLabel = "Magia IA",
    className = ""
}: ImageComparisonSliderProps) {
    const [sliderPosition, setSliderPosition] = useState(50)
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleMove = useCallback((clientX: number) => {
        if (!containerRef.current) return
        const containerRect = containerRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(clientX - containerRect.left, containerRect.width))
        const percent = Math.max(0, Math.min((x / containerRect.width) * 100, 100))
        setSliderPosition(percent)
    }, [])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return
        handleMove(e.clientX)
    }, [isDragging, handleMove])

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (!isDragging) return
        handleMove(e.touches[0].clientX)
    }, [isDragging, handleMove])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove)
        window.addEventListener("mouseup", handleMouseUp)
        window.addEventListener("touchmove", handleTouchMove)
        window.addEventListener("touchend", handleMouseUp)

        return () => {
            window.removeEventListener("mousemove", handleMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
            window.removeEventListener("touchmove", handleTouchMove)
            window.removeEventListener("touchend", handleMouseUp)
        }
    }, [handleMouseMove, handleMouseUp, handleTouchMove])

    return (
        <div
            ref={containerRef}
            className={`relative w-full aspect-square md:aspect-[4/3] rounded-[2rem] overflow-hidden cursor-ew-resize select-none bg-charcoal-50 shadow-2xl border-[6px] border-white ${className}`}
            onMouseDown={(e) => {
                setIsDragging(true)
                handleMove(e.clientX)
            }}
            onTouchStart={(e) => {
                setIsDragging(true)
                handleMove(e.touches[0].clientX)
            }}
        >
            {/* After Image (Background) */}
            <div className="absolute inset-0 w-full h-full">
                <img src={afterImage} alt={afterLabel} className="w-full h-full object-cover" draggable={false} />
            </div>

            {/* Before Image (Foreground/Clipped) */}
            <div
                className="absolute inset-0 h-full w-full object-cover"
                style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
            >
                <img src={beforeImage} alt={beforeLabel} className="w-full h-full object-cover" draggable={false} />
            </div>

            {/* Slider Handle */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-white flex items-center justify-center pointer-events-none"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
                <div className="w-10 h-10 rounded-full bg-white shadow-[0_0_20px_rgba(0,0,0,0.3)] flex items-center justify-center ring-4 ring-white/50">
                    <div className="flex gap-1.5">
                        <div className="w-0.5 h-4 bg-purple-400 rounded-full" />
                        <div className="w-0.5 h-4 bg-purple-400 rounded-full" />
                        <div className="w-0.5 h-4 bg-purple-400 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full text-xs font-bold text-white tracking-widest uppercase pointer-events-none shadow-sm">
                {beforeLabel}
            </div>
            <div className="absolute top-4 right-4 px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg text-white backdrop-blur-md rounded-full text-xs font-bold tracking-widest uppercase pointer-events-none">
                {afterLabel}
            </div>

            {/* Instruction overlay - fades out on drag */}
            <div
                className={`absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-500 ${isDragging ? 'opacity-0' : 'opacity-100'}`}
            >
                <div className="bg-white/90 backdrop-blur-sm text-purple-900 px-6 py-2 rounded-full font-bold text-sm shadow-xl animate-bounce mt-32">
                    Desliza para ver la magia →
                </div>
            </div>
        </div>
    )
}

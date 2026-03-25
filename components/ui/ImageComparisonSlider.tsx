"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"

interface ImageComparisonSliderProps {
    beforeImage: string
    afterImage: string
    beforeLabel?: string
    afterLabel?: string
    className?: string
    instructionText?: string
}

export function ImageComparisonSlider({
    beforeImage,
    afterImage,
    beforeLabel = "Original",
    afterLabel = "Magia IA",
    className = "",
    instructionText = "Deslizá para ver el cambio"
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
            className={`relative w-full aspect-[4/5] overflow-hidden rounded-[2rem] border border-[var(--nido-line)] bg-[var(--nido-paper-strong)] shadow-[0_24px_60px_-40px_rgba(93,84,76,0.36)] cursor-ew-resize select-none touch-pan-y sm:aspect-[5/4] md:aspect-[4/3] ${className}`}
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
                <Image
                    src={afterImage}
                    alt={afterLabel}
                    fill
                    sizes="(min-width: 1024px) 36rem, (min-width: 640px) 80vw, 100vw"
                    className="object-cover"
                    draggable={false}
                />
            </div>

            {/* Before Image (Foreground/Clipped) */}
            <div
                className="absolute inset-0 h-full w-full object-cover"
                style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
            >
                <Image
                    src={beforeImage}
                    alt={beforeLabel}
                    fill
                    sizes="(min-width: 1024px) 36rem, (min-width: 640px) 80vw, 100vw"
                    className="object-cover"
                    draggable={false}
                />
            </div>

            {/* Slider Handle */}
            <div
                className="absolute top-0 bottom-0 flex w-1 items-center justify-center bg-white/90 pointer-events-none"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
            >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-[0_0_20px_rgba(0,0,0,0.16)] ring-4 ring-white/60 sm:h-11 sm:w-11">
                    <div className="flex gap-1.5">
                        <div className="h-4 w-0.5 rounded-full bg-[var(--nido-sage-strong)]" />
                        <div className="h-4 w-0.5 rounded-full bg-[var(--nido-sage-strong)]" />
                        <div className="h-4 w-0.5 rounded-full bg-[var(--nido-sage-strong)]" />
                    </div>
                </div>
            </div>

            {/* Labels */}
            <div className="absolute left-3 top-3 rounded-full bg-white/86 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--nido-ink)] shadow-sm backdrop-blur-md pointer-events-none sm:left-4 sm:top-4 sm:px-4">
                {beforeLabel}
            </div>
            <div className="absolute right-3 top-3 rounded-full bg-[var(--nido-sage-strong)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-lg pointer-events-none sm:right-4 sm:top-4 sm:px-4">
                {afterLabel}
            </div>

            {/* Instruction overlay - fades out on drag */}
            <div
                className={`absolute inset-0 pointer-events-none flex items-center justify-center transition-opacity duration-500 ${isDragging ? 'opacity-0' : 'opacity-100'}`}
            >
                <div className="mt-32 rounded-full bg-white/92 px-5 py-2 text-center text-xs font-bold uppercase tracking-[0.18em] text-[var(--nido-ink)] shadow-xl backdrop-blur-sm sm:text-sm">
                    {instructionText}
                </div>
            </div>
        </div>
    )
}

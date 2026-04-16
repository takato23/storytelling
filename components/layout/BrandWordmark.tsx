"use client"

import React from "react"
import Image from "next/image"

type BrandWordmarkProps = {
    size?: "nav" | "footer" | "hero"
    tagline?: string
    className?: string
}

// Natural aspect ratio of /public/cuento-nido-logo-transparent.png is
// 1982×386 → ~5.135:1. Heights are tuned to roughly match the previous
// text wordmark's visual footprint at each size.
const sizeDimensionMap = {
    nav: { height: 44, width: 226 },
    footer: { height: 52, width: 267 },
    hero: { height: 96, width: 493 },
} as const

export function BrandWordmark({
    size = "nav",
    tagline,
    className = "",
}: BrandWordmarkProps) {
    const { width, height } = sizeDimensionMap[size]

    return (
        <div className={`nido-wordmark-stack ${className}`.trim()}>
            <Image
                src="/cuento-nido-logo-transparent.png"
                alt="cuento.nido"
                width={width}
                height={height}
                priority={size === "nav" || size === "hero"}
                className={`nido-wordmark-image nido-wordmark-image-${size}`}
            />
            {tagline ? <p className="nido-wordmark-tagline">{tagline}</p> : null}
        </div>
    )
}

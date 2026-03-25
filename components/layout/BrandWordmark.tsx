"use client"

import React from "react"

type BrandWordmarkProps = {
    size?: "nav" | "footer" | "hero"
    tagline?: string
    className?: string
}

const sizeClassMap = {
    nav: "nido-wordmark-nav",
    footer: "nido-wordmark-footer",
    hero: "nido-wordmark-hero",
} as const

export function BrandWordmark({
    size = "nav",
    tagline,
    className = "",
}: BrandWordmarkProps) {
    return (
        <div className={`nido-wordmark-stack ${className}`.trim()}>
            <div className={`nido-wordmark ${sizeClassMap[size]}`}>
                <span className="nido-wordmark-script" aria-label="cuento">
                    <span className="text-[var(--nido-sage)]">cue</span>
                    <span className="text-[var(--nido-peach)]">n</span>
                    <span className="text-[var(--nido-rose)]">to</span>
                </span>
                <span className="nido-wordmark-nido">.nido</span>
            </div>
            {tagline ? <p className="nido-wordmark-tagline">{tagline}</p> : null}
        </div>
    )
}

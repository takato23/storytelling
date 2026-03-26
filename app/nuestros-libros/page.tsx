"use client"

import React from "react"
import { Footer } from "@/components/layout/Footer"

import { StoryCatalog } from "@/components/sections/StoryCatalog"
import { STORIES } from "@/lib/stories"
import { siteContent } from "@/lib/site-content"

export default function BooksPage() {
    return (
        <main className="play-pattern min-h-screen pt-24">
            <div className="container mx-auto px-6 py-12">
                <div className="play-hero-panel mx-auto mb-16 max-w-5xl px-6 py-10 text-center md:px-10">
                    <span className="play-kicker mb-4">
                        {siteContent.catalog.kicker}
                    </span>
                    <h1 className="play-hero-title mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
                        {siteContent.catalog.title}
                    </h1>
                    <p className="play-hero-copy mx-auto max-w-2xl text-lg font-semibold md:text-xl">
                        {siteContent.catalog.copy}
                    </p>
                </div>

                <div className="mx-auto mb-10 max-w-5xl rounded-[28px] border border-[var(--nido-line)] bg-white/80 px-5 py-4 text-sm leading-7 text-[var(--nido-muted)] shadow-[0_18px_40px_-30px_rgba(93,84,76,0.18)] backdrop-blur">
                    {siteContent.catalog.mockNote}
                </div>

                <StoryCatalog
                    stories={STORIES}
                    title={null}
                    subtitle=""
                    className="!bg-transparent !py-0"
                />
            </div>
            <Footer />
        </main>
    )
}

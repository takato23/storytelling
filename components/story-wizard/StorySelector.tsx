"use client"

import React from "react"
import { Check, Star } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Story {
    id: string
    title: string
    description: string
    coverImage: string
    style: "cartoon" | "pixar" | "watercolor" | "sketch"
}

interface StorySelectorProps {
    stories: Story[]
    selectedStoryId: string | null
    onSelect: (id: string) => void
    className?: string
}

export function StorySelector({ stories, selectedStoryId, onSelect, className }: StorySelectorProps) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
            {stories.map((story) => {
                const isSelected = selectedStoryId === story.id
                return (
                    <div
                        key={story.id}
                        onClick={() => onSelect(story.id)}
                        className={cn(
                            "group relative cursor-pointer rounded-[24px] transition-all duration-500 overflow-hidden",
                            isSelected
                                ? "shadow-[0_20px_40px_-10px_rgba(255,107,107,0.4)] ring-4 ring-coral-500/20 scale-[1.02]"
                                : "shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.01]"
                        )}
                    >
                        {/* Glass Border Overlay */}
                        <div className={cn("absolute inset-0 z-30 pointer-events-none rounded-[24px] border-[3px] transition-colors duration-300",
                            isSelected ? "border-coral-500" : "border-white/20 group-hover:border-white/40")}
                        />

                        <div className="aspect-[3/4] overflow-hidden relative bg-charcoal-900">
                            {/* Animated Background Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />

                            <img
                                src={story.coverImage}
                                alt={story.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out will-change-transform opacity-90 group-hover:opacity-100"
                            />

                            {isSelected && (
                                <div className="absolute top-4 right-4 z-20 bg-coral-500 text-white p-2.5 rounded-full shadow-lg animate-in zoom-in spin-in-12 duration-300">
                                    <Check className="w-5 h-5 stroke-[3px]" />
                                </div>
                            )}

                            <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white transform transition-transform duration-300">
                                <span className={cn(
                                    "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 backdrop-blur-md border",
                                    isSelected
                                        ? "bg-coral-500 text-white border-coral-400"
                                        : "bg-white/10 text-white/90 border-white/20"
                                )}>
                                    {story.style}
                                </span>
                                <h3 className="text-2xl font-serif leading-tight mb-2 drop-shadow-lg">
                                    {story.title}
                                </h3>
                                <div className={cn(
                                    "grid transition-[grid-template-rows] duration-500 ease-out",
                                    isSelected || true ? "grid-rows-[1fr]" : "grid-rows-[0fr] group-hover:grid-rows-[1fr]"
                                )}>
                                    <div className="overflow-hidden">
                                        <p className="text-sm text-white/80 font-light leading-relaxed mb-1">
                                            {story.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

"use client"

import React from "react"
import { Shield, Truck, Star, Heart } from "lucide-react"

export function TrustStrip({ className = "" }: { className?: string }) {
    const items = [
        {
            icon: Star,
            text: "Preview antes de pagar",
            iconColor: "text-amber-800",
            iconBg: "linear-gradient(135deg, #fff8dc, #ffd166)",
            pillBorder: "#e4dcf2",
            pillHover: "#f4f1fa",
        },
        {
            icon: Truck,
            text: "Envíos a todo el país",
            iconColor: "text-teal-800",
            iconBg: "linear-gradient(135deg, #ecfffa, #9ae8d6)",
            pillBorder: "#d7f0ea",
            pillHover: "#f0fbf8",
        },
        {
            icon: Shield,
            text: "Checkout seguro y protegido",
            iconColor: "text-violet-900",
            iconBg: "linear-gradient(135deg, #f2ecff, #cfbfff)",
            pillBorder: "#e6ddfa",
            pillHover: "#f4f0ff",
        },
        {
            icon: Heart,
            text: "Soporte humano para ayudarte",
            iconColor: "text-rose-800",
            iconBg: "linear-gradient(135deg, #ffe8ef, #ffb7c4)",
            pillBorder: "#f3dde2",
            pillHover: "#fff3f6",
        },
    ]

    return (
        <div className={`w-full relative z-10 pt-3 pb-3 ${className}`}>
            <div className="container mx-auto px-4">
                <div className="surface-panel rounded-[28px] px-2 py-3">
                    <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.11em] text-[var(--text-primary)] md:gap-3 md:text-[11px]">
                    {items.map((item, index) => (
                        <React.Fragment key={index}>
                            <div
                                className="surface-chip inline-flex cursor-default items-center gap-2 rounded-full px-3.5 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-10px_rgba(43,34,84,0.3)]"
                                style={{ borderColor: item.pillBorder, background: `linear-gradient(180deg, ${item.pillHover}, var(--surface-strong))` }}
                            >
                                <span
                                    className="grid place-items-center w-7 h-7 rounded-full border border-white/70 shadow-sm"
                                    style={{ backgroundImage: item.iconBg }}
                                >
                                    <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                                </span>
                                <span className="leading-none">{item.text}</span>
                            </div>
                            {/* Separator dot (hidden on small screens where they wrap) */}
                            {index < items.length - 1 && (
                                <span className="mt-1 hidden h-1.5 w-1.5 rounded-full bg-[var(--border-strong)] md:block" />
                            )}
                        </React.Fragment>
                    ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TrustStrip

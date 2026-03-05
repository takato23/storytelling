"use client"

import React from "react"
import { Shield, Truck, Star, Heart } from "lucide-react"

export function TrustStrip({ className = "" }: { className?: string }) {
    const items = [
        {
            icon: Star,
            text: "Historias personalizadas con IA",
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
            text: "Checkout seguro con Stripe",
            iconColor: "text-violet-900",
            iconBg: "linear-gradient(135deg, #f2ecff, #cfbfff)",
            pillBorder: "#e6ddfa",
            pillHover: "#f4f0ff",
        },
        {
            icon: Heart,
            text: "Equipo humano para ayudarte",
            iconColor: "text-rose-800",
            iconBg: "linear-gradient(135deg, #ffe8ef, #ffb7c4)",
            pillBorder: "#f3dde2",
            pillHover: "#fff3f6",
        },
    ]

    return (
        <div className={`w-full relative z-10 pt-3 pb-3 ${className}`}>
            <div className="container mx-auto px-4">
                <div className="rounded-[1rem] border border-[#e6deef] bg-[#fdfcff] px-2 py-3">
                    <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 text-[10px] md:text-[11px] font-semibold tracking-[0.11em] uppercase text-[#2a2447]">
                    {items.map((item, index) => (
                        <React.Fragment key={index}>
                            <div
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-opacity-90 shadow-[0_5px_16px_-12px_rgba(43,34,84,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_-10px_rgba(43,34,84,0.3)] cursor-default"
                                style={{ borderColor: item.pillBorder, background: `linear-gradient(180deg, ${item.pillHover}, #ffffff)` }}
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
                                <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-[#bfb0de] mt-1" />
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

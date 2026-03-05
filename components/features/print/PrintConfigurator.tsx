"use client"

import React from "react"
import { Book, Check, Sparkles, Box, Crown } from "lucide-react"

export interface PrintConfig {
    coverType: "soft" | "hard" | "premium"
    paperType: "standard" | "glossy"
    giftBox: boolean
}

interface PrintConfiguratorProps {
    config: PrintConfig
    onChange: (config: PrintConfig) => void
    basePrice: number
}

interface CoverOption {
    id: PrintConfig["coverType"]
    title: string
    description: string
    price: number
    premium?: boolean
    icon: typeof Book | typeof Crown
}

interface PaperOption {
    id: PrintConfig["paperType"]
    title: string
    description: string
    price: number
}

const COVER_OPTIONS: CoverOption[] = [
    {
        id: "soft",
        title: "Tapa Blanda",
        description: "Flexible y ligera, ideal para llevar.",
        price: 0,
        icon: Book
    },
    {
        id: "hard",
        title: "Tapa Dura",
        description: "Resistente y duradera. Acabado mate.",
        price: 5.00,
        icon: Book
    },
    {
        id: "premium",
        title: "Premium Acolchada",
        description: "Nuestra mejor calidad con detalles dorados.",
        price: 9.00,
        premium: true,
        icon: Crown
    }
]

const PAPER_OPTIONS: PaperOption[] = [
    {
        id: "standard",
        title: "Papel Estándar 170g",
        description: "Blanco natural, agradable al tacto.",
        price: 0
    },
    {
        id: "glossy",
        title: "Premium Glossy 200g",
        description: "Colores vibrantes y mayor resistencia.",
        price: 4.00
    }
]

export function PrintConfigurator({ config, onChange, basePrice }: PrintConfiguratorProps) {

    const update = <K extends keyof PrintConfig>(field: K, value: PrintConfig[K]) => {
        onChange({ ...config, [field]: value })
    }

    const calculateTotal = () => {
        let total = basePrice
        const cover = COVER_OPTIONS.find(c => c.id === config.coverType)
        const paper = PAPER_OPTIONS.find(p => p.id === config.paperType)
        if (cover) total += cover.price
        if (paper) total += paper.price
        if (config.giftBox) total += 5.99
        return total
    }

    return (
        <div className="space-y-8 wizard-liquid-panel wizard-liquid-sheen p-6 rounded-2xl">
            <div>
                <h3 className="text-xl font-bold text-charcoal-900 mb-4 flex items-center gap-2">
                    <Book className="w-5 h-5 text-indigo-500" />
                    Personaliza tu Libro Físico
                </h3>

                {/* Cover Selection */}
                <div className="mb-6">
                    <label className="text-sm font-semibold text-charcoal-600 mb-3 block">Tipo de Cubierta</label>
                    <div className="grid gap-3">
                        {COVER_OPTIONS.map((option) => (
                            <div
                                key={option.id}
                                onClick={() => update("coverType", option.id)}
                                className={`relative flex items-center p-4 rounded-xl border transition-all cursor-pointer ${config.coverType === option.id
                                    ? "border-indigo-400 bg-indigo-50/60 shadow-sm ring-1 ring-indigo-100"
                                    : "border-white/85 bg-white/70 hover:border-indigo-200 hover:shadow-sm"
                                    }`}
                            >
                                <div className={`p-3 rounded-full mr-4 transition-colors ${config.coverType === option.id ? "bg-indigo-100 text-indigo-600" : "bg-charcoal-50 text-charcoal-400"}`}>
                                    <option.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className={`font-bold ${config.coverType === option.id ? "text-indigo-900" : "text-charcoal-700"}`}>{option.title}</h4>
                                        {option.price > 0 && (
                                            <span className="text-sm font-medium text-indigo-600">+{option.price.toFixed(2)}</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-charcoal-500">{option.description}</p>
                                </div>
                                {option.premium && (
                                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> LUXURY
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Paper Selection */}
                <div className="mb-6">
                    <label className="text-sm font-semibold text-charcoal-600 mb-3 block">Tipo de Papel</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PAPER_OPTIONS.map((option) => (
                            <div
                                key={option.id}
                                onClick={() => update("paperType", option.id)}
                                className={`p-4 rounded-xl border transition-all cursor-pointer ${config.paperType === option.id
                                    ? "border-indigo-400 bg-indigo-50/40 shadow-sm"
                                    : "border-white/85 bg-white/70 hover:border-indigo-200"
                                    }`}
                            >
                                <h4 className={`font-bold text-sm mb-1 ${config.paperType === option.id ? "text-indigo-900" : "text-charcoal-700"}`}>{option.title}</h4>
                                <p className="text-xs text-charcoal-500 mb-2">{option.description}</p>
                                {option.price > 0 ? (
                                    <span className="text-xs font-bold text-indigo-600">+{option.price.toFixed(2)}</span>
                                ) : (
                                    <span className="text-xs font-bold text-charcoal-400">Incluido</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gift Box Toggle */}
                <div
                    onClick={() => update("giftBox", !config.giftBox)}
                    className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer ${config.giftBox
                            ? "border-fuchsia-400 bg-fuchsia-50/40 shadow-sm"
                            : "border-white/85 bg-white/70 hover:border-fuchsia-200"
                        }`}
                >
                    <div className={`p-2.5 rounded-lg mr-3 transition-colors ${config.giftBox ? "bg-fuchsia-100 text-fuchsia-600" : "bg-charcoal-50 text-charcoal-400"}`}>
                        <Box className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h4 className={`font-bold ${config.giftBox ? "text-fuchsia-900" : "text-charcoal-700"}`}>Añadir Caja de Regalo Mágica</h4>
                            <span className="text-sm font-bold text-fuchsia-600">+5.99</span>
                        </div>
                        <p className="text-xs text-charcoal-500">Empaquetado especial con papel de seda y pegatinas.</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border ml-4 flex items-center justify-center transition-all ${config.giftBox ? "bg-fuchsia-500 border-fuchsia-500" : "border-charcoal-200 bg-white"}`}>
                        {config.giftBox && <Check className="w-4 h-4 text-white" />}
                    </div>
                </div>
            </div>

            {/* Total Display */}
            <div className="border-t border-charcoal-100/70 pt-4 flex items-end justify-between">
                <div>
                    <p className="text-sm text-charcoal-500">Total calculado</p>
                    <p className="text-xs text-charcoal-400">Incluye IVA y envío</p>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-bold text-charcoal-900">{calculateTotal().toFixed(2)}</span>
                </div>
            </div>
        </div>
    )
}

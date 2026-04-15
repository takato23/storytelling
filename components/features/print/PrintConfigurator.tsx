"use client"

import React from "react"
import { Check, Crown, Gift, Package } from "lucide-react"
import {
    DEFAULT_PRINT_PRODUCT_ID,
    GIFT_WRAP_PRICE_ARS,
    getPrintProduct,
    PRINT_PRODUCTS,
    type PrintProductId,
} from "@/lib/print-products"

export interface PrintConfig {
    productId: PrintProductId
    includeGiftWrap: boolean
}

interface PrintConfiguratorProps {
    config: PrintConfig
    onChange: (config: PrintConfig) => void
    basePrice: number
}

const PRODUCT_ORDER: PrintProductId[] = [
    "photo_book_21x21_soft",
    "photo_book_21x21_hard",
]

function formatArs(value: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(value)
}

export function PrintConfigurator({ config, onChange, basePrice }: PrintConfiguratorProps) {
    const selectedProduct = getPrintProduct(config.productId)

    const update = <K extends keyof PrintConfig>(field: K, value: PrintConfig[K]) => {
        onChange({ ...config, [field]: value })
    }

    const totalEstimate = basePrice + (config.includeGiftWrap ? GIFT_WRAP_PRICE_ARS : 0)

    return (
        <div className="play-panel space-y-8 p-6">
            <div className="space-y-4">
                <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xl font-bold text-[var(--play-text-main)]">
                        <Package className="h-5 w-5 text-[var(--play-primary)]" />
                        Libro Físico
                    </h3>
                    <p className="text-sm text-[var(--play-text-muted)]">
                        Ofrecemos un único tamaño de 21 x 21 cm, disponible en tapa blanda o tapa dura.
                    </p>
                </div>

                <div className="grid gap-3">
                    {PRODUCT_ORDER.map((productId) => {
                        const product = PRINT_PRODUCTS[productId]
                        const isSelected = config.productId === product.id
                        const isPremium = product.launchTier === "premium"

                        return (
                            <button
                                key={product.id}
                                type="button"
                                onClick={() => update("productId", product.id)}
                                className={`rounded-2xl border p-4 text-left transition-all ${
                                    isSelected
                                        ? "border-[var(--play-primary)] bg-[var(--play-primary-container)]/18 shadow-sm ring-1 ring-[var(--play-primary-container)]/30"
                                        : "border-[var(--play-outline)] bg-[var(--play-surface-lowest)] hover:border-[var(--play-primary)]/40 hover:shadow-sm"
                                }`}
                            >
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className={`font-bold ${isSelected ? "text-[var(--play-text-main)]" : "text-charcoal-800"}`}>
                                                {product.title}
                                            </h4>
                                            {isPremium && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800">
                                                    <Crown className="h-3 w-3" />
                                                    Premium
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-[var(--play-text-muted)]">{product.description}</p>
                                    </div>
                                    {isSelected && (
                                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--play-primary)] text-white">
                                                <Check className="h-4 w-4" />
                                            </span>
                                    )}
                                </div>

                                <div className="grid gap-2 text-xs text-[var(--play-text-muted)] sm:grid-cols-2">
                                    <div className="rounded-xl bg-[var(--play-surface-low)] px-3 py-2">
                                        <span className="font-semibold text-[var(--play-text-main)]">Tamaño:</span> {product.sizeCm}
                                    </div>
                                    <div className="rounded-xl bg-[var(--play-surface-low)] px-3 py-2">
                                        <span className="font-semibold text-[var(--play-text-main)]">Tapa:</span>{" "}
                                        {product.cover === "hard" ? "Dura" : "Blanda"}
                                    </div>
                                    <div className="rounded-xl bg-[var(--play-surface-low)] px-3 py-2">
                                        <span className="font-semibold text-[var(--play-text-main)]">Base:</span> {product.basePages} páginas
                                    </div>
                                    <div className="rounded-xl bg-[var(--play-surface-low)] px-3 py-2">
                                        <span className="font-semibold text-[var(--play-text-main)]">Resolución objetivo:</span>{" "}
                                        {product.recommendedResolution.width} x {product.recommendedResolution.height}px
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            <div
                onClick={() => update("includeGiftWrap", !config.includeGiftWrap)}
                className={`flex cursor-pointer items-center rounded-2xl border p-4 transition-all ${
                    config.includeGiftWrap
                        ? "border-[var(--play-accent-gift)]/40 bg-[var(--play-accent-gift-bg)] shadow-sm"
                        : "border-white/85 bg-white/70 hover:border-[var(--play-accent-gift)]/20"
                }`}
            >
                <div
                    className={`mr-3 rounded-lg p-2.5 transition-colors ${
                        config.includeGiftWrap ? "bg-[var(--play-accent-gift-light)]/40 text-[var(--play-accent-gift)]" : "bg-[var(--play-surface-low)] text-[var(--play-text-muted)]"
                    }`}
                >
                    <Gift className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <h4 className={`font-bold ${config.includeGiftWrap ? "text-[var(--play-text-main)]" : "text-charcoal-700"}`}>
                            Envolver para regalo
                        </h4>
                        <span className="text-sm font-bold text-[var(--play-accent-gift)]">+{formatArs(GIFT_WRAP_PRICE_ARS)}</span>
                    </div>
                    <p className="text-xs text-charcoal-500">
                        Súmalo si quieres que llegue listo para regalar.
                    </p>
                </div>
                <div
                    className={`ml-4 flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                        config.includeGiftWrap ? "border-[var(--play-accent-gift)] bg-[var(--play-accent-gift)]" : "border-charcoal-200 bg-white"
                    }`}
                >
                    {config.includeGiftWrap && <Check className="h-4 w-4 text-white" />}
                </div>
            </div>

            <div className="rounded-2xl border border-[var(--play-outline)] bg-[var(--play-surface-low)] p-4">
                <p className="text-sm text-[var(--play-text-muted)]">Producto seleccionado</p>
                <div className="mt-2 flex items-start justify-between gap-3">
                    <div>
                        <p className="text-lg font-bold text-[var(--play-text-main)]">
                            {selectedProduct.shortTitle} tapa {selectedProduct.cover === "hard" ? "dura" : "blanda"}
                        </p>
                        <p className="text-xs text-[var(--play-text-muted)]">
                            Incluye {selectedProduct.basePages} páginas base.
                        </p>
                    </div>
                    <p className="text-right text-2xl font-bold text-[var(--play-text-main)]">{formatArs(totalEstimate)}</p>
                </div>
            </div>
        </div>
    )
}

export const DEFAULT_PRINT_CONFIG: PrintConfig = {
    productId: DEFAULT_PRINT_PRODUCT_ID,
    includeGiftWrap: false,
}

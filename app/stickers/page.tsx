"use client"

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, ChevronRight, Minus, Plus, Sparkles } from "lucide-react"
import { Footer } from "@/components/layout/Footer"
import { captureEvent } from "@/lib/analytics/events"
import {
    DEFAULT_STICKER_STYLE_ID,
    STICKER_STYLE_PRESETS,
    STICKER_THEMES_BY_GENDER,
    STICKER_UNIT_PRICE_ARS,
    type StickerGender,
    type StickerStyleId,
} from "@/lib/stickers"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function formatArs(value: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(value)
}

async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error("No pudimos leer la imagen"))
        reader.readAsDataURL(file)
    })
}

interface StickerPreviewQualityPayload {
    pass?: boolean
    confidence?: number
    issues?: string[]
    available?: boolean
}

const STICKER_THEME_PACKS: Record<
    StickerGender,
    Array<{ id: string; label: string; themes: string[] }>
> = {
    niña: [
        { id: "aventuras", label: "Pack aventuras", themes: ["Sirena", "Superheroína", "Princesa"] },
        { id: "artes", label: "Pack creativo", themes: ["Guitarrista", "Pintora", "Cocinera"] },
    ],
    niño: [
        { id: "heroes", label: "Pack héroes", themes: ["Superhéroe", "Bombero", "Astronauta"] },
        { id: "explora", label: "Pack explorador", themes: ["Explorador", "Pintor", "Cocinero"] },
    ],
}

export default function StickersPage() {
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
    const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
    const [childGender, setChildGender] = useState<StickerGender>("niña")
    const [selectedThemes, setSelectedThemes] = useState<string[]>([])
    const [styleId, setStyleId] = useState<StickerStyleId>(DEFAULT_STICKER_STYLE_ID)

    const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null)
    const [generatedPreviewToken, setGeneratedPreviewToken] = useState<string | null>(null)
    const [previewError, setPreviewError] = useState<string | null>(null)
    const [previewQualityWarning, setPreviewQualityWarning] = useState<string | null>(null)
    const [previewAttempts, setPreviewAttempts] = useState(0)
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)

    const [customerName, setCustomerName] = useState("")
    const [customerEmail, setCustomerEmail] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [quantity, setQuantity] = useState(1)
    const [isRecipientDifferent, setIsRecipientDifferent] = useState(false)

    const [recipientName, setRecipientName] = useState("")
    const [line1, setLine1] = useState("")
    const [line2, setLine2] = useState("")
    const [city, setCity] = useState("")
    const [state, setState] = useState("")
    const [postalCode, setPostalCode] = useState("")
    const countryCode = "AR"

    const [checkoutError, setCheckoutError] = useState<string | null>(null)
    const [isCheckingOut, setIsCheckingOut] = useState(false)

    const [waitlistName, setWaitlistName] = useState("")
    const [waitlistEmail, setWaitlistEmail] = useState("")
    const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false)
    const [waitlistSuccess, setWaitlistSuccess] = useState<string | null>(null)
    const [waitlistError, setWaitlistError] = useState<string | null>(null)

    const availableThemes = useMemo(() => STICKER_THEMES_BY_GENDER[childGender], [childGender])
    const subtotalEstimate = useMemo(() => STICKER_UNIT_PRICE_ARS * quantity, [quantity])
    const selectedStyle = STICKER_STYLE_PRESETS[styleId]
    const activeThemePacks = STICKER_THEME_PACKS[childGender]
    const hasPreview = Boolean(generatedPreviewUrl && generatedPreviewToken)
    const selectedThemesLabel = selectedThemes.join(" • ")

    useEffect(() => {
        const allowedThemes = new Set<string>(availableThemes)
        setSelectedThemes((current) => {
            const filtered = current.filter((theme) => allowedThemes.has(theme))
            if (filtered.length > 0) return filtered
            return Array.from(availableThemes).slice(0, 2)
        })
        setGeneratedPreviewUrl(null)
        setGeneratedPreviewToken(null)
        setPreviewError(null)
        setPreviewQualityWarning(null)
        setPreviewAttempts(0)
    }, [availableThemes])

    useEffect(() => {
        if (!recipientName && customerName) {
            setRecipientName(customerName)
        }
    }, [customerName, recipientName])

    useEffect(() => {
        return () => {
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl)
            }
        }
    }, [photoPreviewUrl])

    const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setPreviewError(null)

        if (!file.type.startsWith("image/")) {
            setPreviewError("Subí una imagen válida (JPG o PNG).")
            return
        }

        if (file.size > MAX_IMAGE_BYTES) {
            setPreviewError("La imagen no puede superar los 5MB.")
            return
        }

        try {
            const dataUrl = await fileToDataUrl(file)
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl)
            }
            setPhotoDataUrl(dataUrl)
            setPhotoPreviewUrl(URL.createObjectURL(file))
            setGeneratedPreviewUrl(null)
            setGeneratedPreviewToken(null)
            setPreviewQualityWarning(null)
            setPreviewAttempts(0)
        } catch (error) {
            setPreviewError(error instanceof Error ? error.message : "No pudimos procesar la imagen.")
        }
    }

    const toggleTheme = (theme: string) => {
        setSelectedThemes((current) => {
            if (current.includes(theme)) {
                return current.filter((item) => item !== theme)
            }
            if (current.length >= 6) return current
            return [...current, theme]
        })
        setGeneratedPreviewUrl(null)
        setGeneratedPreviewToken(null)
        setPreviewQualityWarning(null)
        setPreviewAttempts(0)
    }

    const handleStyleChange = (nextStyleId: StickerStyleId) => {
        setStyleId(nextStyleId)
        setGeneratedPreviewUrl(null)
        setGeneratedPreviewToken(null)
        setPreviewQualityWarning(null)
        setPreviewAttempts(0)
    }

    const applyThemePack = (themes: string[]) => {
        setSelectedThemes(themes)
        setGeneratedPreviewUrl(null)
        setGeneratedPreviewToken(null)
        setPreviewQualityWarning(null)
        setPreviewAttempts(0)
    }

    const changeQuantity = (nextQuantity: number) => {
        setQuantity(Math.max(1, Math.min(10, nextQuantity)))
    }

    const handleGeneratePreview = async () => {
        if (!photoDataUrl) {
            setPreviewError("Subí una foto para generar la previsualización.")
            return
        }

        if (selectedThemes.length === 0) {
            setPreviewError("Seleccioná al menos una temática.")
            return
        }

        setPreviewError(null)
        setPreviewQualityWarning(null)
        setPreviewAttempts(0)
        setGeneratedPreviewToken(null)
        setIsGeneratingPreview(true)
        setCheckoutError(null)

        try {
            const response = await fetch("/api/stickers/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: photoDataUrl,
                    childGender,
                    themes: selectedThemes,
                    styleId,
                }),
            })
            const payload = await response.json()
            if (!response.ok) {
                throw new Error(payload.message ?? "No pudimos generar la previsualización.")
            }

            if (!payload.imageUrl) {
                throw new Error("No recibimos una imagen de previsualización.")
            }

            setGeneratedPreviewUrl(String(payload.imageUrl))
            setGeneratedPreviewToken(typeof payload.previewToken === "string" ? payload.previewToken : null)

            const attempts = Number(payload.attempts)
            if (Number.isFinite(attempts) && attempts > 0) {
                setPreviewAttempts(attempts)
            }

            const quality = (payload.quality ?? null) as StickerPreviewQualityPayload | null
            if (quality && quality.pass === false) {
                const issues = Array.isArray(quality.issues)
                    ? quality.issues.filter((issue) => typeof issue === "string").slice(0, 2)
                    : []
                const qualityLabel = quality.available === false
                    ? "No pudimos validar calidad automáticamente."
                    : "La preview no pasó nuestro control de calidad. Probá generar otra."

                const issueText = issues.length > 0 ? ` Detalles detectados: ${issues.join("; ")}.` : ""
                setPreviewQualityWarning(`${qualityLabel}${issueText}`)
            }
        } catch (generationError) {
            setPreviewError(
                generationError instanceof Error
                    ? generationError.message
                    : "No pudimos generar la previsualización.",
            )
            setGeneratedPreviewToken(null)
            setPreviewQualityWarning(null)
            setPreviewAttempts(0)
        } finally {
            setIsGeneratingPreview(false)
        }
    }

    const handleCheckout = async (event: FormEvent) => {
        event.preventDefault()

        if (!generatedPreviewUrl || !generatedPreviewToken) {
            setCheckoutError("Necesitás una preview aprobada antes de continuar al pago.")
            return
        }

        setCheckoutError(null)
        setIsCheckingOut(true)

        try {
            const payload = {
                customerName,
                customerEmail,
                customerPhone: customerPhone || undefined,
                childGender,
                themes: selectedThemes,
                styleId,
                quantity,
                previewImageUrl: generatedPreviewUrl,
                previewToken: generatedPreviewToken,
                shippingAddress: {
                    recipientName: isRecipientDifferent ? recipientName : customerName,
                    line1,
                    line2: line2 || undefined,
                    city,
                    state: state || undefined,
                    postalCode,
                    countryCode: countryCode.toUpperCase(),
                    phone: customerPhone || undefined,
                },
            }

            const response = await fetch("/api/stickers/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            const checkoutPayload = await response.json()
            if (!response.ok) {
                throw new Error(checkoutPayload.message ?? "No pudimos iniciar el checkout.")
            }

            if (!checkoutPayload.checkout_url) {
                throw new Error("No recibimos URL de checkout.")
            }

            window.location.href = String(checkoutPayload.checkout_url)
        } catch (checkoutSubmissionError) {
            setCheckoutError(
                checkoutSubmissionError instanceof Error
                    ? checkoutSubmissionError.message
                    : "No pudimos iniciar el checkout.",
            )
            setIsCheckingOut(false)
        }
    }

    const handleWaitlistSubmit = async (event: FormEvent) => {
        event.preventDefault()

        setIsSubmittingWaitlist(true)
        setWaitlistError(null)
        setWaitlistSuccess(null)

        try {
            const response = await fetch("/api/stickers/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: waitlistName, email: waitlistEmail }),
            })
            const payload = await response.json()
            if (!response.ok) {
                throw new Error(payload.message ?? "No pudimos registrarte en la lista.")
            }

            captureEvent("stickers_waitlist_joined", { source: "stickers_page" })
            setWaitlistSuccess("Listo. Te avisamos de nuevos packs y promos.")
            setWaitlistName("")
            setWaitlistEmail("")
        } catch (waitlistSubmissionError) {
            setWaitlistError(
                waitlistSubmissionError instanceof Error
                    ? waitlistSubmissionError.message
                    : "No pudimos registrarte en la lista.",
            )
        } finally {
            setIsSubmittingWaitlist(false)
        }
    }

    return (
        <main className="page-shell min-h-screen pt-24 pb-20 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-400/20 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px]" />
            </div>

            <section className="container mx-auto px-6 py-14 relative z-10">
                <div className="page-panel relative mx-auto max-w-5xl rounded-[36px] px-6 py-16 text-center md:px-12 md:py-24 overflow-hidden border border-white/40 shadow-xl bg-white/60 backdrop-blur-md">
                    {/* Decorative Banana Sticker */}
                    <motion.img 
                        src="/images/stickers/banana_sticker.png" 
                        alt="Cool Banana Sticker" 
                        className="absolute -top-10 -right-6 w-32 h-32 md:w-56 md:h-56 drop-shadow-2xl z-20 pointer-events-none"
                        animate={{ 
                            y: [0, -15, 0],
                            rotate: [-5, 5, -5]
                        }}
                        transition={{ 
                            duration: 4, 
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="relative z-10"
                    >
                        <span className="inline-block rounded-full bg-gradient-to-r from-fuchsia-100 to-indigo-100 px-4 py-1.5 text-sm font-bold tracking-widest text-fuchsia-700 uppercase mb-6 shadow-sm border border-fuchsia-200/50">
                            Stickers Mágicos con IA
                        </span>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-charcoal-900 via-indigo-900 to-fuchsia-900 mb-6 drop-shadow-sm pb-2">
                            Convertí tus fotos<br/>en arte coleccionable
                        </h1>
                        <p className="mx-auto max-w-2xl text-lg md:text-xl font-medium text-charcoal-600 leading-relaxed max-w-xl">
                            Subí una foto, elegí las temáticas y generá una preview antes de comprar.
                            Después pedís la versión impresa con envío en Argentina.
                        </p>
                    </motion.div>
                </div>

                <div className="page-panel group mx-auto mt-14 mb-16 max-w-5xl overflow-hidden rounded-[2rem]">
                        <div className="relative overflow-hidden border-b border-fuchsia-200/50 p-8 text-center sm:p-10 sm:text-left">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-200/60 rounded-full blur-[80px] opacity-60 -translate-y-1/2 translate-x-1/3"></div>
                            <div className="relative z-10 space-y-3">
                                <h2 className="section-heading flex items-center justify-center gap-3 text-3xl leading-[1.05] tracking-tight sm:justify-start sm:text-[2.5rem]">
                                    Cómo funciona
                                </h2>
                                <p className="section-copy max-w-2xl text-[17px] font-semibold leading-relaxed sm:text-lg">
                                    De una foto pasás a una plancha lista para imprimir.
                                </p>
                            </div>
                        </div>

                    <div className="p-8 sm:p-12 grid lg:grid-cols-3 gap-10 items-center overflow-hidden relative">
                        {/* Background subtle dots/grid could go here */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none"></div>

                        {/* 1. Foto */}
                        <div className="flex flex-col items-center relative z-10">
                            <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-white shadow-xl overflow-hidden mb-4 group-hover:scale-105 transition-transform duration-500 ring-4 ring-indigo-50">
                                <img src="/images/stickers/example_child.png" alt="Foto original" className="w-full h-full object-cover" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pt-8 pb-3 text-center">
                                    <span className="text-white text-xs font-bold uppercase tracking-wider drop-shadow-md">Foto Original</span>
                                </div>
                            </div>
                        </div>

                        {/* 2. El Prompt */}
                        <div className="relative flex flex-col items-center z-10">
                            <div className="hidden lg:block absolute top-1/2 -left-8 w-16 border-t-[3px] border-dotted border-fuchsia-200 -translate-y-1/2 opacity-60"></div>
                            <div className="hidden lg:block absolute top-1/2 -right-8 w-16 border-t-[3px] border-dotted border-fuchsia-200 -translate-y-1/2 opacity-60"></div>

                            <div className="page-card relative w-full transform rounded-2xl p-5 shadow-sm transition-transform duration-300 group-hover:-translate-y-1 hover:rotate-0 sm:p-6">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-fuchsia-200/50">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                    <span className="text-[10px] font-mono text-charcoal-700 ml-2 tracking-widest uppercase">prompt_estandar_stickers.txt</span>
                                </div>
                                <p className="text-xs sm:text-sm font-mono text-charcoal-900 leading-relaxed text-left">
                                    <span className="text-fuchsia-600 font-semibold">Diseñá una plancha de stickers</span> con 6 figuras troquelables.<br /><br />
                                    Cada sticker debe mostrar a <span className="text-indigo-600 font-semibold">la misma persona de la foto</span> en distintos roles.<br /><br />
                                    <span className="text-emerald-600 font-semibold">Estilo visual:</span> comic pop contemporáneo.<br /><br />
                                    <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 line-clamp-2 sm:line-clamp-none">Conservar cara, ojos, nariz y peinado.</span>
                                </p>
                            </div>
                        </div>

                        {/* 3. Plancha Resultante */}
                        <div className="flex flex-col items-center relative z-10">
                            <div className="relative w-full max-w-[280px] rounded-2xl border-4 border-white shadow-2xl overflow-hidden transform -rotate-2 hover:rotate-0 group-hover:scale-105 transition-all duration-500 ring-4 ring-fuchsia-50">
                                <img src="/images/stickers/example_sheet.png" alt="Plancha de stickers generada" className="w-full h-auto" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pt-8 pb-3 text-center">
                                    <span className="text-white text-xs font-bold uppercase tracking-wider drop-shadow-md">Resultado Generado</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-2">
                    <div className="page-panel space-y-6 rounded-3xl p-6">
                        <div className="grid gap-3 rounded-[28px] border border-indigo-100 bg-indigo-50/80 p-4 sm:grid-cols-3">
                            {[
                                { step: "1", title: "Subí la foto", done: Boolean(photoPreviewUrl) },
                                { step: "2", title: "Elegí estilo", done: selectedThemes.length > 0 },
                                { step: "3", title: "Generá preview", done: hasPreview },
                            ].map((item) => (
                                <div
                                    key={item.step}
                                    className={`rounded-2xl border px-4 py-3 ${item.done
                                        ? "border-emerald-200 bg-white text-emerald-700"
                                        : "border-indigo-100 bg-white/70 text-charcoal-700"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${item.done
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-indigo-100 text-indigo-700"
                                            }`}>
                                            {item.done ? <CheckCircle2 className="h-4 w-4" /> : item.step}
                                        </div>
                                        <p className="text-sm font-semibold">{item.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h2 className="text-lg font-bold text-charcoal-900">1) Diseñá tu plancha</h2>
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                                    Preview gratis
                                </span>
                            </div>
                            <p className="mb-4 text-sm font-medium text-charcoal-600">
                                Primero resolvé solo esto: foto, estilo y temáticas. Pagás recién cuando te guste la preview.
                            </p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="block w-full text-sm text-charcoal-700 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-100 file:px-4 file:py-2 file:text-indigo-700 file:font-semibold"
                            />
                            <p className="text-xs text-charcoal-500 mt-2">JPG o PNG. Máximo 5MB.</p>
                            {photoPreviewUrl && (
                                <img
                                    src={photoPreviewUrl}
                                    alt="Foto subida"
                                    className="mt-4 w-full h-56 object-cover rounded-2xl border border-charcoal-100"
                                />
                            )}


                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-charcoal-900 mb-3">2) Estilo y temáticas</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                                {(Object.entries(STICKER_STYLE_PRESETS) as Array<
                                    [StickerStyleId, (typeof STICKER_STYLE_PRESETS)[StickerStyleId]]
                                >).map(([id, style]) => {
                                    const isSelected = styleId === id
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => handleStyleChange(id)}
                                            className={`rounded-xl border p-3 text-left transition-colors ${isSelected
                                                ? "bg-indigo-950 border-indigo-950 text-white"
                                                : "bg-white border-charcoal-200 text-charcoal-700 hover:border-indigo-400"
                                                }`}
                                        >
                                            <p className="text-sm font-semibold">{style.label}</p>
                                            <p className={`text-xs mt-1 ${isSelected ? "text-indigo-100" : "text-charcoal-500"}`}>
                                                {style.description}
                                            </p>
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="flex gap-2 mb-4">
                                {(["niña", "niño"] as StickerGender[]).map((gender) => (
                                    <button
                                        key={gender}
                                        type="button"
                                        onClick={() => setChildGender(gender)}
                                        className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${childGender === gender
                                            ? "bg-indigo-950 text-white border-indigo-950"
                                            : "bg-white text-charcoal-700 border-charcoal-200 hover:border-indigo-400"
                                            }`}
                                    >
                                        {gender === "niña" ? "Niña" : "Niño"}
                                    </button>
                                ))}
                            </div>

                            <div className="mb-4">
                                <div className="mb-2 flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-charcoal-700">Selección rápida</p>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedThemes([])}
                                        className="text-xs font-semibold text-charcoal-500 underline-offset-4 hover:text-charcoal-700 hover:underline"
                                    >
                                        Limpiar
                                    </button>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    {activeThemePacks.map((pack) => {
                                        const isActive =
                                            pack.themes.length === selectedThemes.length &&
                                            pack.themes.every((theme) => selectedThemes.includes(theme))

                                        return (
                                            <button
                                                key={pack.id}
                                                type="button"
                                                onClick={() => applyThemePack(pack.themes)}
                                                className={`rounded-2xl border px-4 py-3 text-left transition-colors ${isActive
                                                    ? "border-indigo-950 bg-indigo-950 text-white"
                                                    : "border-charcoal-200 bg-white text-charcoal-700 hover:border-indigo-300"
                                                    }`}
                                            >
                                                <p className="text-sm font-semibold">{pack.label}</p>
                                                <p className={`mt-1 text-xs ${isActive ? "text-indigo-100" : "text-charcoal-500"}`}>
                                                    {pack.themes.join(" • ")}
                                                </p>
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {availableThemes.map((theme) => {
                                    const isSelected = selectedThemes.includes(theme)
                                    return (
                                        <button
                                            key={theme}
                                            type="button"
                                            onClick={() => toggleTheme(theme)}
                                            className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${isSelected
                                                ? "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-700"
                                                : "bg-white border-charcoal-200 text-charcoal-700 hover:border-fuchsia-300"
                                                }`}
                                        >
                                            {theme}
                                        </button>
                                    )
                                })}
                            </div>
                            <p className="text-xs text-charcoal-500 mt-2">Elegí entre 1 y 6 temáticas.</p>
                            <p className="text-xs text-charcoal-500 mt-1">
                                Estilo activo: <span className="font-semibold text-charcoal-700">{selectedStyle.label}</span>
                            </p>
                            {selectedThemes.length > 0 && (
                                <p className="text-xs text-charcoal-500 mt-1">
                                    Selección actual: <span className="font-semibold text-charcoal-700">{selectedThemesLabel}</span>
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleGeneratePreview}
                            disabled={isGeneratingPreview}
                            className="w-full rounded-xl bg-charcoal-900 py-3 font-semibold text-white transition-colors hover:bg-fuchsia-700 disabled:opacity-60"
                        >
                            {isGeneratingPreview ? "Generando preview..." : "3) Generar preview"}
                        </button>
                        <p className="text-sm text-charcoal-500">
                            Tarda unos segundos. Si no te convence, cambiás estilo o temáticas y probás de nuevo.
                        </p>

                        {previewError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
                                {previewError}
                            </div>
                        )}
                        {previewQualityWarning && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm font-medium">
                                {previewQualityWarning}
                            </div>
                        )}
                            {previewAttempts > 1 && !previewQualityWarning && !previewError && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm font-medium">
                                Ajustamos la generación para mejorar la cara.
                            </div>
                        )}
                        {generatedPreviewUrl && generatedPreviewToken && !previewQualityWarning && !previewError && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 text-sm font-medium">
                                Preview aprobada para compra.
                            </div>
                        )}
                    </div>

                    <div className="page-panel space-y-6 rounded-3xl p-6">
                        <div>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <h2 className="text-lg font-bold text-charcoal-900">4) Revisá tu preview</h2>
                                {hasPreview && (
                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                                        Lista para comprar
                                    </span>
                                )}
                            </div>
                            <div className="relative rounded-2xl border border-charcoal-100 bg-charcoal-50 min-h-64 overflow-hidden">
                                {generatedPreviewUrl ? (
                                    <>
                                        <img
                                            src={generatedPreviewUrl}
                                            alt="Preview de stickers"
                                            className="w-full h-full object-cover"
                                            draggable={false}
                                            onContextMenu={(event) => event.preventDefault()}
                                        />
                                        <div className="pointer-events-none absolute inset-0">
                                            <div className="absolute -left-10 top-8 rotate-[-22deg] bg-black/40 text-white text-xs md:text-sm font-bold px-10 py-2 tracking-[0.2em] uppercase">
                                                Vista previa
                                            </div>
                                            <div className="absolute right-[-42px] top-1/2 -translate-y-1/2 rotate-[-22deg] bg-black/40 text-white text-xs md:text-sm font-bold px-10 py-2 tracking-[0.2em] uppercase">
                                                StoryMagic
                                            </div>
                                            <div className="absolute left-1/2 -translate-x-1/2 bottom-6 rotate-[-22deg] bg-black/40 text-white text-xs md:text-sm font-bold px-10 py-2 tracking-[0.2em] uppercase">
                                                No descargar
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-center px-6 text-charcoal-500 text-sm">
                                        La preview aparece acá cuando subís la foto y elegís las temáticas.
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-charcoal-500 mt-2">
                                La marca de agua solo está en esta preview. La versión final sale limpia.
                            </p>
                            {previewAttempts > 0 && (
                                <p className="text-xs text-charcoal-500 mt-1">
                                    Intentos de generación: <span className="font-semibold text-charcoal-700">{previewAttempts}</span>
                                </p>
                            )}
                        </div>

                        {hasPreview ? (
                            <form onSubmit={handleCheckout} className="space-y-4 rounded-[28px] border border-emerald-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(16,185,129,0.45)]">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-charcoal-900">5) Completá compra y envío</h3>
                                        <p className="mt-1 text-sm text-charcoal-600">
                                            Ahora sí: dejá tus datos y te mandamos al checkout.
                                        </p>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Pagás al final
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="stickers-name" className="block text-sm font-semibold text-charcoal-700 mb-2">
                                            Nombre
                                        </label>
                                        <input
                                            id="stickers-name"
                                            value={customerName}
                                            onChange={(event) => setCustomerName(event.target.value)}
                                            className="surface-input w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="stickers-email" className="block text-sm font-semibold text-charcoal-700 mb-2">
                                            Email
                                        </label>
                                        <input
                                            id="stickers-email"
                                            type="email"
                                            value={customerEmail}
                                            onChange={(event) => setCustomerEmail(event.target.value)}
                                            className="surface-input w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
                                    <div>
                                        <label htmlFor="stickers-phone" className="block text-sm font-semibold text-charcoal-700 mb-2">
                                            Teléfono (opcional)
                                        </label>
                                        <input
                                            id="stickers-phone"
                                            value={customerPhone}
                                            onChange={(event) => setCustomerPhone(event.target.value)}
                                            className="surface-input w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </div>
                                    <div>
                                        <span className="block text-sm font-semibold text-charcoal-700 mb-2">Cantidad</span>
                                        <div className="flex items-center rounded-xl border border-charcoal-200 bg-white">
                                            <button
                                                type="button"
                                                onClick={() => changeQuantity(quantity - 1)}
                                                className="flex h-12 w-12 items-center justify-center text-charcoal-700 transition-colors hover:text-indigo-700"
                                                aria-label="Restar cantidad"
                                            >
                                                <Minus className="h-4 w-4" />
                                            </button>
                                            <div className="min-w-16 px-3 text-center text-base font-bold text-charcoal-900">
                                                {quantity}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => changeQuantity(quantity + 1)}
                                                className="flex h-12 w-12 items-center justify-center text-charcoal-700 transition-colors hover:text-indigo-700"
                                                aria-label="Sumar cantidad"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <label className="flex items-start gap-3 rounded-2xl border border-charcoal-100 bg-charcoal-50 px-4 py-3 text-sm text-charcoal-700">
                                    <input
                                        type="checkbox"
                                        checked={isRecipientDifferent}
                                        onChange={(event) => setIsRecipientDifferent(event.target.checked)}
                                        className="mt-1"
                                    />
                                    <span>
                                        Lo recibe otra persona.
                                        <span className="block text-xs text-charcoal-500 mt-1">
                                            Si no marcás esto, usamos tu nombre también para la entrega.
                                        </span>
                                    </span>
                                </label>

                                <div className="grid md:grid-cols-2 gap-3">
                                    {isRecipientDifferent && (
                                        <div className="md:col-span-2">
                                            <label htmlFor="stickers-recipient" className="block text-sm font-semibold text-charcoal-700 mb-2">
                                                Nombre para recibir
                                            </label>
                                            <input
                                                id="stickers-recipient"
                                                value={recipientName}
                                                onChange={(event) => setRecipientName(event.target.value)}
                                                className="surface-input w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                                required={isRecipientDifferent}
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label htmlFor="stickers-line1" className="block text-sm font-semibold text-charcoal-700 mb-2">
                                            Dirección
                                        </label>
                                        <input
                                            id="stickers-line1"
                                            value={line1}
                                            onChange={(event) => setLine1(event.target.value)}
                                            className="surface-input w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="stickers-line2" className="block text-sm font-semibold text-charcoal-700 mb-2">
                                            Piso / Dpto (opcional)
                                        </label>
                                        <input
                                            id="stickers-line2"
                                            value={line2}
                                            onChange={(event) => setLine2(event.target.value)}
                                            className="surface-input w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="stickers-city" className="block text-sm font-semibold text-charcoal-700 mb-2">
                                            Ciudad
                                        </label>
                                        <input
                                            id="stickers-city"
                                            value={city}
                                            onChange={(event) => setCity(event.target.value)}
                                            className="surface-input w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="stickers-state" className="block text-sm font-semibold text-charcoal-700 mb-2">
                                            Provincia
                                        </label>
                                        <input
                                            id="stickers-state"
                                            value={state}
                                            onChange={(event) => setState(event.target.value)}
                                            className="surface-input w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="stickers-postal" className="block text-sm font-semibold text-charcoal-700 mb-2">
                                            Código postal
                                        </label>
                                        <input
                                            id="stickers-postal"
                                            value={postalCode}
                                            onChange={(event) => setPostalCode(event.target.value)}
                                            className="surface-input w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-charcoal-700 mb-2">
                                            País
                                        </label>
                                        <div className="surface-input flex h-[50px] items-center rounded-xl px-4 text-charcoal-700">
                                            Argentina
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                                    <div className="flex items-center justify-between gap-3">
                                        <span>Subtotal ({quantity} plancha/s)</span>
                                        <strong>{formatArs(subtotalEstimate)}</strong>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 mt-1">
                                        <span>Estilo seleccionado</span>
                                        <strong>{selectedStyle.label}</strong>
                                    </div>
                                    <p className="text-xs text-indigo-700 mt-1">
                                        El envío se calcula en el checkout según provincia y CP.
                                    </p>
                                </div>

                                {checkoutError && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
                                        {checkoutError}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isCheckingOut}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-charcoal-900 py-3 font-semibold text-white transition-colors hover:bg-purple-700 disabled:opacity-60"
                                >
                                    <span>{isCheckingOut ? "Redirigiendo a pago..." : "Ir a pagar"}</span>
                                    {!isCheckingOut && <ChevronRight className="h-4 w-4" />}
                                </button>
                            </form>
                        ) : (
                            <div className="rounded-[28px] border border-dashed border-charcoal-200 bg-charcoal-50/80 p-6">
                                <h3 className="text-lg font-bold text-charcoal-900">5) Compra y envío</h3>
                                <p className="mt-2 text-sm leading-relaxed text-charcoal-600">
                                    Dejamos este paso para después, así no llenás datos antes de ver el resultado.
                                </p>
                                <div className="mt-4 space-y-3 rounded-2xl bg-white p-4 shadow-[0_10px_24px_-20px_rgba(17,24,39,0.35)]">
                                    {[
                                        "Completás nombre, email y dirección solo cuando la preview te gusta.",
                                        "La cantidad se ajusta en un click.",
                                        "El envío se calcula automáticamente con tu provincia y código postal.",
                                    ].map((item) => (
                                        <div key={item} className="flex items-start gap-3 text-sm text-charcoal-700">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 text-indigo-600" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="page-panel mx-auto mt-8 max-w-3xl rounded-3xl p-6">
                    <h2 className="text-lg font-bold text-charcoal-900 mb-2">¿Querés avisos de nuevos packs?</h2>
                    <p className="text-charcoal-600 text-sm mb-4">
                        Sumate y te avisamos cuando haya nuevos estilos o promos.
                    </p>

                    <form onSubmit={handleWaitlistSubmit} className="grid md:grid-cols-3 gap-3">
                        <input
                            value={waitlistName}
                            onChange={(event) => setWaitlistName(event.target.value)}
                            placeholder="Nombre (opcional)"
                                        className="surface-input rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
                        />
                        <input
                            type="email"
                            value={waitlistEmail}
                            onChange={(event) => setWaitlistEmail(event.target.value)}
                            placeholder="Email"
                            className="surface-input rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
                            required
                        />
                        <button
                            type="submit"
                            disabled={isSubmittingWaitlist}
                            className="rounded-xl bg-charcoal-900 py-3 font-semibold text-white transition-colors hover:bg-fuchsia-700 disabled:opacity-60"
                        >
                            {isSubmittingWaitlist ? "Enviando..." : "Quiero avisos"}
                        </button>
                    </form>

                    {waitlistSuccess && (
                        <p className="mt-3 text-sm font-medium text-emerald-700">{waitlistSuccess}</p>
                    )}
                    {waitlistError && (
                        <p className="mt-3 text-sm font-medium text-red-700">{waitlistError}</p>
                    )}
                </div>
            </section>
            <Footer />
        </main>
    )
}

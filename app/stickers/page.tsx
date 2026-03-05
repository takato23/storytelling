"use client"

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react"
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

export default function StickersPage() {
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
    const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
    const [childGender, setChildGender] = useState<StickerGender>("niña")
    const [selectedThemes, setSelectedThemes] = useState<string[]>([])
    const [styleId, setStyleId] = useState<StickerStyleId>(DEFAULT_STICKER_STYLE_ID)

    const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null)
    const [previewError, setPreviewError] = useState<string | null>(null)
    const [previewQualityWarning, setPreviewQualityWarning] = useState<string | null>(null)
    const [previewAttempts, setPreviewAttempts] = useState(0)
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)

    const [customerName, setCustomerName] = useState("")
    const [customerEmail, setCustomerEmail] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [quantity, setQuantity] = useState(1)

    const [recipientName, setRecipientName] = useState("")
    const [line1, setLine1] = useState("")
    const [line2, setLine2] = useState("")
    const [city, setCity] = useState("")
    const [state, setState] = useState("")
    const [postalCode, setPostalCode] = useState("")
    const [countryCode, setCountryCode] = useState("AR")

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

    useEffect(() => {
        const allowedThemes = new Set<string>(availableThemes)
        setSelectedThemes((current) => {
            const filtered = current.filter((theme) => allowedThemes.has(theme))
            if (filtered.length > 0) return filtered
            return Array.from(availableThemes).slice(0, 2)
        })
        setGeneratedPreviewUrl(null)
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
        setPreviewQualityWarning(null)
        setPreviewAttempts(0)
    }

    const handleStyleChange = (nextStyleId: StickerStyleId) => {
        setStyleId(nextStyleId)
        setGeneratedPreviewUrl(null)
        setPreviewQualityWarning(null)
        setPreviewAttempts(0)
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
                    : "Aplicamos corrección automática, pero revisá la cara y las manos."

                const issueText = issues.length > 0 ? ` Detalles detectados: ${issues.join("; ")}.` : ""
                setPreviewQualityWarning(`${qualityLabel}${issueText}`)
            }
        } catch (generationError) {
            setPreviewError(
                generationError instanceof Error
                    ? generationError.message
                    : "No pudimos generar la previsualización.",
            )
            setPreviewQualityWarning(null)
            setPreviewAttempts(0)
        } finally {
            setIsGeneratingPreview(false)
        }
    }

    const handleCheckout = async (event: FormEvent) => {
        event.preventDefault()

        if (!generatedPreviewUrl) {
            setCheckoutError("Generá la previsualización antes de continuar al pago.")
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
                shippingAddress: {
                    recipientName: recipientName || customerName,
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
        <main className="min-h-screen bg-cream-50 pt-24">
            <section className="container mx-auto px-6 py-14">
                <div className="max-w-5xl mx-auto text-center">
                    <span className="inline-block px-4 py-2 rounded-full bg-fuchsia-100 text-fuchsia-800 text-sm font-semibold tracking-wide mb-4 border border-fuchsia-300 shadow-sm">
                        ✨ Stickers Mágicos Personalizados
                    </span>
                    <h1 className="text-4xl md:text-5xl font-serif text-charcoal-900 mb-4 tracking-tight">
                        Convertí su foto en una plancha de stickers única
                    </h1>
                    <p className="text-charcoal-800 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
                        Subí 1 foto, elegí las temáticas y dejamos magia para crear una plancha hermosa manteniendo la carita y los rasgos intactos.
                        Luego comprás la versión impresa con envío a toda Argentina.
                    </p>
                </div>

                {/* MAGIA EN ACCIÓN - EJEMPLO */}
                <div className="max-w-5xl mx-auto mt-14 mb-16 rounded-[2rem] overflow-hidden shadow-sm border border-fuchsia-100 bg-white group">
                        <div className="relative overflow-hidden border-b border-fuchsia-200/70 p-8 sm:p-10 text-center sm:text-left bg-[#1a1a27]/[0.02]">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-200/60 rounded-full blur-[80px] opacity-60 -translate-y-1/2 translate-x-1/3"></div>
                            <div className="relative z-10 space-y-3">
                                <h2 className="text-3xl sm:text-[2.5rem] font-serif text-[#111827] leading-[1.05] tracking-tight flex items-center justify-center sm:justify-start gap-3">
                                    Así funciona la magia ✨
                                </h2>
                                <p className="text-[#111827] text-[17px] sm:text-lg max-w-2xl leading-relaxed font-semibold">
                                    Mirá cómo la magia transforma la foto de referencia en segundos, creando una plancha única con un acabado perfecto.
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

                            <div className="bg-cream-50 rounded-2xl p-5 sm:p-6 border border-fuchsia-100 shadow-sm relative w-full transform rotate-1 hover:rotate-0 transition-transform duration-300 group-hover:-translate-y-1">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-fuchsia-200/50">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                                    <span className="text-[10px] font-mono text-charcoal-700 ml-2 tracking-widest uppercase">prompt_estandar_stickers.txt</span>
                                </div>
                                <p className="text-xs sm:text-sm font-mono text-charcoal-900 leading-relaxed text-left">
                                    <span className="text-fuchsia-600 font-semibold">Diseña una plancha de stickers</span> infantiles premium con 6 stickers troquelables.<br /><br />
                                    Cada sticker debe mostrar al <span className="text-indigo-600 font-semibold">mismo niño de la foto de referencia</span> en roles: Superhéroe, Astronauta, Explorador.<br /><br />
                                    <span className="text-emerald-600 font-semibold">Estilo visual:</span> comic pop contemporáneo.<br /><br />
                                    <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 line-clamp-2 sm:line-clamp-none">Identidad estricta: conservar forma de cara, ojos, nariz y peinado.</span>
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

                <div className="max-w-6xl mx-auto mt-10 grid lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl border border-charcoal-100 p-6 shadow-sm space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-charcoal-900 mb-3">1) Foto del niño/a</h2>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="block w-full text-sm text-charcoal-700 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-100 file:px-4 file:py-2 file:text-indigo-700 file:font-semibold"
                            />
                            <p className="text-xs text-charcoal-500 mt-2">Formato JPG o PNG. Máximo 5MB.</p>
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
                        </div>

                        <button
                            type="button"
                            onClick={handleGeneratePreview}
                            disabled={isGeneratingPreview}
                            className="w-full rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold py-3 transition-colors disabled:opacity-60"
                        >
                            {isGeneratingPreview ? "Generando preview..." : "3) Generar previsualización"}
                        </button>

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
                                Ajustamos automáticamente la generación para mejorar calidad facial.
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl border border-charcoal-100 p-6 shadow-sm space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-charcoal-900 mb-3">4) Preview con marca de agua</h2>
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
                                        Tu preview va a aparecer acá después de subir la foto y elegir temáticas.
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-charcoal-500 mt-2">
                                La marca de agua solo se aplica a esta previsualización. La versión final impresa sale limpia.
                            </p>
                            {previewAttempts > 0 && (
                                <p className="text-xs text-charcoal-500 mt-1">
                                    Intentos de generación: <span className="font-semibold text-charcoal-700">{previewAttempts}</span>
                                </p>
                            )}
                        </div>

                        <form onSubmit={handleCheckout} className="space-y-4">
                            <h3 className="text-lg font-bold text-charcoal-900">Compra y envío</h3>

                            <div className="grid md:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="stickers-name" className="block text-sm font-semibold text-charcoal-700 mb-2">
                                        Nombre
                                    </label>
                                    <input
                                        id="stickers-name"
                                        value={customerName}
                                        onChange={(event) => setCustomerName(event.target.value)}
                                        className="w-full rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                                        className="w-full rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="stickers-phone" className="block text-sm font-semibold text-charcoal-700 mb-2">
                                        Teléfono (opcional)
                                    </label>
                                    <input
                                        id="stickers-phone"
                                        value={customerPhone}
                                        onChange={(event) => setCustomerPhone(event.target.value)}
                                        className="w-full rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="stickers-quantity" className="block text-sm font-semibold text-charcoal-700 mb-2">
                                        Cantidad de planchas
                                    </label>
                                    <input
                                        id="stickers-quantity"
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={quantity}
                                        onChange={(event) => {
                                            const parsed = Number.parseInt(event.target.value, 10)
                                            if (Number.isNaN(parsed)) {
                                                setQuantity(1)
                                                return
                                            }
                                            setQuantity(Math.max(1, Math.min(10, parsed)))
                                        }}
                                        className="w-full rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="stickers-recipient" className="block text-sm font-semibold text-charcoal-700 mb-2">
                                        Nombre para recibir
                                    </label>
                                    <input
                                        id="stickers-recipient"
                                        value={recipientName}
                                        onChange={(event) => setRecipientName(event.target.value)}
                                        className="w-full rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="stickers-line1" className="block text-sm font-semibold text-charcoal-700 mb-2">
                                        Dirección
                                    </label>
                                    <input
                                        id="stickers-line1"
                                        value={line1}
                                        onChange={(event) => setLine1(event.target.value)}
                                        className="w-full rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                                        className="w-full rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                                        className="w-full rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                                        className="w-full rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
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
                                        className="w-full rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="stickers-country" className="block text-sm font-semibold text-charcoal-700 mb-2">
                                        País
                                    </label>
                                    <input
                                        id="stickers-country"
                                        value={countryCode}
                                        onChange={(event) => setCountryCode(event.target.value)}
                                        className="w-full rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                        maxLength={2}
                                        required
                                    />
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
                                    El envío se calcula según provincia/CP en el checkout.
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
                                className="w-full rounded-xl bg-indigo-950 hover:bg-black text-white font-semibold py-3 transition-colors disabled:opacity-60"
                            >
                                {isCheckingOut ? "Redirigiendo a pago..." : "Ir a pagar"}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto mt-8 bg-white rounded-3xl border border-charcoal-100 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-charcoal-900 mb-2">¿Querés avisos de nuevos packs?</h2>
                    <p className="text-charcoal-600 text-sm mb-4">
                        Sumate a la lista y te avisamos cuando publiquemos más estilos o promociones.
                    </p>

                    <form onSubmit={handleWaitlistSubmit} className="grid md:grid-cols-3 gap-3">
                        <input
                            value={waitlistName}
                            onChange={(event) => setWaitlistName(event.target.value)}
                            placeholder="Nombre (opcional)"
                            className="rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
                        />
                        <input
                            type="email"
                            value={waitlistEmail}
                            onChange={(event) => setWaitlistEmail(event.target.value)}
                            placeholder="Email"
                            className="rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
                            required
                        />
                        <button
                            type="submit"
                            disabled={isSubmittingWaitlist}
                            className="rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold py-3 transition-colors disabled:opacity-60"
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

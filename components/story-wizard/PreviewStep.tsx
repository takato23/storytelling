"use client"

import React, { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Clock3, Loader2, ShieldCheck, Sparkles, Truck } from "lucide-react"
import { AlchemistLoading } from "@/components/story-wizard/AlchemistLoading"
import { FlipbookPreview } from "@/components/story-wizard/FlipbookPreview"
import { PrintConfigurator, PrintConfig } from "@/components/features/print/PrintConfigurator"
import { STORIES } from "@/lib/stories"
import { ReadingLevel } from "@/components/features/education/ReadingLevelSelector"
import { useRouter } from "next/navigation"
import { captureEvent } from "@/lib/analytics/events"

const ART_STYLES = [
    { id: "pixar", name: "Pixar 3D", image: "/stories/space-1.jpg" },
    { id: "watercolor", name: "Acuarela", image: "/stories/forest-1.jpg" },
    { id: "vector", name: "Vector Moderno", image: "/stories/soccer-1.jpg" },
    { id: "cartoon", name: "Caricatura", image: "/stories/dino-1.jpg" },
]

interface PreviewStepProps {
    data: {
        image: File | null
        childName: string
        childAge: number
        childGender?: string
        selectedStory: string | null
        selectedStyle: string | null
        familyMembers?: Array<{
            id: string
            role: string
            name: string
            photo: string | null
        }>
        giftData?: {
            type: "digital" | "physical" | null
            message: string
            senderName: string
            recipientName: string
            scheduledDate: string
            scheduledTime: string
        }
        isGift: boolean
        readingLevel: ReadingLevel
        childFeatures?: Record<string, unknown> | null
    }
    printConfig: PrintConfig
    onPrintConfigChange: (config: PrintConfig) => void
    isGenerating: boolean
    generatedPreview: {
        imageUrl: string
        sceneText: string
    } | null
}

interface ShippingAddressForm {
    recipientName: string
    line1: string
    line2: string
    city: string
    state: string
    postalCode: string
    countryCode: string
    phone: string
}

interface QuotePreview {
    subtotal: number
    shipping: number
    total: number
    currency: "USD" | "ARS"
    shippingEtaDays: number | null
}

function formatCurrency(value: number, currency: "USD" | "ARS") {
    if (currency === "USD") return `USD ${value.toFixed(2)}`
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(value)
}

function isAddressReady(address: ShippingAddressForm) {
    return (
        address.recipientName.trim().length >= 2 &&
        address.line1.trim().length >= 4 &&
        address.city.trim().length >= 2 &&
        address.state.trim().length >= 2 &&
        address.postalCode.trim().length >= 3
    )
}

export function PreviewStep({
    data,
    printConfig,
    onPrintConfigChange,
    isGenerating,
    generatedPreview,
}: PreviewStepProps) {
    const story = STORIES.find((s) => s.id === data.selectedStory)
    const style = ART_STYLES.find((s) => s.id === data.selectedStyle)
    const previewUrl = generatedPreview?.imageUrl ?? null
    const familyCount = data.familyMembers?.length || 0
    const [format, setFormat] = useState<"digital" | "print">("print")
    const [currency, setCurrency] = useState<"USD" | "ARS">("ARS")
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [checkoutError, setCheckoutError] = useState<string | null>(null)
    const [quotePreview, setQuotePreview] = useState<QuotePreview | null>(null)
    const [shippingAddress, setShippingAddress] = useState<ShippingAddressForm>({
        recipientName: data.childName || "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        countryCode: "AR",
        phone: "",
    })
    const router = useRouter()

    const PREVIEW_FX = 1200

    const fallbackSubtotal = useMemo(() => {
        if (!story) return 0
        const subtotalArs = format === "print" ? story.printPriceArs : story.digitalPriceArs
        if (currency === "ARS") return subtotalArs
        return Number((subtotalArs / PREVIEW_FX).toFixed(2))
    }, [story, format, currency])

    const fallbackShipping = useMemo(() => {
        if (format !== "print") return 0
        if (currency === "ARS") return 6500
        return Number((6500 / PREVIEW_FX).toFixed(2))
    }, [format, currency])

    const subtotal = quotePreview?.currency === currency ? quotePreview.subtotal : fallbackSubtotal
    const shipping = quotePreview?.currency === currency ? quotePreview.shipping : fallbackShipping
    const total = quotePreview?.currency === currency ? quotePreview.total : subtotal + shipping

    const readingLevelLabel = data.readingLevel === "basic"
        ? "Básico"
        : data.readingLevel === "intermediate"
            ? "Intermedio"
            : "Avanzado"
    const deliveryCopy = format === "print"
        ? `Digital inmediato + impreso ${quotePreview?.shippingEtaDays ? `${quotePreview.shippingEtaDays} días` : "5-10 días"}`
        : "Entrega digital inmediata"
    const checkoutLabel = format === "print" ? "Pagar Libro Impreso + Digital" : "Pagar Versión Digital"
    const checkoutCtaAmount = formatCurrency(total, currency)

    const flipbookPages = useMemo(() => {
        if (!story) return []

        return Array.from({ length: 6 }).map((_, i) => ({
            id: `page-${i}`,
            pageNumber: i + 1,
            imageUrl:
                i === 0 && generatedPreview?.imageUrl
                    ? generatedPreview.imageUrl
                    : "https://images.unsplash.com/photo-1519681393784-d120267933ba",
            text:
                i === 0 && generatedPreview?.sceneText
                    ? generatedPreview.sceneText
                    : `Página ${i + 1}: ${story.shortDescription} - Una escena mágica donde ${data.childName} vive una aventura increíble.`,
        }))
    }, [story, generatedPreview, data.childName])

    const handleCheckout = async () => {
        if (!story || !data.childName || isCheckingOut) return
        if (format === "print" && !isAddressReady(shippingAddress)) {
            setCheckoutError("Completa la dirección de envío para continuar.")
            return
        }

        setIsCheckingOut(true)
        setCheckoutError(null)

        captureEvent("checkout_started", {
            format,
            currency,
            total_estimate: Number(total.toFixed(2)),
        })

        try {
            const childProfile = {
                name: data.childName,
                age: data.childAge,
                child_gender: data.childGender || "neutral",
                detected_features: data.childFeatures ?? {},
            }

            const personalizationPayload = {
                selected_style: data.selectedStyle,
                selected_story: story.id,
                reading_level: data.readingLevel,
                family_members: data.familyMembers ?? [],
                gift_data: data.giftData ?? null,
                preview_image_url: generatedPreview?.imageUrl ?? null,
            }

            const shippingPayload = format === "print"
                ? {
                    recipientName: shippingAddress.recipientName,
                    line1: shippingAddress.line1,
                    line2: shippingAddress.line2 || undefined,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    postalCode: shippingAddress.postalCode,
                    countryCode: shippingAddress.countryCode,
                    phone: shippingAddress.phone || undefined,
                }
                : undefined

            const orderResponse = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    story_id: story.id,
                    child_profile: childProfile,
                    personalization_payload: personalizationPayload,
                    format,
                    print_options: format === "print" ? printConfig : {},
                    currency,
                    payment_provider: "mercadopago",
                    shipping_address: shippingPayload,
                }),
            })

            if (orderResponse.status === 401) {
                captureEvent("auth_redirect_required", { from: "checkout" })
                const nextPath = `${window.location.pathname}${window.location.search}`
                router.push(`/login?next=${encodeURIComponent(nextPath)}`)
                return
            }

            const orderPayload = await orderResponse.json()
            if (!orderResponse.ok || !orderPayload.order_id) {
                throw new Error(orderPayload.message ?? "No se pudo crear la orden.")
            }

            const quoteResponse = await fetch("/api/orders/quote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_id: orderPayload.order_id,
                    story_id: story.id,
                    format,
                    print_options: format === "print" ? printConfig : {},
                    shipping_address: shippingPayload,
                    currency,
                }),
            })

            const quotePayload = await quoteResponse.json()
            if (!quoteResponse.ok || !quotePayload.quote_id) {
                throw new Error(quotePayload.message ?? "No se pudo calcular la cotización.")
            }

            setQuotePreview({
                subtotal: Number(quotePayload.subtotal),
                shipping: Number(quotePayload.shipping_fee),
                total: Number(quotePayload.total),
                currency: quotePayload.currency === "USD" ? "USD" : "ARS",
                shippingEtaDays:
                    quotePayload.shipping_eta_days === null ? null : Number(quotePayload.shipping_eta_days),
            })

            captureEvent("shipping_quote_generated", {
                format,
                has_shipping: Number(quotePayload.shipping_fee) > 0,
                shipping_fee: Number(quotePayload.shipping_fee),
            })

            const checkoutResponse = await fetch("/api/checkout/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quote_id: quotePayload.quote_id,
                }),
            })

            if (checkoutResponse.status === 401) {
                captureEvent("auth_redirect_required", { from: "checkout" })
                const nextPath = `${window.location.pathname}${window.location.search}`
                router.push(`/login?next=${encodeURIComponent(nextPath)}`)
                return
            }

            const checkoutPayload = await checkoutResponse.json()
            if (!checkoutResponse.ok || !checkoutPayload.checkout_url) {
                throw new Error(checkoutPayload.message ?? "No se pudo iniciar el checkout.")
            }

            const provider = checkoutPayload.provider === "stripe" ? "stripe" : "mercadopago"
            captureEvent("checkout_redirected", { provider })
            window.location.href = checkoutPayload.checkout_url
        } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudo iniciar el checkout."
            captureEvent("checkout_error", { message })
            setCheckoutError(message)
        } finally {
            setIsCheckingOut(false)
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-indigo-600/85 mb-3">Paso final</p>
                <h2 className="text-3xl md:text-4xl font-serif text-charcoal-900 mb-2">
                    Tu cuento <span className="wizard-gradient-text">está listo</span> para crearse
                </h2>
                <p className="text-charcoal-600 max-w-2xl mx-auto">
                    Revisa formato, dirección de envío y total antes de ir al checkout.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="wizard-liquid-shell wizard-liquid-sheen rounded-3xl p-4 md:p-6"
            >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-1">
                    <p className="text-sm font-semibold text-charcoal-700">Vista previa inmersiva</p>
                    <div className="wizard-liquid-pill px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.15em] text-indigo-700">
                        {story?.title || "Tu Cuento"}
                    </div>
                </div>
                {isGenerating ? (
                    <AlchemistLoading />
                ) : (
                    <FlipbookPreview title={story?.title || "Tu Cuento"} pages={flipbookPages} />
                )}
            </motion.div>

            <motion.div
                className="wizard-liquid-shell wizard-liquid-sheen wizard-noise rounded-3xl p-5 md:p-7"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="grid lg:grid-cols-2 gap-8 md:gap-10">
                    <div className="space-y-4 md:space-y-5">
                        <div className="wizard-liquid-panel rounded-2xl p-5 md:p-6">
                            <div className="flex items-center gap-4">
                                {previewUrl ? (
                                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 shadow-md ring-2 ring-white">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/20 to-transparent" />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 rounded-2xl shrink-0 bg-gradient-to-br from-indigo-100 to-cyan-100 border border-indigo-100 flex items-center justify-center">
                                        <Sparkles className="w-9 h-9 text-indigo-500" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-bold text-charcoal-900 mb-1">{data.childName || "Protagonista"}</h3>
                                    <p className="text-charcoal-500 text-sm md:text-base">{data.childAge} años</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                                            Nivel {readingLevelLabel}
                                        </span>
                                        {familyCount > 0 && (
                                            <span className="text-xs font-bold px-3 py-1 bg-cyan-50 text-cyan-700 rounded-full border border-cyan-100">
                                                +{familyCount} familiares
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3">
                            <div className="wizard-liquid-soft rounded-xl border border-white/80 p-4 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden shadow-sm shrink-0">
                                    <img src={story?.coverImage} alt={story?.title} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-500/90">Historia</p>
                                    <h4 className="font-bold text-charcoal-900 text-sm leading-tight">{story?.title}</h4>
                                </div>
                            </div>

                            <div className="wizard-liquid-soft rounded-xl border border-white/80 p-4 flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg overflow-hidden shadow-sm shrink-0">
                                    <img src={style?.image} alt={style?.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-600/90">Estilo</p>
                                    <h4 className="font-bold text-charcoal-900 text-sm leading-tight">{style?.name || "Personalizado"}</h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5 md:space-y-6">
                        <div className="wizard-liquid-soft p-1.5 rounded-2xl flex border border-white/75">
                            <button
                                onClick={() => setFormat("digital")}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${format === "digital"
                                    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                                    : "text-charcoal-500 hover:text-charcoal-700 hover:bg-white/50"
                                    }`}
                            >
                                Solo Digital
                            </button>
                            <button
                                onClick={() => setFormat("print")}
                                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${format === "print"
                                    ? "bg-white text-cyan-600 shadow-sm ring-1 ring-black/5"
                                    : "text-charcoal-500 hover:text-charcoal-700 hover:bg-white/50"
                                    }`}
                            >
                                Físico + Digital
                            </button>
                        </div>

                        <div className="wizard-liquid-soft rounded-2xl border border-white/75 p-1.5">
                            <div className="grid grid-cols-2 gap-2">
                                {(["ARS", "USD"] as const).map((currencyOption) => (
                                    <button
                                        key={currencyOption}
                                        onClick={() => setCurrency(currencyOption)}
                                        className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${currency === currencyOption
                                            ? "bg-white text-indigo-900 shadow-sm ring-1 ring-black/5"
                                            : "text-charcoal-500 hover:bg-white/50"
                                            }`}
                                    >
                                        {currencyOption}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-2 text-xs text-charcoal-500">
                                El monto final se confirma en checkout con snapshot de FX del día.
                            </p>
                        </div>

                        {format === "print" ? (
                            <>
                                <PrintConfigurator
                                    config={printConfig}
                                    onChange={onPrintConfigChange}
                                    basePrice={story?.printPriceArs ?? 29990}
                                />
                                <div className="wizard-liquid-panel rounded-2xl p-5 space-y-4">
                                    <h4 className="text-sm font-bold uppercase tracking-wide text-charcoal-700">Datos de envío</h4>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <input
                                            value={shippingAddress.recipientName}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, recipientName: event.target.value }))}
                                            placeholder="Nombre y apellido"
                                            className="rounded-xl border border-charcoal-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        />
                                        <input
                                            value={shippingAddress.phone}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, phone: event.target.value }))}
                                            placeholder="Teléfono (opcional)"
                                            className="rounded-xl border border-charcoal-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        />
                                        <input
                                            value={shippingAddress.line1}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, line1: event.target.value }))}
                                            placeholder="Calle y número"
                                            className="rounded-xl border border-charcoal-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 sm:col-span-2"
                                        />
                                        <input
                                            value={shippingAddress.line2}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, line2: event.target.value }))}
                                            placeholder="Piso, depto (opcional)"
                                            className="rounded-xl border border-charcoal-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 sm:col-span-2"
                                        />
                                        <input
                                            value={shippingAddress.city}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, city: event.target.value }))}
                                            placeholder="Ciudad"
                                            className="rounded-xl border border-charcoal-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        />
                                        <input
                                            value={shippingAddress.state}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, state: event.target.value }))}
                                            placeholder="Provincia"
                                            className="rounded-xl border border-charcoal-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        />
                                        <input
                                            value={shippingAddress.postalCode}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, postalCode: event.target.value }))}
                                            placeholder="Código postal"
                                            className="rounded-xl border border-charcoal-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                        />
                                        <input
                                            value={shippingAddress.countryCode}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, countryCode: event.target.value.toUpperCase() }))}
                                            placeholder="País (AR)"
                                            className="rounded-xl border border-charcoal-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                                            maxLength={2}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="wizard-liquid-panel rounded-3xl p-7 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-white text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm border border-indigo-100">
                                    <Sparkles className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-charcoal-900 mb-2">Versión Digital Mágica</h3>
                                <p className="text-charcoal-600 mb-6 max-w-sm mx-auto">
                                    PDF en alta resolución + lectura web interactiva para tablet y móvil.
                                </p>
                                <div className="text-4xl font-extrabold text-charcoal-900 tracking-tight">
                                    {checkoutCtaAmount}
                                </div>
                            </div>
                        )}

                        <div className="wizard-liquid-panel rounded-2xl p-5 space-y-3">
                            <h4 className="text-sm font-bold uppercase tracking-wide text-charcoal-700">Resumen de compra</h4>
                            <div className="space-y-2 text-sm text-charcoal-600">
                                <div className="flex items-center justify-between">
                                    <span>{format === "print" ? "Libro personalizado" : "Versión digital"}</span>
                                    <span className="font-semibold text-charcoal-800">{formatCurrency(subtotal, currency)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Envío</span>
                                    <span className="font-semibold text-charcoal-800">
                                        {format === "digital" ? "Incluido" : formatCurrency(shipping, currency)}
                                    </span>
                                </div>
                                <div className="border-t border-charcoal-100/70 pt-2 flex items-center justify-between text-base">
                                    <span className="font-semibold text-charcoal-900">Total estimado</span>
                                    <span className="font-extrabold text-charcoal-900">{checkoutCtaAmount}</span>
                                </div>
                            </div>
                            <div className="rounded-xl border border-indigo-100/80 bg-gradient-to-r from-indigo-50/80 to-cyan-50/65 px-3 py-2 text-xs text-indigo-700 font-medium">
                                {format === "print"
                                    ? "El envío se calcula por CP/provincia."
                                    : "Monto final confirmado en checkout."}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                            <div className="wizard-liquid-soft rounded-xl border border-emerald-100 bg-emerald-50/75 px-3 py-2 text-emerald-800 flex items-center gap-2">
                                <Clock3 className="w-4 h-4" />
                                {deliveryCopy}
                            </div>
                            <div className="wizard-liquid-soft rounded-xl border border-indigo-100 bg-indigo-50/75 px-3 py-2 text-indigo-800 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                Checkout seguro
                            </div>
                            <div className="wizard-liquid-soft rounded-xl border border-cyan-100 bg-cyan-50/75 px-3 py-2 text-cyan-800 flex items-center gap-2">
                                {format === "print" ? <Truck className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                                Seguimiento completo del pedido
                            </div>
                        </div>

                        <motion.button
                            onClick={handleCheckout}
                            disabled={isCheckingOut}
                            className="w-full py-4 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-[0_20px_40px_-22px_rgba(79,70,229,0.9)] hover:shadow-[0_24px_46px_-24px_rgba(79,70,229,0.95)] transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isCheckingOut ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Iniciando checkout...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    {checkoutLabel}
                                    <span className="text-sm font-semibold opacity-90">· {checkoutCtaAmount}</span>
                                </>
                            )}
                        </motion.button>
                        <p className="text-xs text-charcoal-500 text-center">
                            Pago protegido por Mercado Pago (con fallback Stripe).
                        </p>
                        {checkoutError && <p className="text-sm text-red-600">{checkoutError}</p>}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

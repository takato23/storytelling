"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { hasSupabaseCredentials } from "@/lib/supabase/env"

type OrderStatus = "preview" | "paid" | "processing" | "completed" | "failed" | string
type OrderFormat = "digital" | "print" | string

interface AccountOrder {
    id: string
    status: OrderStatus
    format: OrderFormat
    amount: number
    currency: "USD" | "ARS" | string
    createdAt: string
    title: string
    coverImage: string | null
    pdfUrl: string | null
    viewerUrl: string | null
}

const STATUS_LABELS: Record<string, string> = {
    draft: "Borrador",
    pending_payment: "Pendiente de pago",
    paid: "Pagado",
    generating: "Generando",
    ready_digital: "Digital listo",
    print_queued: "Cola de impresión",
    in_production: "En producción",
    packed: "Empaquetado",
    shipped: "Enviado",
    delivered: "Entregado",
    refunded: "Reembolsado",
    cancelled: "Cancelado",
    failed: "Fallido",
}

const STATUS_COLORS: Record<string, string> = {
    draft: "bg-charcoal-100 text-charcoal-700",
    pending_payment: "bg-amber-100 text-amber-800",
    paid: "bg-blue-100 text-blue-800",
    generating: "bg-indigo-100 text-indigo-800",
    ready_digital: "bg-teal-100 text-teal-800",
    print_queued: "bg-violet-100 text-violet-800",
    in_production: "bg-purple-100 text-purple-800",
    packed: "bg-sky-100 text-sky-800",
    shipped: "bg-cyan-100 text-cyan-800",
    delivered: "bg-green-100 text-green-800",
    refunded: "bg-rose-100 text-rose-800",
    cancelled: "bg-zinc-100 text-zinc-800",
    failed: "bg-red-100 text-red-800",
}

function formatCurrency(value: number, currency: string) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: currency === "ARS" ? "ARS" : "USD"
    }).format(value)
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("es-AR", {
        dateStyle: "medium",
        timeStyle: "short"
    }).format(new Date(value))
}

function getOrderProgress(status: string, format: string) {
    if (status === "failed" || status === "cancelled" || status === "refunded") return 100

    const shared: Record<string, number> = {
        draft: 10,
        pending_payment: 20,
        paid: 35,
        generating: 55,
        ready_digital: format === "digital" ? 100 : 65,
        print_queued: 72,
        in_production: 80,
        packed: 88,
        shipped: 95,
        delivered: 100,
    }

    return shared[status] ?? 20
}

function getNextStep(status: string, format: string) {
    if (status === "pending_payment") return "Completar pago"
    if (status === "generating") return "Preparando contenido digital"
    if (status === "ready_digital" && format === "digital") return "Listo para leer"
    if (status === "print_queued") return "En cola de impresión"
    if (status === "in_production") return "Imprimiendo libro"
    if (status === "packed") return "Preparando despacho"
    if (status === "shipped") return "En tránsito"
    if (status === "delivered") return "Entregado"
    if (status === "failed") return "Requiere soporte"
    return "Procesando pedido"
}

type OrderFilter = "all" | "active" | "digital_ready" | "print"

export default function AccountOrdersPage() {
    const router = useRouter()
    const supabase = useMemo(() => {
        if (!hasSupabaseCredentials()) return null
        return createSupabaseBrowserClient()
    }, [])

    const [orders, setOrders] = useState<AccountOrder[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filter, setFilter] = useState<OrderFilter>("all")

    useEffect(() => {
        let mounted = true

        async function loadOrders() {
            setIsLoading(true)
            setError(null)

            const response = await fetch("/api/me/orders", { cache: "no-store" })
            if (response.status === 401) {
                router.replace("/login?next=%2Fcuenta%2Fpedidos")
                return
            }

            const payload = await response.json()
            if (!response.ok) {
                if (mounted) {
                    setError(payload.error ?? "No se pudieron cargar tus pedidos.")
                    setIsLoading(false)
                }
                return
            }

            if (mounted) {
                setOrders(payload.orders ?? [])
                setIsLoading(false)
            }
        }

        void loadOrders()
        return () => {
            mounted = false
        }
    }, [router])

    async function handleSignOut() {
        if (supabase) {
            await supabase.auth.signOut()
        }
        router.push("/")
        router.refresh()
    }

    const filteredOrders = useMemo(() => {
        if (filter === "all") return orders
        if (filter === "active") {
            return orders.filter((order) => !["delivered", "cancelled", "failed", "refunded"].includes(order.status))
        }
        if (filter === "digital_ready") {
            return orders.filter((order) => ["ready_digital", "print_queued", "in_production", "packed", "shipped", "delivered"].includes(order.status))
        }
        if (filter === "print") {
            return orders.filter((order) => order.format === "print")
        }
        return orders
    }, [orders, filter])

    return (
        <main className="min-h-screen bg-cream-50 px-4 py-12">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-3xl border border-charcoal-100 shadow-lg p-6 md:p-8 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-serif text-charcoal-900">Mis pedidos</h1>
                        <p className="text-charcoal-500 mt-1">Historial de compras y estado de producción.</p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="px-4 py-2 rounded-xl border border-charcoal-200 text-charcoal-700 hover:bg-charcoal-50 transition-colors"
                    >
                        Cerrar sesión
                    </button>
                </div>

                {isLoading && (
                    <div className="bg-white rounded-3xl border border-charcoal-100 shadow-lg p-10 text-charcoal-500">
                        Cargando pedidos...
                    </div>
                )}

                {!isLoading && error && (
                    <div className="bg-white rounded-3xl border border-red-200 shadow-lg p-6 text-red-700">
                        {error}
                    </div>
                )}

                {!isLoading && !error && orders.length === 0 && (
                    <div className="bg-white rounded-3xl border border-charcoal-100 shadow-lg p-10 text-center">
                        <p className="text-charcoal-600 mb-4">Todavía no tienes pedidos.</p>
                        <Link
                            href="/nuestros-libros"
                            className="inline-flex px-5 py-3 rounded-xl bg-indigo-950 text-white font-semibold hover:bg-black transition-colors"
                        >
                            Explorar cuentos
                        </Link>
                    </div>
                )}

                {!isLoading && !error && orders.length > 0 && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-charcoal-100 p-3 flex flex-wrap gap-2">
                            {[
                                { id: "all", label: "Todos" },
                                { id: "active", label: "Activos" },
                                { id: "digital_ready", label: "Digital listo" },
                                { id: "print", label: "Impresos" },
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setFilter(option.id as OrderFilter)}
                                    className={`px-3 py-2 rounded-xl text-sm font-semibold transition ${filter === option.id
                                            ? "bg-indigo-950 text-white"
                                            : "bg-charcoal-50 text-charcoal-700 hover:bg-charcoal-100"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {filteredOrders.map((order) => (
                            <article
                                key={order.id}
                                className="bg-white rounded-3xl border border-charcoal-100 shadow-md p-5 md:p-6 flex flex-col md:flex-row gap-5"
                            >
                                <div className="w-full md:w-32 h-40 md:h-44 rounded-2xl bg-charcoal-100 overflow-hidden shrink-0">
                                    {order.coverImage ? (
                                        <img
                                            src={order.coverImage}
                                            alt={order.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-charcoal-400 text-sm">
                                            Sin portada
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                                        <div>
                                            <h2 className="text-xl font-semibold text-charcoal-900">{order.title}</h2>
                                            <p className="text-sm text-charcoal-500">Pedido #{order.id.slice(0, 8)}</p>
                                        </div>
                                        <span
                                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status] ?? "bg-charcoal-100 text-charcoal-700"}`}
                                        >
                                            {STATUS_LABELS[order.status] ?? order.status}
                                        </span>
                                    </div>

                                    <div className="text-sm text-charcoal-600 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        <p>Formato: {order.format === "print" ? "Impreso + Digital" : "Digital"}</p>
                                        <p>Fecha: {formatDate(order.createdAt)}</p>
                                        <p>Total: {formatCurrency(order.amount, order.currency)}</p>
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex items-center justify-between text-xs text-charcoal-500 mb-1">
                                            <span>{getNextStep(order.status, order.format)}</span>
                                            <span>{getOrderProgress(order.status, order.format)}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-charcoal-100 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-coral-400"
                                                style={{ width: `${getOrderProgress(order.status, order.format)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-4">
                                        {order.pdfUrl && (
                                            <a
                                                href={order.pdfUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex text-sm font-semibold text-indigo-700 hover:underline"
                                            >
                                                Descargar PDF
                                            </a>
                                        )}
                                        {order.viewerUrl && (
                                            <a
                                                href={order.viewerUrl}
                                                className="inline-flex text-sm font-semibold text-emerald-700 hover:underline"
                                            >
                                                Leer en línea
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                        {filteredOrders.length === 0 && (
                            <div className="bg-white rounded-2xl border border-charcoal-100 p-6 text-sm text-charcoal-600">
                                No hay pedidos para este filtro.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    )
}

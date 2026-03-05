"use client"

import Link from "next/link"
import { FormEvent, Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { hasSupabaseCredentials } from "@/lib/supabase/env"

function getSafeNextPath(rawPath: string | null, fallback = "/cuenta/pedidos") {
    if (!rawPath) return fallback
    if (!rawPath.startsWith("/") || rawPath.startsWith("//")) return fallback
    return rawPath
}

function LoginPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const isSupabaseReady = hasSupabaseCredentials()
    const nextPath = getSafeNextPath(searchParams.get("next"))

    const supabase = useMemo(() => {
        if (!isSupabaseReady) return null
        return createSupabaseBrowserClient()
    }, [isSupabaseReady])

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)

        if (!supabase) {
            setError("Falta configurar Supabase en el entorno.")
            return
        }

        setIsLoading(true)
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        setIsLoading(false)

        if (signInError) {
            setError(signInError.message)
            return
        }

        router.replace(nextPath)
        router.refresh()
    }

    return (
        <main className="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md bg-white rounded-3xl border border-charcoal-100 shadow-xl p-8">
                <h1 className="text-3xl font-serif text-charcoal-900 mb-2">Entrar</h1>
                <p className="text-charcoal-500 mb-8">Accede a tu cuenta para continuar con tu compra.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-charcoal-700 mb-1">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            className="w-full rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-charcoal-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            className="w-full rounded-xl border border-charcoal-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-xl bg-indigo-950 text-white py-3 font-semibold hover:bg-black transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Entrando..." : "Entrar"}
                    </button>
                </form>

                <p className="text-sm text-charcoal-500 mt-6">
                    ¿No tienes cuenta?{" "}
                    <Link
                        href={`/register?next=${encodeURIComponent(nextPath)}`}
                        className="text-indigo-700 font-semibold hover:underline"
                    >
                        Regístrate
                    </Link>
                </p>
            </div>
        </main>
    )
}

function LoadingFallback() {
    return (
        <main className="min-h-screen bg-cream-50 flex items-center justify-center px-4 py-16">
            <div className="w-full max-w-md bg-white rounded-3xl border border-charcoal-100 shadow-xl p-8">
                <p className="text-charcoal-500">Cargando...</p>
            </div>
        </main>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <LoginPageContent />
        </Suspense>
    )
}

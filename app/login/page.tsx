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
        <main className="page-shell flex min-h-screen items-center justify-center px-4 py-16">
            <div className="surface-panel w-full max-w-md rounded-3xl p-8">
                <h1 className="mb-2 text-3xl font-serif text-[var(--text-primary)]">Entrar</h1>
                <p className="mb-8 text-[var(--text-secondary)]">Accede a tu cuenta para usar tus previews gratis y continuar con tu compra.</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                            className="form-field"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            className="form-field"
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
                        className="public-button-primary w-full rounded-xl py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoading ? "Entrando..." : "Entrar"}
                    </button>
                </form>

                <p className="mt-6 text-sm text-[var(--text-secondary)]">
                    ¿No tienes cuenta?{" "}
                    <Link
                        href={`/register?next=${encodeURIComponent(nextPath)}`}
                        className="public-link font-semibold hover:underline"
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
        <main className="page-shell flex min-h-screen items-center justify-center px-4 py-16">
            <div className="surface-panel w-full max-w-md rounded-3xl p-8">
                <p className="text-[var(--text-secondary)]">Cargando...</p>
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

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

function RegisterPageContent() {
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
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setSuccess(null)

        if (!supabase) {
            setError("Falta configurar Supabase en el entorno.")
            return
        }

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.")
            return
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.")
            return
        }

        setIsLoading(true)
        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/cuenta/pedidos`,
            }
        })
        setIsLoading(false)

        if (signUpError) {
            setError(signUpError.message)
            return
        }

        if (data.session) {
            router.replace(nextPath)
            router.refresh()
            return
        }

        setSuccess("Cuenta creada. Revisa tu email para confirmar el acceso.")
    }

    return (
        <main className="page-shell flex min-h-screen items-center justify-center px-4 py-16">
            <div className="surface-panel w-full max-w-md rounded-3xl p-8">
                <h1 className="mb-2 text-3xl font-serif text-[var(--text-primary)]">Crear cuenta</h1>
                <p className="mb-8 text-[var(--text-secondary)]">Regístrate para desbloquear tus previews gratis y seguir tus pedidos.</p>

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
                            autoComplete="new-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                            className="form-field"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-[var(--text-secondary)]">
                            Repetir contraseña
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            required
                            className="form-field"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    {success && (
                        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                            {success}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="public-button-primary w-full rounded-xl py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoading ? "Creando cuenta..." : "Crear cuenta"}
                    </button>
                </form>

                <p className="mt-6 text-sm text-[var(--text-secondary)]">
                    ¿Ya tienes cuenta?{" "}
                    <Link
                        href={`/login?next=${encodeURIComponent(nextPath)}`}
                        className="public-link font-semibold hover:underline"
                    >
                        Inicia sesión
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

export default function RegisterPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <RegisterPageContent />
        </Suspense>
    )
}

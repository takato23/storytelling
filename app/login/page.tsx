"use client"

import Link from "next/link"
import { FormEvent, Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { hasSupabaseCredentials } from "@/lib/supabase/env"
import { BookOpen, Sparkles } from "lucide-react"

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
        <main className="min-h-screen bg-[var(--play-surface)] flex items-center justify-center px-4 py-16 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-[var(--play-primary)]/[0.05] rounded-full blur-[100px]" />
                <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-[var(--play-secondary-container)]/[0.08] rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Brand header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--play-primary)] text-white mb-4 shadow-lg shadow-[var(--play-primary)]/20">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold font-serif text-[var(--play-text-main)]">Bienvenido de vuelta</h1>
                    <p className="mt-2 text-[var(--play-text-muted)]">Accede para usar tus previews gratis y continuar con tu compra.</p>
                </div>

                {/* Login card */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[var(--play-radius-panel)] p-8 shadow-[var(--shadow-card)] border border-white/60">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[var(--play-text-main)]">
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
                                placeholder="tu@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[var(--play-text-main)]">
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
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="gummy-button play-primary-button w-full rounded-xl py-3.5 font-bold text-base transition-all disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Entrar
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-[var(--play-outline)]/20 text-center">
                        <p className="text-sm text-[var(--play-text-muted)]">
                            ¿No tienes cuenta?{" "}
                            <Link
                                href={`/register?next=${encodeURIComponent(nextPath)}`}
                                className="font-bold text-[var(--play-primary)] hover:text-[var(--play-primary-strong)] transition-colors hover:underline"
                            >
                                Regístrate gratis
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
}

function LoadingFallback() {
    return (
        <main className="min-h-screen bg-[var(--play-surface)] flex items-center justify-center px-4 py-16">
            <div className="bg-white/80 backdrop-blur-xl w-full max-w-md rounded-[var(--play-radius-panel)] p-8 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-center gap-3 text-[var(--play-text-muted)]">
                    <div className="w-5 h-5 border-2 border-[var(--play-primary)]/30 border-t-[var(--play-primary)] rounded-full animate-spin" />
                    Cargando...
                </div>
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

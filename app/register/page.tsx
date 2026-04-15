"use client"

import Link from "next/link"
import { FormEvent, Suspense, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { hasSupabaseCredentials } from "@/lib/supabase/env"
import { Sparkles, UserPlus } from "lucide-react"

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
        <main className="min-h-screen bg-[var(--play-surface)] flex items-center justify-center px-4 py-16 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[var(--play-secondary-container)]/[0.06] rounded-full blur-[100px]" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[400px] h-[400px] bg-[var(--play-primary)]/[0.05] rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                {/* Brand header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--play-secondary-container)] text-[var(--play-text-main)] mb-4 shadow-lg shadow-[var(--play-secondary-container)]/20">
                        <UserPlus className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold font-serif text-[var(--play-text-main)]">Crear cuenta</h1>
                    <p className="mt-2 text-[var(--play-text-muted)]">Regístrate para desbloquear tus previews gratis y seguir tus pedidos.</p>
                </div>

                {/* Register card */}
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
                                autoComplete="new-password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                                className="form-field"
                                placeholder="Mínimo 6 caracteres"
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-semibold text-[var(--play-text-main)]">
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
                                placeholder="Repetí tu contraseña"
                            />
                        </div>

                        {error && (
                            <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                                {error}
                            </p>
                        )}

                        {success && (
                            <p role="status" className="text-sm text-[var(--play-accent-success)] bg-[var(--play-accent-success-light)]/30 border border-[var(--play-accent-success-light)] rounded-xl px-4 py-2.5">
                                {success}
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
                                    Creando cuenta...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Crear cuenta
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-[var(--play-outline)]/20 text-center">
                        <p className="text-sm text-[var(--play-text-muted)]">
                            ¿Ya tienes cuenta?{" "}
                            <Link
                                href={`/login?next=${encodeURIComponent(nextPath)}`}
                                className="font-bold text-[var(--play-primary)] hover:text-[var(--play-primary-strong)] transition-colors hover:underline"
                            >
                                Inicia sesión
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

export default function RegisterPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <RegisterPageContent />
        </Suspense>
    )
}

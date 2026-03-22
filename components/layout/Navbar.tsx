"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { LogOut, Menu, ShoppingBag, User, X } from "lucide-react"
import { useCart } from "@/lib/contexts/CartContext"
import { hasSupabaseCredentials } from "@/lib/supabase/env"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

export function Navbar() {
    const { itemCount, toggleCart } = useCart()
    const [isScrolled, setIsScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<"admin" | "customer" | null>(null)

    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20)
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    useEffect(() => {
        if (!hasSupabaseCredentials()) return

        const supabase = createSupabaseBrowserClient()
        let mounted = true

        const syncUserState = async () => {
            const { data } = await supabase.auth.getUser()
            if (!mounted) return

            const sessionUser = data.user
            setUserEmail(sessionUser?.email ?? null)

            if (!sessionUser) {
                setUserRole(null)
                return
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", sessionUser.id)
                .maybeSingle()

            if (!mounted) return
            setUserRole(profile?.role === "admin" ? "admin" : "customer")
        }

        void syncUserState()

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserEmail(session?.user?.email ?? null)
            if (!session?.user) {
                setUserRole(null)
                return
            }
            void syncUserState()
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [])

    const handleSignOut = async () => {
        if (!hasSupabaseCredentials()) {
            router.push("/")
            return
        }

        const supabase = createSupabaseBrowserClient()
        await supabase.auth.signOut()
        setUserEmail(null)
        setUserRole(null)
        router.push("/")
        router.refresh()
    }

    const navLinks = [
        { name: "Inicio", href: "/" },
        { name: "Cómo funciona", href: "/#como-funciona" },
        { name: "Stickers", href: "/stickers" },
        { name: "Catálogo", href: "/nuestros-libros" },
        { name: "Mis cuentos", href: "/cuenta/pedidos" },
    ]

    const closeMobileMenu = () => setMobileMenuOpen(false)

    const isActiveLink = (href: string) => {
        if (!pathname) return false
        if (href === "/") return pathname === "/"
        return pathname === href || pathname.startsWith(`${href}/`)
    }

    return (
        <>
            <header className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${isScrolled ? "pt-3" : "pt-4"}`}>
                <div className="mx-auto max-w-7xl px-4 md:px-6">
                    <div className="play-nav-shell">
                        <nav className="flex items-center justify-between gap-4 px-4 py-3 md:px-5">
                            <Link href="/" className="flex items-center gap-3" onClick={closeMobileMenu}>
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--play-primary)] text-lg shadow-[0_10px_20px_-14px_rgba(0,93,167,0.55)]">
                                    <span className="text-white">✨</span>
                                </div>
                                <div className="leading-none">
                                    <p className="text-xl font-black tracking-tight text-[var(--play-primary)]">El Cuento Mágico</p>
                                    <p className="hidden text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--play-text-muted)] md:block">
                                        Historias personalizadas
                                    </p>
                                </div>
                            </Link>

                            <div className="hidden items-center gap-2 lg:flex">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={`play-nav-link ${isActiveLink(link.href) ? "play-nav-link-active" : ""}`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 md:gap-3">
                                <ThemeToggle />

                                <Link
                                    href="/crear"
                                    className="gummy-button play-secondary-button hidden items-center gap-2 px-5 py-3 text-sm lg:inline-flex"
                                >
                                    <span>✨</span>
                                    Crear cuento
                                </Link>

                                {userEmail ? (
                                    <div className="hidden items-center gap-3 sm:flex">
                                        {userRole === "admin" && (
                                            <Link href="/admin" className="text-sm font-semibold text-[var(--play-text-muted)] transition-colors hover:text-[var(--play-primary)]">
                                                Backoffice
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleSignOut}
                                            className="flex items-center gap-2 text-sm font-semibold text-[var(--play-text-muted)] transition-colors hover:text-[var(--play-primary)]"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span>Salir</span>
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="hidden items-center gap-2 text-sm font-semibold text-[var(--play-text-muted)] transition-colors hover:text-[var(--play-primary)] sm:flex"
                                    >
                                        <User className="h-5 w-5" />
                                        <span>Entrar</span>
                                    </Link>
                                )}

                                <button
                                    onClick={toggleCart}
                                    className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--play-outline)] bg-[var(--play-surface-lowest)] text-[var(--play-text-muted)] shadow-[0_10px_24px_-18px_rgba(0,93,167,0.2)] transition-all hover:scale-[1.03] hover:text-[var(--play-primary)]"
                                >
                                    <ShoppingBag className="h-5 w-5" />
                                    {itemCount > 0 && (
                                        <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--play-primary)] text-[10px] font-bold text-white">
                                            {itemCount}
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => setMobileMenuOpen((prev) => !prev)}
                                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--play-outline)] bg-[var(--play-surface-lowest)] text-[var(--play-text-muted)] shadow-[0_10px_24px_-18px_rgba(0,93,167,0.2)] transition-all hover:scale-[1.03] lg:hidden"
                                >
                                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                                </button>
                            </div>
                        </nav>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.22 }}
                        className="fixed inset-0 z-40 bg-[#f6f6ff]/88 px-4 pb-6 pt-24 backdrop-blur-md lg:hidden"
                    >
                        <div className="play-panel flex h-full flex-col gap-5 overflow-y-auto p-6">
                            <Link
                                href="/crear"
                                onClick={closeMobileMenu}
                                className="gummy-button play-secondary-button inline-flex items-center justify-center gap-2 px-5 py-4 text-base"
                            >
                                <span>✨</span>
                                Crear cuento
                            </Link>

                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={closeMobileMenu}
                                    className={`rounded-2xl border px-4 py-3 text-base font-bold ${
                                        isActiveLink(link.href)
                                            ? "border-[var(--play-primary)] bg-[var(--play-primary-container)]/20 text-[var(--play-primary)]"
                                            : "border-[var(--play-outline)] bg-[var(--play-surface-lowest)] text-[var(--play-text-main)]"
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            ))}

                            {userEmail ? (
                                <>
                                    {userRole === "admin" && (
                                        <Link href="/admin" onClick={closeMobileMenu} className="rounded-2xl border border-[var(--play-outline)] bg-[var(--play-surface-lowest)] px-4 py-3 text-base font-bold text-[var(--play-text-main)]">
                                            Backoffice
                                        </Link>
                                    )}
                                    <button
                                        onClick={handleSignOut}
                                        className="rounded-2xl border border-[var(--play-outline)] bg-[var(--play-surface-lowest)] px-4 py-3 text-left text-base font-bold text-[var(--play-text-main)]"
                                    >
                                        Salir
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    onClick={closeMobileMenu}
                                    className="rounded-2xl border border-[var(--play-outline)] bg-[var(--play-surface-lowest)] px-4 py-3 text-base font-bold text-[var(--play-text-main)]"
                                >
                                    Entrar
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { LogOut, Menu, User, X } from "lucide-react"
import { BrandWordmark } from "@/components/layout/BrandWordmark"
import { siteContent } from "@/lib/site-content"
import { hasSupabaseCredentials } from "@/lib/supabase/env"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<"admin" | "customer" | null>(null)

    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 12)
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

    const navLinks = siteContent.navigation.publicLinks

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
                    <div className="nido-nav-shell">
                        <nav className="flex items-center justify-between gap-4 px-4 py-3 md:px-5">
                            <Link href="/" className="min-w-0 flex-1 lg:flex-none" onClick={closeMobileMenu}>
                                <BrandWordmark
                                    size="nav"
                                    tagline={siteContent.brand.navbarTagline}
                                    className="max-w-max"
                                />
                            </Link>

                            <div className="hidden items-center gap-1.5 lg:flex">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={`nido-nav-link ${isActiveLink(link.href) ? "nido-nav-link-active" : ""}`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 md:gap-3">
                                <Link
                                    href="/crear"
                                    className="nido-button-primary hidden items-center gap-2 px-5 py-3 text-sm lg:inline-flex"
                                >
                                    Crear cuento
                                </Link>

                                {userEmail ? (
                                    <div className="hidden items-center gap-3 sm:flex">
                                        {userRole === "admin" && (
                                            <Link href="/admin" className="nido-inline-link text-sm font-semibold">
                                                Backoffice
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleSignOut}
                                            className="nido-inline-link flex items-center gap-2 text-sm font-semibold"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span>Salir</span>
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="nido-inline-link hidden items-center gap-2 text-sm font-semibold sm:flex"
                                    >
                                        <User className="h-5 w-5" />
                                        <span>Entrar</span>
                                    </Link>
                                )}
                                <button
                                    onClick={() => setMobileMenuOpen((prev) => !prev)}
                                    className="nido-icon-button lg:hidden"
                                    aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
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
                        className="nido-mobile-overlay fixed inset-0 z-40 px-4 pb-6 pt-24 backdrop-blur-md lg:hidden"
                    >
                        <div className="nido-mobile-panel mx-auto flex h-full max-w-xl flex-col gap-5 overflow-y-auto p-6">
                            <BrandWordmark size="footer" tagline={siteContent.brand.mobileTagline} />

                            <Link
                                href="/crear"
                                onClick={closeMobileMenu}
                                className="nido-button-primary inline-flex items-center justify-center gap-2 px-5 py-4 text-base"
                            >
                                Crear cuento
                            </Link>

                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={closeMobileMenu}
                                    className={`nido-mobile-link ${isActiveLink(link.href) ? "nido-mobile-link-active" : ""}`}
                                >
                                    {link.name}
                                </Link>
                            ))}

                            {userEmail ? (
                                <>
                                    {userRole === "admin" && (
                                        <Link href="/admin" onClick={closeMobileMenu} className="nido-mobile-link">
                                            Backoffice
                                        </Link>
                                    )}
                                    <button onClick={handleSignOut} className="nido-mobile-link text-left">
                                        Salir
                                    </button>
                                </>
                            ) : (
                                <Link href="/login" onClick={closeMobileMenu} className="nido-mobile-link">
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

"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { LogOut, Menu, ShoppingBag, User, X } from "lucide-react"
import { useCart } from "@/lib/contexts/CartContext"
import { hasSupabaseCredentials } from "@/lib/supabase/env"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"

export function Navbar() {
    const { itemCount, toggleCart } = useCart()
    const [isScrolled, setIsScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [userRole, setUserRole] = useState<"admin" | "customer" | null>(null)

    const router = useRouter()

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
        { name: "Home", href: "/" },
        { name: "Libros", href: "/nuestros-libros" },
        { name: "Stickers", href: "/stickers" },
        { name: "My Books", href: "/cuenta/pedidos" },
        { name: "Contacto", href: "/contacto" },
    ]
    const closeMobileMenu = () => setMobileMenuOpen(false)

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "py-3" : "py-5"
                    }`}
            >
                <div className="container mx-auto px-6">
                    <div
                        className={`relative overflow-hidden rounded-[28px] border backdrop-blur-2xl supports-[backdrop-filter]:backdrop-saturate-150 transition-all duration-300 ${isScrolled
                            ? "bg-white/70 border-white/65 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.55),inset_0_1px_0_rgba(255,255,255,0.75)]"
                            : "bg-white/45 border-white/55 shadow-[0_24px_56px_-34px_rgba(15,23,42,0.45),inset_0_1px_0_rgba(255,255,255,0.7)]"
                            }`}
                    >
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/45 via-white/15 to-transparent" />
                        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/95 to-transparent" />
                        <nav className="relative flex items-center justify-between px-4 sm:px-5 py-3">
                            <Link href="/" className="relative z-50 flex items-center gap-3 group">
                                <div className="relative w-11 h-11 rounded-[14px] border border-white/80 bg-white/55 backdrop-blur-xl shadow-[0_16px_30px_-18px_rgba(15,23,42,0.7),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-500 ease-out group-hover:scale-110 group-hover:-rotate-3">
                                    <div className="absolute inset-[1px] rounded-[12px] bg-gradient-to-br from-white/65 via-white/20 to-transparent" />
                                    <img
                                        src="/logo-storymagic.png"
                                        alt="StoryMagic Logo"
                                        className="relative z-10 w-full h-full p-1.5 object-contain drop-shadow-[0_4px_6px_rgba(30,41,59,0.25)]"
                                    />
                                </div>
                                <span className="text-xl font-bold tracking-tight text-charcoal-900 transition-all duration-300 group-hover:text-coral-500">
                                    StoryMagic
                                </span>
                            </Link>

                            <div className="hidden lg:flex items-center gap-8">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        onClick={closeMobileMenu}
                                        className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all ${isScrolled
                                            ? "text-charcoal-700 hover:text-coral-500 hover:bg-white/55"
                                            : "text-charcoal-800 hover:text-coral-500 hover:bg-white/45"
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 sm:gap-4">
                                {userEmail ? (
                                    <div className="hidden sm:flex items-center gap-3">
                                        {userRole === "admin" && (
                                            <Link
                                                href="/admin"
                                                className="flex items-center gap-2 text-sm font-medium text-charcoal-700 hover:text-coral-500 transition-colors"
                                            >
                                                <span>Backoffice</span>
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleSignOut}
                                            className="flex items-center gap-2 text-sm font-medium text-charcoal-700 hover:text-coral-500 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            <span>Salir</span>
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={closeMobileMenu}
                                        className="hidden sm:flex items-center gap-2 text-sm font-medium text-charcoal-700 hover:text-coral-500 transition-colors"
                                    >
                                        <User className="w-5 h-5" />
                                        <span>Entrar</span>
                                    </Link>
                                )}

                                <button
                                    onClick={toggleCart}
                                    className="relative p-2.5 rounded-xl border border-white/65 bg-white/45 hover:bg-white/70 transition-all text-charcoal-700 group shadow-[0_12px_20px_-16px_rgba(15,23,42,0.7)]"
                                >
                                    <ShoppingBag className="w-5 h-5 group-hover:text-coral-500 transition-colors" />
                                    {itemCount > 0 && (
                                        <span className="absolute top-0 right-0 w-4 h-4 bg-coral-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                                            {itemCount}
                                        </span>
                                    )}
                                </button>

                                <button
                                    className="lg:hidden p-2.5 rounded-xl border border-white/65 bg-white/50 text-charcoal-700 shadow-[0_12px_20px_-16px_rgba(15,23,42,0.7)]"
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                >
                                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>
                            </div>
                        </nav>
                    </div>
                </div>
            </header>

            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: "100%" }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: "100%" }}
                        transition={{ type: "tween", duration: 0.3 }}
                        className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-sm pt-24 px-3 lg:hidden"
                    >
                        <div className="h-full rounded-[28px] border border-white/60 bg-white/75 backdrop-blur-2xl shadow-[0_25px_60px_-25px_rgba(15,23,42,0.65)] p-6 flex flex-col gap-6 text-lg font-medium overflow-y-auto">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={closeMobileMenu}
                                    className="text-charcoal-800 border-b border-charcoal-100 pb-4"
                                >
                                    {link.name}
                                </Link>
                            ))}
                            {userEmail ? (
                                <>
                                    {userRole === "admin" && (
                                        <Link href="/admin" className="text-charcoal-800 border-b border-charcoal-100 pb-4">
                                            Backoffice
                                        </Link>
                                    )}
                                    <button
                                        onClick={handleSignOut}
                                        className="text-left text-charcoal-800 border-b border-charcoal-100 pb-4"
                                    >
                                        Salir
                                    </button>
                                </>
                            ) : (
                                <Link href="/login" className="text-charcoal-800 border-b border-charcoal-100 pb-4">
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

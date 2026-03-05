import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseCredentials, hasSupabaseCredentials } from "@/lib/supabase/env"

const AUTH_PAGES = new Set(["/login", "/register"])
const PROTECTED_PREFIXES = ["/cuenta", "/admin"]

function isProtectedPath(pathname: string): boolean {
    return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isSafeRelativePath(path: string | null): path is string {
    if (!path) return false
    return path.startsWith("/") && !path.startsWith("//")
}

export async function updateSession(request: NextRequest) {
    if (!hasSupabaseCredentials()) {
        return NextResponse.next({ request })
    }

    const { url, anonKey } = getSupabaseCredentials()
    let response = NextResponse.next({ request })

    const supabase = createServerClient(url, anonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                response = NextResponse.next({ request })
                cookiesToSet.forEach(({ name, value, options }) => {
                    response.cookies.set(name, value, options)
                })
            }
        }
    })

    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user && isProtectedPath(request.nextUrl.pathname)) {
        const loginUrl = request.nextUrl.clone()
        loginUrl.pathname = "/login"
        loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`)
        return NextResponse.redirect(loginUrl)
    }

    if (user && AUTH_PAGES.has(request.nextUrl.pathname)) {
        const requestedNext = request.nextUrl.searchParams.get("next")
        if (isSafeRelativePath(requestedNext)) {
            return NextResponse.redirect(new URL(requestedNext, request.url))
        }

        return NextResponse.redirect(new URL("/cuenta/pedidos", request.url))
    }

    return response
}

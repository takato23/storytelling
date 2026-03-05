import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabaseCredentials } from "@/lib/supabase/env"

export async function createSupabaseServerClient() {
    const cookieStore = await cookies()
    const { url, anonKey } = getSupabaseCredentials()

    return createServerClient(url, anonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options)
                    })
                } catch {
                    // Server components cannot always set cookies.
                }
            }
        }
    })
}

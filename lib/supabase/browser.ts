import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseCredentials } from "@/lib/supabase/env"

let client: SupabaseClient | null = null

export function createSupabaseBrowserClient(): SupabaseClient {
    if (client) {
        return client
    }

    const { url, anonKey } = getSupabaseCredentials()
    client = createBrowserClient(url, anonKey)

    return client
}

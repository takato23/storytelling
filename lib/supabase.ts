import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/config";

export async function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignore set errors when called from contexts that don't allow response cookies.
        }
      },
    },
  });
}

export function createSupabaseAdminClient(): SupabaseClient {
  const { url, serviceRoleKey } = getSupabaseConfig();

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

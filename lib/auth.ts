import type { User } from "@supabase/supabase-js";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiError(401, "unauthorized", "Authentication required");
  }

  return { user, supabase };
}

function hasAdminClaim(user: User): boolean {
  const roleFromAppMeta = user.app_metadata?.role;
  const roleFromUserMeta = user.user_metadata?.role;
  return roleFromAppMeta === "admin" || roleFromUserMeta === "admin";
}

export async function requireAdminUser() {
  const { user, supabase } = await requireAuthenticatedUser();

  if (hasAdminClaim(user)) {
    return { user, supabase };
  }

  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data || data.role !== "admin") {
    throw new ApiError(403, "forbidden", "Admin role required");
  }

  return { user, supabase };
}

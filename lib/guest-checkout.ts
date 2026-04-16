import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/auth";

export interface CheckoutIdentity {
  userId: string | null;
  customerEmail: string;
  isGuest: boolean;
}

/**
 * Resolve checkout identity. If user is authenticated, use their ID.
 * If not, accept a customer_email and create a guest order.
 */
export async function resolveCheckoutIdentity(
  adminClient: SupabaseClient,
  params: {
    authenticatedUserId?: string | null;
    customerEmail?: string | null;
  },
): Promise<CheckoutIdentity> {
  // If authenticated user provided, look up their email
  if (params.authenticatedUserId) {
    const { data: user, error: userError } = await adminClient
      .from("profiles")
      .select("email")
      .eq("id", params.authenticatedUserId)
      .maybeSingle();

    if (userError || !user) {
      // Fall back to using the provided email or error
      if (!params.customerEmail) {
        throw new ApiError(400, "invalid_request", "Unable to resolve user email");
      }
    }

    return {
      userId: params.authenticatedUserId,
      customerEmail: user?.email ?? params.customerEmail ?? "",
      isGuest: false,
    };
  }

  // Guest checkout: require customer email
  if (!params.customerEmail) {
    throw new ApiError(
      400,
      "invalid_request",
      "Either authenticated user or customer_email is required",
    );
  }

  return {
    userId: null,
    customerEmail: params.customerEmail,
    isGuest: true,
  };
}

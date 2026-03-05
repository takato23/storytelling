import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Currency,
  OrderFormat,
  PaymentProvider,
  PrintOptions,
} from "@/lib/types";

export async function insertOrderEvent(
  adminClient: SupabaseClient,
  params: {
    orderId: string;
    eventType: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    note?: string | null;
    payload?: Record<string, unknown>;
  },
) {
  await adminClient.from("order_events").insert({
    order_id: params.orderId,
    event_type: params.eventType,
    from_status: params.fromStatus ?? null,
    to_status: params.toStatus ?? null,
    note: params.note ?? null,
    payload: params.payload ?? {},
  });
}

export async function createOrderDraft(
  adminClient: SupabaseClient,
  params: {
    userId: string;
    storyId: string;
    format: OrderFormat;
    currency: Currency;
    paymentProvider: PaymentProvider;
    subtotal: number;
    shippingFee: number;
    total: number;
    fxRateSnapshot: number | null;
    printOptions: PrintOptions;
    childProfile: Record<string, unknown>;
    personalizationPayload: Record<string, unknown>;
    shippingAddress?: {
      recipientName: string;
      line1: string;
      line2?: string;
      city: string;
      state?: string;
      postalCode: string;
      countryCode: string;
      phone?: string;
    };
  },
): Promise<string> {
  const { data: order, error: orderError } = await adminClient
    .from("orders")
    .insert({
      user_id: params.userId,
      status: "draft",
      currency: params.currency,
      payment_provider: params.paymentProvider,
      fx_rate_snapshot: params.fxRateSnapshot,
      subtotal: params.subtotal,
      shipping_fee: params.shippingFee,
      total: params.total,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? "Failed to create order");
  }

  const orderId = String(order.id);

  const { error: itemError } = await adminClient.from("order_items").insert({
    order_id: orderId,
    story_id: params.storyId,
    format: params.format,
    print_options_snapshot: params.printOptions,
    price_snapshot: {
      currency: params.currency,
      subtotal: params.subtotal,
      shipping_fee: params.shippingFee,
      total: params.total,
      fx_rate_snapshot: params.fxRateSnapshot,
    },
    quantity: 1,
  });

  if (itemError) {
    throw new Error(itemError.message);
  }

  const { error: personalizationError } = await adminClient.from("personalizations").insert({
    order_id: orderId,
    child_profile: params.childProfile,
    personalization_payload: params.personalizationPayload,
  });

  if (personalizationError) {
    throw new Error(personalizationError.message);
  }

  if (params.shippingAddress) {
    const { error: addressError } = await adminClient.from("shipping_addresses").insert({
      order_id: orderId,
      recipient_name: params.shippingAddress.recipientName,
      line1: params.shippingAddress.line1,
      line2: params.shippingAddress.line2 ?? null,
      city: params.shippingAddress.city,
      state: params.shippingAddress.state ?? null,
      postal_code: params.shippingAddress.postalCode,
      country_code: params.shippingAddress.countryCode,
      phone: params.shippingAddress.phone ?? null,
    });

    if (addressError) {
      throw new Error(addressError.message);
    }
  }

  await insertOrderEvent(adminClient, {
    orderId,
    eventType: "order_created",
    fromStatus: null,
    toStatus: "draft",
    note: "Order draft created",
  });

  return orderId;
}

import { z } from "zod";
import { DEFAULT_PRINT_PRODUCT_ID } from "@/lib/print-products";

export const CurrencySchema = z.enum(["USD", "ARS"]);
export type Currency = z.infer<typeof CurrencySchema>;

export const OrderFormatSchema = z.enum(["digital", "print"]);
export type OrderFormat = z.infer<typeof OrderFormatSchema>;

export const PaymentProviderSchema = z.enum(["mercadopago", "stripe"]);
export type PaymentProvider = z.infer<typeof PaymentProviderSchema>;

export const PrintOptionsSchema = z.object({
  productId: z.enum(["photo_book_21x14_8_hard", "photo_book_27_9x21_6_hard"]).default(DEFAULT_PRINT_PRODUCT_ID),
  includeGiftWrap: z.boolean().default(false),
});
export type PrintOptions = z.infer<typeof PrintOptionsSchema>;

export const ShippingAddressSchema = z.object({
  recipientName: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  postalCode: z.string().min(1),
  countryCode: z.string().length(2).transform((value) => value.toUpperCase()),
  phone: z.string().optional(),
});

export const CreateOrderRequestSchema = z
  .object({
    story_id: z.string().min(1),
    child_profile: z.record(z.string(), z.unknown()).default({}),
    personalization_payload: z.record(z.string(), z.unknown()).default({}),
    format: OrderFormatSchema,
    print_options: PrintOptionsSchema.default({
      productId: DEFAULT_PRINT_PRODUCT_ID,
      includeGiftWrap: false,
    }),
    currency: CurrencySchema,
    payment_provider: PaymentProviderSchema.default("mercadopago"),
    shipping_address: ShippingAddressSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.format === "print" && !value.shipping_address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "shipping_address is required for print format",
        path: ["shipping_address"],
      });
    }
  });
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;

export const OrderQuoteRequestSchema = z
  .object({
    order_id: z.string().uuid().optional(),
    story_id: z.string().min(1),
    format: OrderFormatSchema,
    print_options: PrintOptionsSchema.default({
      productId: DEFAULT_PRINT_PRODUCT_ID,
      includeGiftWrap: false,
    }),
    shipping_address: ShippingAddressSchema.optional(),
    currency: CurrencySchema,
  })
  .superRefine((value, ctx) => {
    if (value.format === "print" && !value.shipping_address) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "shipping_address is required for print format",
        path: ["shipping_address"],
      });
    }
  });
export type OrderQuoteRequest = z.infer<typeof OrderQuoteRequestSchema>;

export const CreateCheckoutSessionRequestSchema = z.object({
  quote_id: z.string().uuid(),
});
export type CreateCheckoutSessionRequest = z.infer<typeof CreateCheckoutSessionRequestSchema>;

export const AdminFxRateRequestSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  usd_to_ars: z.number().positive(),
});
export type AdminFxRateRequest = z.infer<typeof AdminFxRateRequestSchema>;

export const PrintJobStatusSchema = z.enum([
  "review_required",
  "approved",
  "in_production",
  "packed",
  "shipped",
  "delivered",
  "failed",
  "cancelled",
]);

export type PrintJobStatus = z.infer<typeof PrintJobStatusSchema>;

export const PrintJobTransitionRequestSchema = z.object({
  to_status: PrintJobStatusSchema,
  tracking_number: z.string().optional(),
  note: z.string().max(500).optional(),
});

export type PrintJobTransitionRequest = z.infer<typeof PrintJobTransitionRequestSchema>;

export const VALID_PRINT_JOB_TRANSITIONS: Record<PrintJobStatus, PrintJobStatus[]> = {
  review_required: ["approved", "failed", "cancelled"],
  approved: ["in_production", "failed", "cancelled"],
  in_production: ["packed", "failed", "cancelled"],
  packed: ["shipped", "failed", "cancelled"],
  shipped: ["delivered", "failed"],
  delivered: [],
  failed: [],
  cancelled: [],
};

export interface FxSnapshot {
  usd_to_ars: number;
  date: string;
}

export interface QuoteResult {
  quote_id: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  fx_rate_snapshot: number | null;
  expires_at: string;
  currency: Currency;
  shipping_rule_id: string | null;
  shipping_eta_days: number | null;
}

export const GenerateOrderRequestSchema = z.object({
  order_id: z.string().uuid(),
  retry: z.boolean().optional(),
});

export type GenerateOrderRequest = z.infer<typeof GenerateOrderRequestSchema>;

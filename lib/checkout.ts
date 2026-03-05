import { z } from "zod"

const SHIPPING_PRICE_PRINT = 6.99

export const cartItemSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional().default(""),
    price: z.number().positive(),
    quantity: z.number().int().min(1),
    format: z.enum(["digital", "print"]),
    image: z.string().optional()
})

export const checkoutPayloadSchema = z.object({
    items: z.array(cartItemSchema).min(1)
})

export type CheckoutCartItem = z.infer<typeof cartItemSchema>

export interface QuoteLineItem {
    id: string
    title: string
    description: string
    format: "digital" | "print"
    quantity: number
    unitPrice: number
    subtotal: number
    image?: string
}

export interface OrderQuote {
    currency: "USD"
    items: QuoteLineItem[]
    subtotal: number
    shipping: number
    total: number
    hasPrintItems: boolean
}

function roundMoney(value: number) {
    return Number(value.toFixed(2))
}

export function createOrderQuote(items: CheckoutCartItem[]): OrderQuote {
    const lineItems: QuoteLineItem[] = items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description ?? "",
        format: item.format,
        quantity: item.quantity,
        unitPrice: roundMoney(item.price),
        subtotal: roundMoney(item.price * item.quantity),
        image: item.image
    }))

    const subtotal = roundMoney(
        lineItems.reduce((acc, item) => acc + item.subtotal, 0)
    )
    const hasPrintItems = lineItems.some((item) => item.format === "print")
    const shipping = hasPrintItems ? SHIPPING_PRICE_PRINT : 0
    const total = roundMoney(subtotal + shipping)

    return {
        currency: "USD",
        items: lineItems,
        subtotal,
        shipping,
        total,
        hasPrintItems
    }
}

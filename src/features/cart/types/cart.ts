import { z } from 'zod'
import { ethAmountSchema } from '@/lib/api-contract'
import { networkSchema, nftImageSchema } from '@/features/catalog/types/catalog'

/** Why a line cannot be bought as it is; the cart page explains each case. */
export const cartItemIssueSchema = z.enum(['insufficient_stock', 'sold_out'])
export type CartItemIssue = z.infer<typeof cartItemIssueSchema>

export const cartItemSchema = z.object({
  id: z.string(),
  nft: z.object({
    id: z.string(),
    name: z.string(),
    tokenId: z.string(),
    image: nftImageSchema,
    network: networkSchema,
  }),
  edition: z.object({
    id: z.string(),
    label: z.string(),
    available: z.number().int().nonnegative(),
  }),
  quantity: z.number().int().positive(),
  unitPrice: ethAmountSchema,
  lineTotal: ethAmountSchema,
  issue: cartItemIssueSchema.nullable(),
})
export type CartItem = z.infer<typeof cartItemSchema>

export const cartCouponSchema = z.object({
  code: z.string(),
  description: z.string(),
})
export type CartCoupon = z.infer<typeof cartCouponSchema>

export const cartSummarySchema = z.object({
  itemCount: z.number().int().nonnegative(),
  subtotal: ethAmountSchema,
  discount: ethAmountSchema,
  networkFee: ethAmountSchema,
  total: ethAmountSchema,
})
export type CartSummary = z.infer<typeof cartSummarySchema>

export const cartSchema = z.object({
  id: z.string(),
  items: z.array(cartItemSchema),
  coupon: cartCouponSchema.nullable(),
  summary: cartSummarySchema,
})
export type Cart = z.infer<typeof cartSchema>

export interface AddCartItemInput {
  nftId: string
  editionId: string
  quantity: number
}

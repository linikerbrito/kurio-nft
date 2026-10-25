import { z } from 'zod'
import { cartSummarySchema } from '@/features/cart/types/cart'
import { networkSchema, nftImageSchema } from '@/features/catalog/types/catalog'
import { walletProviderSchema } from '@/features/wallets/types/wallets'
import { ethAmountSchema } from '@/lib/api-contract'

/** Confirmed and rejected are terminal: an order never leaves them. */
export const orderStatusSchema = z.enum(['pending', 'confirmed', 'rejected'])
export type OrderStatus = z.infer<typeof orderStatusSchema>

export const orderItemSchema = z.object({
  nftId: z.string(),
  name: z.string(),
  tokenId: z.string(),
  image: nftImageSchema,
  editionLabel: z.string(),
  quantity: z.number().int().positive(),
  unitPrice: ethAmountSchema,
  lineTotal: ethAmountSchema,
})
export type OrderItem = z.infer<typeof orderItemSchema>

/**
 * `GET /api/orders/:id`: state and receipt. Items and totals are a snapshot taken when the
 * order was placed; later catalog changes never touch them.
 */
export const orderSchema = z.object({
  id: z.string(),
  status: orderStatusSchema,
  version: z.number().int().positive(),
  createdAt: z.string(),
  settledAt: z.string().nullable(),
  failureReason: z.string().nullable(),
  transaction: z
    .object({
      hash: z.string(),
      explorerUrl: z.string(),
    })
    .nullable(),
  wallet: z.object({
    label: z.string(),
    address: z.string(),
    network: networkSchema,
    provider: walletProviderSchema,
  }),
  items: z.array(orderItemSchema),
  coupon: z.object({ code: z.string(), description: z.string() }).nullable(),
  summary: cartSummarySchema,
})
export type Order = z.infer<typeof orderSchema>

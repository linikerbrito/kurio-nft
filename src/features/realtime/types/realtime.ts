import { z } from 'zod'
import { orderSchema } from '@/features/orders/types/orders'
import { ethAmountSchema } from '@/lib/api-contract'

/**
 * Envelope of every Socket.IO event: a stable id (duplicates are ignored), the resource it
 * changes and that resource's version (older versions never overwrite newer ones).
 */
const envelope = <Type extends string, Resource extends string, Data extends z.ZodType>(
  type: Type,
  resource: Resource,
  data: Data,
) =>
  z.object({
    id: z.string(),
    type: z.literal(type),
    resource: z.object({ type: z.literal(resource), id: z.string() }),
    version: z.number().int().nonnegative(),
    occurredAt: z.string(),
    data,
  })

export const nftUpdatedEventSchema = envelope(
  'nft.updated',
  'nft',
  z.object({
    id: z.string(),
    price: ethAmountSchema,
    available: z.number().int().nonnegative(),
    editions: z.array(z.object({ id: z.string(), available: z.number().int().nonnegative() })),
  }),
)
export type NftUpdatedEvent = z.infer<typeof nftUpdatedEventSchema>

export const orderUpdatedEventSchema = envelope('order.updated', 'order', orderSchema)
export type OrderUpdatedEvent = z.infer<typeof orderUpdatedEventSchema>

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent

export const REALTIME_EVENTS = ['nft.updated', 'order.updated'] as const

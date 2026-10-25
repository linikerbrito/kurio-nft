import type { CreateOrderInput } from '@/features/checkout/types/checkout'
import { orderSchema, type Order } from '@/features/orders/types/orders'
import { http, parseResponse } from '@/lib/http'

export const IDEMPOTENCY_HEADER = 'Idempotency-Key'

/** Placing an order waits less than other calls; a retry with the same key is always safe. */
export const ORDER_REQUEST_TIMEOUT_MS = 4_000

export const orderKeys = {
  all: ['orders'] as const,
  detail: (orderId: string) => ['orders', orderId] as const,
}

export async function createOrder(input: CreateOrderInput, idempotencyKey: string): Promise<Order> {
  const { data } = await http.post<unknown>('/orders', input, {
    headers: { [IDEMPOTENCY_HEADER]: idempotencyKey },
    timeout: ORDER_REQUEST_TIMEOUT_MS,
  })
  return parseResponse(orderSchema, data)
}

export async function fetchOrder(orderId: string, signal?: AbortSignal): Promise<Order> {
  const { data } = await http.get<unknown>(`/orders/${encodeURIComponent(orderId)}`, { signal })
  return parseResponse(orderSchema, data)
}

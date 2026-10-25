import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { createQuote } from '@/features/checkout/api/checkout-api'
import { collectorSchema, type CreateOrderInput } from '@/features/checkout/types/checkout'
import { createOrder } from '@/features/orders/api/orders-api'
import { readSessionValue, removeSessionValues, writeSessionValue } from '@/lib/session-store'

/** Every checkout entry in the tab storage starts with this prefix (cleared on logout). */
export const CHECKOUT_STORAGE_PREFIX = 'kurio:checkout:'

const attemptSchema = z.object({
  key: z.string(),
  input: z.object({
    quoteId: z.string(),
    connectionId: z.string(),
    collector: collectorSchema,
  }),
})
export type OrderAttempt = z.infer<typeof attemptSchema>

function attemptKey(userId: string): string {
  return `${CHECKOUT_STORAGE_PREFIX}attempt:${userId}`
}

/**
 * The order attempt being sent. It survives a reload, so a timeout or a closed tab is resumed
 * with the same `Idempotency-Key` instead of creating a second purchase.
 */
export function readOrderAttempt(userId: string): OrderAttempt | null {
  return readSessionValue(attemptKey(userId), attemptSchema)
}

export function clearOrderAttempt(userId: string): void {
  removeSessionValues(attemptKey(userId))
}

export function clearCheckoutStorage(): void {
  removeSessionValues(CHECKOUT_STORAGE_PREFIX)
}

/** Same body as the stored attempt: same key. Anything different is a new attempt. */
function attemptFor(userId: string, input: CreateOrderInput): OrderAttempt {
  const stored = readOrderAttempt(userId)
  if (stored && JSON.stringify(stored.input) === JSON.stringify(input)) return stored
  const attempt = { key: crypto.randomUUID(), input }
  writeSessionValue(attemptKey(userId), attempt)
  return attempt
}

export function useCreateQuote() {
  return useMutation({ mutationFn: () => createQuote() })
}

/**
 * Sends the order. Repeated clicks are blocked while it is pending, and every retry of the same
 * input reuses the stored key, so the API returns the order it already created.
 */
export function usePlaceOrder(userId: string) {
  return useMutation({
    mutationFn: (input: CreateOrderInput) => {
      const attempt = attemptFor(userId, input)
      return createOrder(attempt.input, attempt.key)
    },
    onSuccess: () => clearOrderAttempt(userId),
  })
}

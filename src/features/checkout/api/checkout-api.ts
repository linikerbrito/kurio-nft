import { quoteSchema, type Quote } from '@/features/checkout/types/checkout'
import { http, parseResponse } from '@/lib/http'

/** Prices and checks the signed-in user's cart right now. */
export async function createQuote(): Promise<Quote> {
  const { data } = await http.post<unknown>('/checkout/quote')
  return parseResponse(quoteSchema, data)
}

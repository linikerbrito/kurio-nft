import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'
import { collectorSchema } from '@/features/checkout/types/checkout'
import { IDEMPOTENCY_HEADER, ORDER_REQUEST_TIMEOUT_MS } from '@/features/orders/api/orders-api'
import { API_BASE } from '@/mocks/config'
import { getDb, persistOrders } from '@/mocks/db'
import {
  buildQuote,
  fingerprint,
  ORDER_SETTLE_MS,
  placeOrder,
  raiseFirstPrice,
  settleDueOrders,
  toOrder,
  userCart,
} from '@/mocks/orders'
import { errorResponse, readJson, transientFailure } from '@/mocks/responses'
import { getMockScenario, simulateLatency } from '@/mocks/scenario'
import { authenticate } from '@/mocks/session'

const orderSchema = z.object({
  quoteId: z.string().min(1),
  connectionId: z.string().min(1),
  collector: collectorSchema,
})

/** `price-changed` raises a price once per page load, while the first order is being sent. */
let priceRaised = false

async function signedIn(request: Request) {
  await simulateLatency()
  if (getMockScenario() === 'error') return { failure: transientFailure() }
  const auth = authenticate(request)
  if (auth.status !== 'valid') {
    return { failure: errorResponse('unauthorized', 'Sua sessão expirou.') }
  }
  settleDueOrders()
  return { user: auth.user }
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path.at(-1)
    if (typeof field === 'string') errors[field] ??= issue.message
  }
  return errors
}

export const checkoutHandlers = [
  http.post(`${API_BASE}/checkout/quote`, async ({ request }) => {
    const { user, failure } = await signedIn(request)
    if (failure) return failure
    const quote = buildQuote(userCart(user.id))
    if (quote.items.length === 0) return errorResponse('validation', 'Seu carrinho está vazio.')
    if (quote.items.some((item) => item.issue !== null)) {
      return errorResponse(
        'conflict',
        'Há itens indisponíveis no carrinho. Ajuste-os para continuar.',
      )
    }
    return HttpResponse.json(quote)
  }),

  /**
   * Idempotent: the same key and body return the same order; the same key with another body is
   * a conflict. Price, stock, coupon and fees are checked again against the reviewed quote.
   */
  http.post(`${API_BASE}/orders`, async ({ request }) => {
    const { user, failure } = await signedIn(request)
    if (failure) return failure

    const key = request.headers.get(IDEMPOTENCY_HEADER)
    if (!key) return errorResponse('validation', 'Tentativa de pedido sem identificação.')
    const body = await readJson(request)
    const parsed = orderSchema.safeParse(body)
    if (!parsed.success) {
      return errorResponse(
        'validation',
        'Revise os dados do colecionador.',
        fieldErrors(parsed.error),
      )
    }

    const db = getDb()
    const recordKey = `${user.id}:${key}`
    const requestHash = fingerprint(parsed.data)
    const previous = db.idempotency[recordKey]
    if (previous) {
      const order = db.orders.find((item) => item.id === previous.orderId)
      if (previous.requestHash !== requestHash || !order) {
        return errorResponse('conflict', 'Esta tentativa de pedido já foi usada com outros dados.')
      }
      return HttpResponse.json(toOrder(order))
    }

    const connection = db.connections[parsed.data.connectionId]
    if (!connection?.active || connection.userId !== user.id) {
      const message = 'A carteira foi desconectada. Conecte novamente para pagar.'
      return errorResponse('validation', message, { provider: message })
    }

    const cart = userCart(user.id)
    if (getMockScenario() === 'price-changed' && !priceRaised) {
      priceRaised = true
      raiseFirstPrice(cart)
    }
    const quote = buildQuote(cart)
    if (quote.items.length === 0) return errorResponse('validation', 'Seu carrinho está vazio.')
    if (quote.id !== parsed.data.quoteId || quote.items.some((item) => item.issue !== null)) {
      return errorResponse(
        'conflict',
        'Os valores ou a disponibilidade mudaram. Revise o pedido e confirme novamente.',
      )
    }

    const outcome = getMockScenario() === 'payment-rejected' ? 'rejected' : 'confirmed'
    const order = placeOrder(user.id, quote, connection, outcome)
    db.idempotency[recordKey] = { requestHash, orderId: order.id }
    persistOrders()
    setTimeout(() => settleDueOrders(), ORDER_SETTLE_MS)

    // `order-timeout`: the order exists, but the answer only comes after the client gave up.
    if (getMockScenario() === 'order-timeout') await delay(ORDER_REQUEST_TIMEOUT_MS + 1_500)
    return HttpResponse.json(toOrder(order), { status: 201 })
  }),

  http.get<{ orderId: string }>(`${API_BASE}/orders/:orderId`, async ({ request, params }) => {
    const { user, failure } = await signedIn(request)
    if (failure) return failure
    const order = getDb().orders.find(
      (item) => item.id === params.orderId && item.userId === user.id,
    )
    if (!order) return errorResponse('not_found', 'Pedido não encontrado.')
    return HttpResponse.json(toOrder(order))
  }),
]

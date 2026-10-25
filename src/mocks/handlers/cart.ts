import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { CART_ID_HEADER } from '@/lib/http'
import { API_BASE } from '@/mocks/config'
import { getDb, persistCarts, type MockCart } from '@/mocks/db'
import { errorResponse, readJson, transientFailure } from '@/mocks/responses'
import { settleDueOrders } from '@/mocks/orders'
import { getMockScenario, simulateLatency } from '@/mocks/scenario'
import { coupons, findEdition, toCart } from '@/mocks/pricing'
import { authenticate, userCartId } from '@/mocks/session'

const addItemSchema = z.object({
  nftId: z.string().min(1),
  editionId: z.string().min(1),
  quantity: z.number().int().min(1).max(999),
})
const updateItemSchema = z.object({ quantity: z.number().int().min(1).max(999) })
const couponSchema = z.object({ code: z.string().trim().min(1).max(40) })

/** Signed-in users get their account cart; visitors the cart named by the header. */
function cartFor(request: Request): MockCart | 'unauthorized' | null {
  const auth = authenticate(request)
  if (auth.status === 'invalid') return 'unauthorized'
  const cartId =
    auth.status === 'valid' ? userCartId(auth.user.id) : request.headers.get(CART_ID_HEADER)
  if (!cartId) return null
  const { carts } = getDb()
  carts[cartId] ??= { id: cartId, lines: [], couponCode: null }
  return carts[cartId]
}

function stockConflict(available: number) {
  return errorResponse(
    'conflict',
    available === 0
      ? 'Esta edição esgotou.'
      : `Só ${available === 1 ? 'resta 1 unidade' : `restam ${available} unidades`} desta edição.`,
  )
}

function respond(cart: MockCart) {
  persistCarts()
  return HttpResponse.json(toCart(cart))
}

/** Shared guard: latency, error scenario and the cart header. */
async function prepare(request: Request) {
  await simulateLatency()
  settleDueOrders()
  if (getMockScenario() === 'error') return { failure: transientFailure() }
  const cart = cartFor(request)
  if (cart === 'unauthorized') {
    return { failure: errorResponse('unauthorized', 'Sua sessão expirou.') }
  }
  if (!cart) return { failure: errorResponse('validation', 'Carrinho não identificado.') }
  return { cart }
}

export const cartHandlers = [
  http.get(`${API_BASE}/cart`, async ({ request }) => {
    const { cart, failure } = await prepare(request)
    if (failure) return failure
    return respond(cart)
  }),

  http.post(`${API_BASE}/cart/items`, async ({ request }) => {
    const { cart, failure } = await prepare(request)
    if (failure) return failure
    const parsed = addItemSchema.safeParse(await readJson(request))
    if (!parsed.success) return errorResponse('validation', 'Item inválido.')

    const { nftId, editionId, quantity } = parsed.data
    const found = findEdition(nftId, editionId)
    if (!found) return errorResponse('not_found', 'NFT ou edição não encontrados.')

    const existing = cart.lines.find((line) => line.editionId === editionId)
    const nextQuantity = (existing?.quantity ?? 0) + quantity
    if (nextQuantity > found.edition.available) return stockConflict(found.edition.available)

    if (existing) existing.quantity = nextQuantity
    else cart.lines.push({ id: `${cart.id}:${editionId}`, nftId, editionId, quantity })
    return respond(cart)
  }),

  http.patch<{ itemId: string }>(`${API_BASE}/cart/items/:itemId`, async ({ request, params }) => {
    const { cart, failure } = await prepare(request)
    if (failure) return failure
    const parsed = updateItemSchema.safeParse(await readJson(request))
    if (!parsed.success) return errorResponse('validation', 'Quantidade inválida.')

    const line = cart.lines.find((item) => item.id === params.itemId)
    if (!line) return errorResponse('not_found', 'Item não está no carrinho.')
    const found = findEdition(line.nftId, line.editionId)
    if (!found) return errorResponse('not_found', 'NFT ou edição não encontrados.')
    if (parsed.data.quantity > found.edition.available) {
      return stockConflict(found.edition.available)
    }

    line.quantity = parsed.data.quantity
    return respond(cart)
  }),

  http.delete<{ itemId: string }>(`${API_BASE}/cart/items/:itemId`, async ({ request, params }) => {
    const { cart, failure } = await prepare(request)
    if (failure) return failure
    cart.lines = cart.lines.filter((item) => item.id !== params.itemId)
    return respond(cart)
  }),

  http.put(`${API_BASE}/cart/coupon`, async ({ request }) => {
    const { cart, failure } = await prepare(request)
    if (failure) return failure
    const parsed = couponSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return errorResponse('validation', 'Informe um código.', { code: 'Informe um código.' })
    }

    const code = parsed.data.code.toUpperCase()
    const rule = coupons[code]
    if (!rule) {
      return errorResponse('validation', 'Cupom inválido.', { code: 'Cupom inválido.' })
    }
    if (rule.expired) {
      return errorResponse('validation', 'Este cupom expirou.', { code: 'Este cupom expirou.' })
    }
    cart.couponCode = code
    return respond(cart)
  }),

  http.delete(`${API_BASE}/cart/coupon`, async ({ request }) => {
    const { cart, failure } = await prepare(request)
    if (failure) return failure
    cart.couponCode = null
    return respond(cart)
  }),
]

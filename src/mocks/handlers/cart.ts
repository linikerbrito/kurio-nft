import Decimal from 'decimal.js'
import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import type { Cart, CartItem } from '@/features/cart/types/cart'
import { CART_ID_HEADER } from '@/lib/http'
import { API_BASE } from '@/mocks/config'
import { getDb, persistCarts, type MockCart } from '@/mocks/db'
import { errorResponse, transientFailure } from '@/mocks/responses'
import { getMockScenario, simulateLatency } from '@/mocks/scenario'
import { authenticate, userCartId } from '@/mocks/session'

/** Base fee plus one share per distinct network in the cart ("Taxa estimada"). */
const BASE_NETWORK_FEE = new Decimal('0.004')
const FEE_PER_NETWORK = new Decimal('0.004')

interface CouponRule {
  description: string
  percentOff: number
  expired: boolean
}

const coupons: Record<string, CouponRule> = {
  KURIO10: { description: 'Desconto do lançamento (10%)', percentOff: 10, expired: false },
  EXPIRADO: { description: 'Cupom de pré-venda', percentOff: 15, expired: true },
}

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

function findEdition(nftId: string, editionId: string) {
  const nft = getDb().nfts.find((item) => item.id === nftId)
  const edition = nft?.editions.find((item) => item.id === editionId)
  return nft && edition ? { nft, edition } : null
}

function stockConflict(available: number) {
  return errorResponse(
    'conflict',
    available === 0
      ? 'Esta edição esgotou.'
      : `Só ${available === 1 ? 'resta 1 unidade' : `restam ${available} unidades`} desta edição.`,
  )
}

/** Builds the cart the client sees, priced with the current catalog. */
function toCart(cart: MockCart): Cart {
  const items: CartItem[] = []
  for (const line of cart.lines) {
    const found = findEdition(line.nftId, line.editionId)
    if (!found) continue
    const { nft, edition } = found
    const unitPrice = new Decimal(nft.price)
    items.push({
      id: line.id,
      nft: {
        id: nft.id,
        name: nft.name,
        tokenId: nft.tokenId,
        image: nft.image,
        network: nft.network,
      },
      edition: { id: edition.id, label: edition.label, available: edition.available },
      quantity: line.quantity,
      unitPrice: unitPrice.toFixed(2),
      lineTotal: unitPrice.times(line.quantity).toFixed(2),
      issue:
        edition.available === 0
          ? 'sold_out'
          : line.quantity > edition.available
            ? 'insufficient_stock'
            : null,
    })
  }

  const subtotal = items.reduce((sum, item) => sum.plus(item.lineTotal), new Decimal(0))
  const coupon = cart.couponCode ? coupons[cart.couponCode] : undefined
  const discount = coupon
    ? subtotal.times(coupon.percentOff).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_DOWN)
    : new Decimal(0)
  const networks = new Set(items.map((item) => item.nft.network)).size
  const networkFee =
    items.length === 0 ? new Decimal(0) : BASE_NETWORK_FEE.plus(FEE_PER_NETWORK.times(networks))

  return {
    id: cart.id,
    items,
    coupon:
      coupon && cart.couponCode ? { code: cart.couponCode, description: coupon.description } : null,
    summary: {
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: subtotal.toFixed(2),
      discount: discount.toFixed(2),
      networkFee: networkFee.toFixed(3),
      total: subtotal.minus(discount).plus(networkFee).toFixed(3),
    },
  }
}

function respond(cart: MockCart) {
  persistCarts()
  return HttpResponse.json(toCart(cart))
}

/** Shared guard: latency, error scenario and the cart header. */
async function prepare(request: Request) {
  await simulateLatency()
  if (getMockScenario() === 'error') return { failure: transientFailure() }
  const cart = cartFor(request)
  if (cart === 'unauthorized') {
    return { failure: errorResponse('unauthorized', 'Sua sessão expirou.') }
  }
  if (!cart) return { failure: errorResponse('validation', 'Carrinho não identificado.') }
  return { cart }
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
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

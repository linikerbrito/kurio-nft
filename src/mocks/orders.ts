import Decimal from 'decimal.js'
import type { Quote } from '@/features/checkout/types/checkout'
import type { Order } from '@/features/orders/types/orders'
import {
  getDb,
  persistCarts,
  persistOrders,
  type MockCart,
  type MockConnection,
  type MockOrder,
  ordersHeld,
} from '@/mocks/db'
import { toCart } from '@/mocks/pricing'
import { emitNftUpdated, emitOrderUpdated, touchNft } from '@/mocks/realtime'
import { randomToken, userCartId } from '@/mocks/session'

/** Time a payment stays pending before the simulated network settles it. */
export const ORDER_SETTLE_MS = 3_000

const explorers = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  solana: 'https://solscan.io/tx/',
} as const

/** FNV-1a: a short, stable fingerprint for quotes and request bodies. */
export function fingerprint(value: unknown): string {
  let hash = 0x811c9dc5
  for (const char of JSON.stringify(value)) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function userCart(userId: string): MockCart {
  const { carts } = getDb()
  const id = userCartId(userId)
  carts[id] ??= { id, lines: [], couponCode: null }
  return carts[id]
}

/**
 * The cart priced now. Its id covers every value the user reviews (prices, quantities, stock,
 * coupon, fees), so any change produces a different quote id.
 */
export function buildQuote(cart: MockCart): Quote {
  const { items, coupon, summary } = toCart(cart)
  const id = fingerprint({
    items: items.map((item) => [item.id, item.quantity, item.unitPrice, item.issue]),
    coupon: coupon?.code ?? null,
    summary,
  })
  return { id: `quote-${id}`, items, coupon, summary, createdAt: new Date().toISOString() }
}

function randomHash(): string {
  return `0x${(randomToken() + randomToken()).replaceAll('-', '').slice(0, 64)}`
}

export function placeOrder(
  userId: string,
  quote: Quote,
  connection: MockConnection,
  outcome: MockOrder['outcome'],
): MockOrder {
  const now = Date.now()
  const order: MockOrder = {
    id: `ord-${randomToken().slice(0, 8)}`,
    userId,
    status: 'pending',
    version: 1,
    outcome,
    createdAt: new Date(now).toISOString(),
    settlesAt: new Date(now + ORDER_SETTLE_MS).toISOString(),
    settledAt: null,
    failureReason: null,
    txHash: null,
    wallet: {
      label: connection.label,
      address: connection.address,
      network: connection.network,
      provider: connection.provider,
    },
    items: quote.items.map((item) => ({
      nftId: item.nft.id,
      editionId: item.edition.id,
      name: item.nft.name,
      tokenId: item.nft.tokenId,
      image: item.nft.image,
      editionLabel: item.edition.label,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    coupon: quote.coupon,
    summary: quote.summary,
  }
  getDb().orders.push(order)
  persistOrders()
  return order
}

/** A confirmed purchase takes its units from the stock and from the buyer's cart, nothing more. */
function applyPurchase(order: MockOrder): void {
  const { nfts } = getDb()
  const cart = userCart(order.userId)
  for (const item of order.items) {
    const nft = nfts.find((candidate) => candidate.id === item.nftId)
    const edition = nft?.editions.find((candidate) => candidate.id === item.editionId)
    if (nft && edition) {
      edition.available = Math.max(0, edition.available - item.quantity)
      touchNft(nft)
      emitNftUpdated(nft)
    }

    const line = cart.lines.find((candidate) => candidate.editionId === item.editionId)
    if (line) line.quantity -= item.quantity
  }
  cart.lines = cart.lines.filter((line) => line.quantity > 0)
  if (cart.lines.length === 0) cart.couponCode = null
  persistCarts()
}

/** Settles every pending order whose time has come; terminal states never change again. */
export function settleDueOrders(now = Date.now(), force = false): void {
  if (!force && ordersHeld()) return
  let changed = false
  for (const order of getDb().orders) {
    if (order.status !== 'pending' || Date.parse(order.settlesAt) > now) continue
    order.status = order.outcome
    order.version += 1
    order.settledAt = new Date(now).toISOString()
    if (order.outcome === 'confirmed') {
      order.txHash = randomHash()
      applyPurchase(order)
    } else {
      order.failureReason = 'Pagamento recusado pela carteira: saldo insuficiente na rede.'
    }
    emitOrderUpdated(order.userId, toOrder(order))
    changed = true
  }
  if (changed) persistOrders()
}

export function toOrder(order: MockOrder): Order {
  return {
    id: order.id,
    status: order.status,
    version: order.version,
    createdAt: order.createdAt,
    settledAt: order.settledAt,
    failureReason: order.failureReason,
    transaction: order.txHash
      ? { hash: order.txHash, explorerUrl: `${explorers[order.wallet.network]}${order.txHash}` }
      : null,
    wallet: order.wallet,
    items: order.items.map((item) => ({
      nftId: item.nftId,
      name: item.name,
      tokenId: item.tokenId,
      image: item.image,
      editionLabel: item.editionLabel,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
    coupon: order.coupon,
    summary: order.summary,
  }
}

/** Test scenario: raises the price of the first item in the cart by 0.05 ETH. */
export function raiseFirstPrice(cart: MockCart): void {
  const nftId = cart.lines[0]?.nftId
  const nft = getDb().nfts.find((item) => item.id === nftId)
  if (!nft) return
  nft.price = new Decimal(nft.price).plus('0.05').toFixed(2)
  touchNft(nft)
  emitNftUpdated(nft)
}

/** Test control: settles every pending order now, as if its time had come (emits its events). */
export function settlePendingOrders(): void {
  const now = Date.now()
  for (const order of getDb().orders) {
    if (order.status === 'pending') order.settlesAt = new Date(now).toISOString()
  }
  settleDueOrders(now, true)
}

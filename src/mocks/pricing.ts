import Decimal from 'decimal.js'
import type { Cart, CartItem } from '@/features/cart/types/cart'
import { getDb, type MockCart } from '@/mocks/db'

/** Base fee plus one share per distinct network in the cart ("Taxa estimada"). */
const BASE_NETWORK_FEE = new Decimal('0.004')
const FEE_PER_NETWORK = new Decimal('0.004')

interface CouponRule {
  description: string
  percentOff: number
  expired: boolean
}

export const coupons: Record<string, CouponRule> = {
  KURIO10: { description: 'Desconto do lançamento (10%)', percentOff: 10, expired: false },
  EXPIRADO: { description: 'Cupom de pré-venda', percentOff: 15, expired: true },
}

export function findEdition(nftId: string, editionId: string) {
  const nft = getDb().nfts.find((item) => item.id === nftId)
  const edition = nft?.editions.find((item) => item.id === editionId)
  return nft && edition ? { nft, edition } : null
}

/** Builds the cart the client sees, priced with the current catalog. */
export function toCart(cart: MockCart): Cart {
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

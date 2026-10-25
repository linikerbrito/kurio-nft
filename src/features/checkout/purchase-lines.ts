import type { CartItem } from '@/features/cart/types/cart'
import type { NftImage } from '@/features/catalog/types/catalog'
import type { OrderItem } from '@/features/orders/types/orders'

export interface PurchaseLine {
  key: string
  name: string
  tokenId: string
  image: NftImage
  editionLabel: string
  quantity: number
  lineTotal: string
}

export function linesFromCart(items: CartItem[]): PurchaseLine[] {
  return items.map((item) => ({
    key: item.id,
    name: item.nft.name,
    tokenId: item.nft.tokenId,
    image: item.nft.image,
    editionLabel: item.edition.label,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  }))
}

export function linesFromOrder(items: OrderItem[]): PurchaseLine[] {
  return items.map((item) => ({ ...item, key: `${item.nftId}:${item.editionLabel}` }))
}

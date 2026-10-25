import type { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { cartKeys } from '@/features/cart/hooks/use-cart'
import type { Cart } from '@/features/cart/types/cart'
import { catalogKeys } from '@/features/catalog/hooks/use-catalog'
import type {
  FeaturedNftsResponse,
  Nft,
  NftListResponse,
  NftSummary,
} from '@/features/catalog/types/catalog'
import { orderKeys } from '@/features/orders/api/orders-api'
import type { Order } from '@/features/orders/types/orders'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/features/realtime/types/realtime'
import { formatEth } from '@/lib/eth'

/** Only a newer version changes a cached NFT: late or repeated events never roll it back. */
function patchSummary<T extends NftSummary>(nft: T, event: NftUpdatedEvent): T {
  if (nft.id !== event.data.id || nft.version >= event.version) return nft
  return {
    ...nft,
    price: event.data.price,
    available: event.data.available,
    version: event.version,
  }
}

function patchDetail(nft: Nft, event: NftUpdatedEvent): Nft {
  const patched = patchSummary(nft, event)
  if (patched === nft) return nft
  const stock = new Map(event.data.editions.map((edition) => [edition.id, edition.available]))
  return {
    ...patched,
    editions: nft.editions.map((edition) => ({
      ...edition,
      available: stock.get(edition.id) ?? edition.available,
    })),
  }
}

/** What changed for an NFT in the cart, in words, or null when the cart is not affected. */
function cartChange(cart: Cart | undefined, event: NftUpdatedEvent): string | null {
  const items = cart?.items.filter((item) => item.nft.id === event.data.id) ?? []
  const [first] = items
  if (!first) return null
  if (first.unitPrice !== event.data.price) {
    return `O preço de ${first.nft.name} mudou para ${formatEth(event.data.price)}. O resumo foi atualizado.`
  }
  const stock = new Map(event.data.editions.map((edition) => [edition.id, edition.available]))
  const short = items.find((item) => (stock.get(item.edition.id) ?? Infinity) < item.quantity)
  if (short) {
    return `A disponibilidade de ${short.nft.name} (${short.edition.label}) mudou. Revise o carrinho.`
  }
  return null
}

/** `nft.updated`: price and stock in the catalog, the detail and the cart. */
export function applyNftUpdated(queryClient: QueryClient, event: NftUpdatedEvent): void {
  queryClient.setQueriesData<NftListResponse>({ queryKey: catalogKeys.lists() }, (list) =>
    list ? { ...list, items: list.items.map((nft) => patchSummary(nft, event)) } : list,
  )
  queryClient.setQueryData<FeaturedNftsResponse>(catalogKeys.featured(), (featured) =>
    featured
      ? {
          slides: featured.slides.map((nft) => patchSummary(nft, event)),
          spotlight: patchSummary(featured.spotlight, event),
        }
      : featured,
  )
  queryClient.setQueryData<Nft>(catalogKeys.detail(event.data.id), (nft) =>
    nft ? patchDetail(nft, event) : nft,
  )

  // The cart is priced by the API: fetch it again and say what changed.
  const cart = queryClient.getQueryData<Cart>(cartKeys.all)
  if (cart?.items.some((item) => item.nft.id === event.data.id)) {
    const message = cartChange(cart, event)
    void queryClient.invalidateQueries({ queryKey: cartKeys.all })
    if (message) toast.info(message, { id: `cart-change-${event.data.id}` })
  }
}

/** `order.updated`: the new state replaces an older one, never the other way around. */
export function applyOrderUpdated(queryClient: QueryClient, event: OrderUpdatedEvent): void {
  queryClient.setQueryData<Order>(orderKeys.detail(event.data.id), (order) =>
    order && order.version >= event.version ? order : event.data,
  )
}

/** After a reconnection, events may have been missed: refetch what is on screen. */
export function reconcileAfterReconnect(queryClient: QueryClient): void {
  for (const queryKey of [catalogKeys.all, cartKeys.all, orderKeys.all]) {
    void queryClient.invalidateQueries({ queryKey, refetchType: 'active' })
  }
}

import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cartKeys } from '@/features/cart/hooks/use-cart'
import { catalogKeys } from '@/features/catalog/hooks/use-catalog'
import { fetchOrder, orderKeys } from '@/features/orders/api/orders-api'

/** While pending, the order is checked every second until the network settles it. */
const PENDING_REFRESH_MS = 1_000

export function useOrder(orderId: string) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
    refetchInterval: (current) =>
      current.state.data?.status === 'pending' ? PENDING_REFRESH_MS : false,
  })

  // A confirmed purchase changed stock and the cart: both are fetched again, once.
  const status = query.data?.status
  const refreshed = useRef(false)
  useEffect(() => {
    if (status !== 'confirmed' || refreshed.current) return
    refreshed.current = true
    void queryClient.invalidateQueries({ queryKey: cartKeys.all })
    void queryClient.invalidateQueries({ queryKey: catalogKeys.all })
  }, [status, queryClient])

  return query
}

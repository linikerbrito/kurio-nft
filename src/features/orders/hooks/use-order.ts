import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cartKeys } from '@/features/cart/hooks/use-cart'
import { catalogKeys } from '@/features/catalog/hooks/use-catalog'
import { fetchOrder, orderKeys } from '@/features/orders/api/orders-api'

export function useOrder(orderId: string) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
    // State changes arrive through `order.updated`; a reload or a reconnection refetches.
    staleTime: Infinity,
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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Decimal from 'decimal.js'
import { toast } from 'sonner'
import {
  addCartItem,
  applyCoupon,
  fetchCart,
  removeCartItem,
  removeCoupon,
  updateCartItem,
} from '@/features/cart/api/cart-api'
import type { AddCartItemInput, Cart } from '@/features/cart/types/cart'
import { toApiError } from '@/lib/http'

export const cartKeys = {
  all: ['cart'] as const,
}

export function useCart() {
  return useQuery({
    queryKey: cartKeys.all,
    queryFn: ({ signal }) => fetchCart(signal),
    staleTime: 10_000,
  })
}

/** Units in the cart, for the header and bottom navigation badges. */
export function useCartCount(): number {
  return useCart().data?.summary.itemCount ?? 0
}

/** Mutations that answer with the full cart write it straight into the cache. */
function useCartMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<Cart>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (cart) => queryClient.setQueryData(cartKeys.all, cart),
  })
}

export function useAddToCart() {
  return useCartMutation((input: AddCartItemInput) => addCartItem(input))
}

export function useApplyCoupon() {
  return useCartMutation((code: string) => applyCoupon(code))
}

export function useRemoveCoupon() {
  return useCartMutation(() => removeCoupon())
}

/** Recomputes a line locally so the optimistic cart looks right until the API answers. */
function withQuantity(cart: Cart, itemId: string, quantity: number): Cart {
  return {
    ...cart,
    items: cart.items.map((item) =>
      item.id === itemId
        ? {
            ...item,
            quantity,
            lineTotal: new Decimal(item.unitPrice).times(quantity).toFixed(2),
          }
        : item,
    ),
  }
}

/**
 * Optimistic quantity changes and removals: the cart updates at once and rolls back,
 * with a message, when the API refuses (stock conflict, network failure).
 */
function useOptimisticCartMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<Cart>,
  apply: (cart: Cart, variables: TVariables) => Cart,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: cartKeys.all })
      const previous = queryClient.getQueryData<Cart>(cartKeys.all)
      if (previous) queryClient.setQueryData(cartKeys.all, apply(previous, variables))
      return { previous }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(cartKeys.all, context.previous)
      toast.error(toApiError(error).message)
    },
    onSuccess: (cart) => queryClient.setQueryData(cartKeys.all, cart),
  })
}

export function useUpdateCartItem() {
  return useOptimisticCartMutation(
    ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      updateCartItem(itemId, quantity),
    (cart, { itemId, quantity }) => withQuantity(cart, itemId, quantity),
  )
}

export function useRemoveCartItem() {
  return useOptimisticCartMutation(
    (itemId: string) => removeCartItem(itemId),
    (cart, itemId) => ({ ...cart, items: cart.items.filter((item) => item.id !== itemId) }),
  )
}

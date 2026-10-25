import { http, parseResponse } from '@/lib/http'
import { cartSchema, type AddCartItemInput, type Cart } from '@/features/cart/types/cart'

export async function fetchCart(signal?: AbortSignal): Promise<Cart> {
  const { data } = await http.get<unknown>('/cart', { signal })
  return parseResponse(cartSchema, data)
}

export async function addCartItem(input: AddCartItemInput): Promise<Cart> {
  const { data } = await http.post<unknown>('/cart/items', input)
  return parseResponse(cartSchema, data)
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  const { data } = await http.patch<unknown>(`/cart/items/${encodeURIComponent(itemId)}`, {
    quantity,
  })
  return parseResponse(cartSchema, data)
}

export async function removeCartItem(itemId: string): Promise<Cart> {
  const { data } = await http.delete<unknown>(`/cart/items/${encodeURIComponent(itemId)}`)
  return parseResponse(cartSchema, data)
}

export async function applyCoupon(code: string): Promise<Cart> {
  const { data } = await http.put<unknown>('/cart/coupon', { code })
  return parseResponse(cartSchema, data)
}

export async function removeCoupon(): Promise<Cart> {
  const { data } = await http.delete<unknown>('/cart/coupon')
  return parseResponse(cartSchema, data)
}

import { http, parseResponse } from '@/lib/http'
import { favoritesSchema, type Favorites } from '@/features/favorites/types/favorites'

export const favoriteKeys = {
  all: ['favorites'] as const,
}

export async function fetchFavorites(signal?: AbortSignal): Promise<Favorites> {
  const { data } = await http.get<unknown>('/favorites', { signal })
  return parseResponse(favoritesSchema, data)
}

export async function addFavorite(nftId: string): Promise<Favorites> {
  const { data } = await http.put<unknown>(`/favorites/${encodeURIComponent(nftId)}`)
  return parseResponse(favoritesSchema, data)
}

export async function removeFavorite(nftId: string): Promise<Favorites> {
  const { data } = await http.delete<unknown>(`/favorites/${encodeURIComponent(nftId)}`)
  return parseResponse(favoritesSchema, data)
}

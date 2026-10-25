import { http, HttpResponse } from 'msw'
import type { Favorites } from '@/features/favorites/types/favorites'
import { API_BASE } from '@/mocks/config'
import { getDb, persistFavorites } from '@/mocks/db'
import { errorResponse, transientFailure } from '@/mocks/responses'
import { getMockScenario, simulateLatency } from '@/mocks/scenario'
import { authenticate } from '@/mocks/session'

/** Favorites belong to an account: visitors and expired sessions get a 401. */
function favoritesFor(request: Request): string[] | null {
  const auth = authenticate(request)
  if (auth.status !== 'valid') return null
  const { favorites } = getDb()
  favorites[auth.user.id] ??= []
  return favorites[auth.user.id] ?? null
}

function toFavorites(nftIds: string[]): Favorites {
  return { nftIds: [...nftIds] }
}

const signInRequired = () =>
  errorResponse('unauthorized', 'Entre na sua conta para salvar favoritos.')

export const favoriteHandlers = [
  http.get(`${API_BASE}/favorites`, async ({ request }) => {
    await simulateLatency()
    if (getMockScenario() === 'error') return transientFailure()
    const nftIds = favoritesFor(request)
    if (!nftIds) return signInRequired()
    return HttpResponse.json(toFavorites(nftIds))
  }),

  http.put<{ nftId: string }>(`${API_BASE}/favorites/:nftId`, async ({ request, params }) => {
    await simulateLatency()
    if (getMockScenario() === 'error') return transientFailure()
    const nftIds = favoritesFor(request)
    if (!nftIds) return signInRequired()
    if (!getDb().nfts.some((nft) => nft.id === params.nftId)) {
      return errorResponse('not_found', 'NFT não encontrado.')
    }
    // Idempotent: saving twice keeps a single entry.
    if (!nftIds.includes(params.nftId)) nftIds.unshift(params.nftId)
    persistFavorites()
    return HttpResponse.json(toFavorites(nftIds))
  }),

  http.delete<{ nftId: string }>(`${API_BASE}/favorites/:nftId`, async ({ request, params }) => {
    await simulateLatency()
    if (getMockScenario() === 'error') return transientFailure()
    const nftIds = favoritesFor(request)
    if (!nftIds) return signInRequired()
    const index = nftIds.indexOf(params.nftId)
    if (index >= 0) nftIds.splice(index, 1)
    persistFavorites()
    return HttpResponse.json(toFavorites(nftIds))
  }),
]

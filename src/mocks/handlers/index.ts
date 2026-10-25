import { http } from 'msw'
import { API_BASE } from '@/mocks/config'
import { authHandlers } from '@/mocks/handlers/auth'
import { cartHandlers } from '@/mocks/handlers/cart'
import { favoriteHandlers } from '@/mocks/handlers/favorites'
import { nftHandlers } from '@/mocks/handlers/nfts'
import { errorResponse } from '@/mocks/responses'

export const handlers = [
  ...nftHandlers,
  ...cartHandlers,
  ...authHandlers,
  ...favoriteHandlers,
  http.all(`${API_BASE}/*`, () => errorResponse('not_found', 'Recurso não encontrado.')),
]

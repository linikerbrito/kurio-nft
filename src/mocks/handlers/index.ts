import { http } from 'msw'
import { API_BASE } from '@/mocks/config'
import { authHandlers } from '@/mocks/handlers/auth'
import { cartHandlers } from '@/mocks/handlers/cart'
import { checkoutHandlers } from '@/mocks/handlers/checkout'
import { favoriteHandlers } from '@/mocks/handlers/favorites'
import { nftHandlers } from '@/mocks/handlers/nfts'
import { profileHandlers } from '@/mocks/handlers/profile'
import { realtimeHandlers } from '@/mocks/realtime'
import { walletHandlers } from '@/mocks/handlers/wallets'
import { errorResponse } from '@/mocks/responses'

export const handlers = [
  ...nftHandlers,
  ...cartHandlers,
  ...authHandlers,
  ...favoriteHandlers,
  ...walletHandlers,
  ...profileHandlers,
  ...checkoutHandlers,
  ...realtimeHandlers,
  http.all(`${API_BASE}/*`, () => errorResponse('not_found', 'Recurso não encontrado.')),
]

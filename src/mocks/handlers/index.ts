import { delay, http, HttpResponse } from 'msw'
import { REQUEST_TIMEOUT_MS } from '@/lib/http'
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
import { getMockScenario } from '@/mocks/scenario'

/**
 * Network conditions, checked before any resource: no connection at all, or answers that only
 * arrive after the client gave up. Otherwise it returns nothing and the request moves on.
 */
const networkConditions = http.all(`${API_BASE}/*`, async () => {
  const scenario = getMockScenario()
  if (scenario === 'offline') return HttpResponse.error()
  if (scenario === 'timeout') await delay(REQUEST_TIMEOUT_MS + 1_500)
  return undefined
})

export const handlers = [
  networkConditions,
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

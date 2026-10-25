import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { networkSchema } from '@/features/catalog/types/catalog'
import {
  walletAddressSchema,
  walletProviderLabels,
  walletProviderSchema,
  type WalletConnection,
} from '@/features/wallets/types/wallets'
import { API_BASE } from '@/mocks/config'
import { getDb, persistOrders, type MockConnection } from '@/mocks/db'
import { errorResponse, readJson, transientFailure } from '@/mocks/responses'
import { getMockScenario, simulateLatency } from '@/mocks/scenario'
import { authenticate, randomToken } from '@/mocks/session'

const connectSchema = z.object({
  walletId: z.string().nullable(),
  address: walletAddressSchema.nullable(),
  network: networkSchema,
  provider: walletProviderSchema,
})

function toConnection(connection: MockConnection): WalletConnection {
  const { id, walletId, label, address, network, provider, connectedAt } = connection
  return { id, walletId, label, address, network, provider, connectedAt }
}

/** Shared guard: latency, error scenario and an active session. */
async function signedIn(request: Request) {
  await simulateLatency()
  if (getMockScenario() === 'error') return { failure: transientFailure() }
  const auth = authenticate(request)
  if (auth.status !== 'valid') {
    return { failure: errorResponse('unauthorized', 'Sua sessão expirou.') }
  }
  return { user: auth.user }
}

export const walletHandlers = [
  http.get(`${API_BASE}/wallets`, async ({ request }) => {
    const { user, failure } = await signedIn(request)
    if (failure) return failure
    return HttpResponse.json(getDb().wallets[user.id] ?? [])
  }),

  /** Simulated handshake with the wallet app: it may refuse (`wallet-rejected` scenario). */
  http.post(`${API_BASE}/wallet-connections`, async ({ request }) => {
    const { user, failure } = await signedIn(request)
    if (failure) return failure
    const parsed = connectSchema.safeParse(await readJson(request))
    if (!parsed.success) return errorResponse('validation', 'Dados da carteira inválidos.')

    const { walletId, address, network, provider } = parsed.data
    if (getMockScenario() === 'wallet-rejected') {
      return errorResponse(
        'forbidden',
        `A conexão foi recusada no ${walletProviderLabels[provider]}. Tente novamente ou escolha outra carteira.`,
      )
    }

    const saved = walletId
      ? (getDb().wallets[user.id] ?? []).find((wallet) => wallet.id === walletId)
      : undefined
    if (walletId && !saved) return errorResponse('not_found', 'Carteira não encontrada.')
    const resolvedAddress = saved?.address ?? address
    if (!resolvedAddress) {
      return errorResponse('validation', 'Informe o endereço da carteira.', {
        address: 'Informe o endereço da carteira.',
      })
    }

    const connection: MockConnection = {
      id: `conn-${randomToken().slice(0, 8)}`,
      userId: user.id,
      active: true,
      walletId: saved?.id ?? null,
      label: saved?.label ?? 'Outra carteira',
      address: resolvedAddress,
      network,
      provider,
      connectedAt: new Date().toISOString(),
    }
    getDb().connections[connection.id] = connection
    persistOrders()
    return HttpResponse.json(toConnection(connection), { status: 201 })
  }),

  http.delete<{ connectionId: string }>(
    `${API_BASE}/wallet-connections/:connectionId`,
    async ({ request, params }) => {
      const { user, failure } = await signedIn(request)
      if (failure) return failure
      const connection = getDb().connections[params.connectionId]
      if (connection?.userId === user.id) {
        connection.active = false
        persistOrders()
      }
      return new HttpResponse(null, { status: 204 })
    },
  ),
]

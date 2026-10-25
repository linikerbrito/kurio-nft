import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { networkSchema } from '@/features/catalog/types/catalog'
import {
  walletAddressSchema,
  walletFormSchema,
  walletKindSchema,
  walletProviderLabels,
  walletProviderSchema,
  type Wallet,
  type WalletConnection,
} from '@/features/wallets/types/wallets'
import { API_BASE } from '@/mocks/config'
import { getDb, persistOrders, persistWallets, type MockConnection } from '@/mocks/db'
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

function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path.at(-1)
    if (typeof field === 'string') errors[field] ??= issue.message
  }
  return errors
}

/** Validates a wallet form body; the same address cannot be saved in two wallets. */
function readWallet(body: unknown, others: Wallet[]) {
  // The API takes `ensName: null` for "no ENS"; the form rules read it as an empty text.
  const normalized =
    body && typeof body === 'object' && 'ensName' in body && body.ensName === null
      ? { ...body, ensName: '' }
      : body
  const parsed = walletFormSchema.safeParse(normalized)
  if (!parsed.success) {
    return {
      failure: errorResponse(
        'validation',
        'Revise os dados da carteira.',
        fieldErrors(parsed.error),
      ),
    }
  }
  const { network, provider, ensName, address, ...rest } = parsed.data
  if (!network || !provider) return { failure: errorResponse('validation', 'Revise a carteira.') }
  if (others.some((wallet) => wallet.address.toLowerCase() === address.toLowerCase())) {
    const message = 'Este endereço já está cadastrado na sua outra carteira.'
    return { failure: errorResponse('conflict', message, { address: message }) }
  }
  return { data: { ...rest, address, network, provider, ensName: ensName || null } }
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

  http.post(`${API_BASE}/wallets`, async ({ request }) => {
    const { user, failure } = await signedIn(request)
    if (failure) return failure
    const body = await readJson(request)
    const kind = walletKindSchema.safeParse(
      body && typeof body === 'object' && 'kind' in body ? body.kind : null,
    )
    if (!kind.success) return errorResponse('validation', 'Tipo de carteira inválido.')

    const wallets = (getDb().wallets[user.id] ??= [])
    if (wallets.some((wallet) => wallet.kind === kind.data)) {
      return errorResponse(
        'conflict',
        kind.data === 'primary'
          ? 'Você já tem uma carteira principal.'
          : 'Você já tem uma carteira secundária.',
      )
    }
    const { data, failure: invalid } = readWallet(body, wallets)
    if (invalid) return invalid
    const wallet: Wallet = { ...data, id: `wallet-${randomToken().slice(0, 8)}`, kind: kind.data }
    wallets.push(wallet)
    persistWallets()
    return HttpResponse.json(wallet, { status: 201 })
  }),

  http.patch<{ walletId: string }>(`${API_BASE}/wallets/:walletId`, async ({ request, params }) => {
    const { user, failure } = await signedIn(request)
    if (failure) return failure
    const wallets = getDb().wallets[user.id] ?? []
    const index = wallets.findIndex((wallet) => wallet.id === params.walletId)
    const current = wallets[index]
    if (!current) return errorResponse('not_found', 'Carteira não encontrada.')
    const { data, failure: invalid } = readWallet(
      await readJson(request),
      wallets.filter((wallet) => wallet.id !== current.id),
    )
    if (invalid) return invalid
    const wallet: Wallet = { ...data, id: current.id, kind: current.kind }
    wallets[index] = wallet
    persistWallets()
    return HttpResponse.json(wallet)
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

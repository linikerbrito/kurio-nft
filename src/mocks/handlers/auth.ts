import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import type { AuthResponse, Session } from '@/features/auth/types/auth'
import { CART_ID_HEADER } from '@/lib/http'
import { API_BASE } from '@/mocks/config'
import { getDb, persistAccounts } from '@/mocks/db'
import type { MockUser } from '@/mocks/fixtures/users'
import { errorResponse, transientFailure } from '@/mocks/responses'
import { getMockScenario, simulateLatency } from '@/mocks/scenario'
import {
  authenticate,
  hashPassword,
  mergeVisitorCart,
  randomToken,
  SESSION_TTL_MS,
  toPublicUser,
} from '@/mocks/session'

const loginSchema = z.object({ email: z.string().trim(), password: z.string() })
const registerSchema = z.object({
  name: z.string().trim().min(2).max(40),
  email: z.email().trim(),
  password: z.string().min(8),
})

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

/** Opens a session and brings the visitor's cart into the account. */
function startSession(request: Request, user: MockUser): AuthResponse {
  const token = randomToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
  getDb().sessions[token] = { userId: user.id, expiresAt }
  persistAccounts()
  mergeVisitorCart(request.headers.get(CART_ID_HEADER), user.id)
  return { token, expiresAt, user: toPublicUser(user) }
}

export const authHandlers = [
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    await simulateLatency()
    if (getMockScenario() === 'error') return transientFailure()
    const parsed = loginSchema.safeParse(await readJson(request))
    if (!parsed.success) return errorResponse('validation', 'Informe e-mail e senha.')

    const email = parsed.data.email.toLowerCase()
    const user = getDb().users.find((item) => item.email === email)
    const matches =
      user && (await hashPassword(user.salt, parsed.data.password)) === user.passwordHash
    if (!user || !matches) return errorResponse('unauthorized', 'E-mail ou senha incorretos.')

    return HttpResponse.json(startSession(request, user))
  }),

  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    await simulateLatency()
    if (getMockScenario() === 'error') return transientFailure()
    const parsed = registerSchema.safeParse(await readJson(request))
    if (!parsed.success) return errorResponse('validation', 'Revise os dados do cadastro.')

    const email = parsed.data.email.toLowerCase()
    const { users } = getDb()
    if (users.some((item) => item.email === email)) {
      return errorResponse('conflict', 'Este e-mail já está cadastrado.', {
        email: 'Este e-mail já está cadastrado. Entre na sua conta.',
      })
    }

    const salt = randomToken().slice(0, 8)
    const user: MockUser = {
      id: `user-${randomToken().slice(0, 8)}`,
      name: parsed.data.name,
      email,
      salt,
      passwordHash: await hashPassword(salt, parsed.data.password),
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    }
    users.push(user)
    return HttpResponse.json(startSession(request, user), { status: 201 })
  }),

  http.get(`${API_BASE}/auth/session`, async ({ request }) => {
    await simulateLatency()
    if (getMockScenario() === 'error') return transientFailure()
    const auth = authenticate(request)
    if (auth.status !== 'valid') return errorResponse('unauthorized', 'Sessão expirada.')
    const body: Session = { user: toPublicUser(auth.user), expiresAt: auth.expiresAt }
    return HttpResponse.json(body)
  }),

  http.post(`${API_BASE}/auth/logout`, async ({ request }) => {
    await simulateLatency()
    const auth = authenticate(request)
    if (auth.status === 'valid') {
      delete getDb().sessions[auth.token]
      persistAccounts()
    }
    return new HttpResponse(null, { status: 204 })
  }),
]

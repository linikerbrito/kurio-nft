import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import { profileDataSchema, type Profile } from '@/features/profile/types/profile'
import { API_BASE } from '@/mocks/config'
import { getDb, persistAccounts } from '@/mocks/db'
import type { MockUser } from '@/mocks/fixtures/users'
import { errorResponse, readJson, transientFailure } from '@/mocks/responses'
import { getMockScenario, simulateLatency } from '@/mocks/scenario'
import { authenticate, hashPassword, randomToken } from '@/mocks/session'

/** Data URLs above this size are refused (the client resizes pictures well below it). */
const MAX_AVATAR_DATA_URL = 400_000

const avatarSchema = z.object({
  dataUrl: z
    .string()
    .regex(/^data:image\/(png|jpeg|webp);base64,/, 'Envie uma imagem PNG, JPG ou WebP.'),
})
const passwordSchema = z.object({ currentPassword: z.string(), newPassword: z.string().min(8) })

export function toProfile(user: MockUser): Profile {
  return {
    displayName: user.name,
    username: user.username ?? user.email.split('@')[0] ?? '',
    email: user.email,
    ensName: user.ensName ?? '',
    walletNickname: user.walletNickname ?? '',
    avatarUrl: user.avatarUrl,
  }
}

async function signedIn(request: Request) {
  await simulateLatency()
  if (getMockScenario() === 'error') return { failure: transientFailure() }
  const auth = authenticate(request)
  if (auth.status !== 'valid') {
    return { failure: errorResponse('unauthorized', 'Sua sessão expirou.') }
  }
  return { user: auth.user }
}

function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path.at(-1)
    if (typeof field === 'string') errors[field] ??= issue.message
  }
  return errors
}

export const profileHandlers = [
  http.get(`${API_BASE}/profile`, async ({ request }) => {
    const { user, failure } = await signedIn(request)
    if (failure) return failure
    return HttpResponse.json(toProfile(user))
  }),

  http.patch(`${API_BASE}/profile`, async ({ request }) => {
    const { user, failure } = await signedIn(request)
    if (failure) return failure
    const parsed = profileDataSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return errorResponse('validation', 'Revise os dados do perfil.', fieldErrors(parsed.error))
    }

    const { displayName, username, email, ensName, walletNickname } = parsed.data
    const others = getDb().users.filter((item) => item.id !== user.id)
    const conflicts: Record<string, string> = {}
    if (others.some((item) => item.email === email.toLowerCase())) {
      conflicts.email = 'Este e-mail já está em uso por outra conta.'
    }
    if (others.some((item) => item.username === username)) {
      conflicts.username = 'Este nome de usuário já está em uso.'
    }
    if (Object.keys(conflicts).length > 0) {
      return errorResponse('conflict', 'Alguns dados já estão em uso.', conflicts)
    }

    user.name = displayName
    user.username = username
    user.email = email.toLowerCase()
    user.ensName = ensName
    user.walletNickname = walletNickname
    persistAccounts()
    return HttpResponse.json(toProfile(user))
  }),

  http.put(`${API_BASE}/profile/avatar`, async ({ request }) => {
    const { user, failure } = await signedIn(request)
    if (failure) return failure
    const parsed = avatarSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return errorResponse('validation', 'Envie uma imagem PNG, JPG ou WebP.', {
        avatar: 'Envie uma imagem PNG, JPG ou WebP.',
      })
    }
    if (parsed.data.dataUrl.length > MAX_AVATAR_DATA_URL) {
      return errorResponse('validation', 'A imagem é grande demais.', {
        avatar: 'A imagem é grande demais.',
      })
    }
    user.avatarUrl = parsed.data.dataUrl
    persistAccounts()
    return HttpResponse.json(toProfile(user))
  }),

  http.delete(`${API_BASE}/profile/avatar`, async ({ request }) => {
    const { user, failure } = await signedIn(request)
    if (failure) return failure
    user.avatarUrl = null
    persistAccounts()
    return HttpResponse.json(toProfile(user))
  }),

  /** Stored only as a new salted hash; the current password must match first. */
  http.post(`${API_BASE}/profile/password`, async ({ request }) => {
    const { user, failure } = await signedIn(request)
    if (failure) return failure
    const parsed = passwordSchema.safeParse(await readJson(request))
    if (!parsed.success) {
      return errorResponse('validation', 'Revise a nova senha.', {
        newPassword: 'A senha precisa de pelo menos 8 caracteres.',
      })
    }
    if ((await hashPassword(user.salt, parsed.data.currentPassword)) !== user.passwordHash) {
      return errorResponse('validation', 'A senha atual está incorreta.', {
        currentPassword: 'A senha atual está incorreta.',
      })
    }
    user.salt = randomToken().slice(0, 8)
    user.passwordHash = await hashPassword(user.salt, parsed.data.newPassword)
    persistAccounts()
    return new HttpResponse(null, { status: 204 })
  }),
]

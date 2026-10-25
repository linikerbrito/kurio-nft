import { getDb, persistCarts, type MockCart } from '@/mocks/db'
import type { MockUser } from '@/mocks/fixtures/users'

export const SESSION_TTL_MS = 30 * 60 * 1000

export type Authentication =
  | { status: 'anonymous' }
  | { status: 'invalid' }
  | { status: 'valid'; user: MockUser; token: string; expiresAt: string }

/** Reads the bearer token: no token is a visitor, an unknown or expired one is invalid. */
export function authenticate(request: Request): Authentication {
  const header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return { status: 'anonymous' }

  const token = header.slice('Bearer '.length)
  const { sessions, users } = getDb()
  const session = sessions[token]
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return { status: 'invalid' }

  const user = users.find((item) => item.id === session.userId)
  if (!user) return { status: 'invalid' }
  return { status: 'valid', user, token, expiresAt: session.expiresAt }
}

export async function hashPassword(salt: string, password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function randomToken(): string {
  return crypto.randomUUID()
}

export function userCartId(userId: string): string {
  return `user:${userId}`
}

/**
 * Moves the visitor's lines into the user's cart when they sign in, adding quantities of the
 * same edition (capped later by the stock check of each line) and keeping the visitor coupon
 * when the user had none.
 */
export function mergeVisitorCart(visitorCartId: string | null, userId: string): void {
  const { carts } = getDb()
  const targetId = userCartId(userId)
  carts[targetId] ??= { id: targetId, lines: [], couponCode: null }
  const target: MockCart = carts[targetId]
  const visitor = visitorCartId ? carts[visitorCartId] : undefined
  if (!visitor || visitor.id === targetId) return

  for (const line of visitor.lines) {
    const existing = target.lines.find((item) => item.editionId === line.editionId)
    if (existing) existing.quantity += line.quantity
    else target.lines.push({ ...line, id: `${targetId}:${line.editionId}` })
  }
  target.couponCode ??= visitor.couponCode
  delete carts[visitor.id]
  persistCarts()
}

export function toPublicUser(user: MockUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  }
}

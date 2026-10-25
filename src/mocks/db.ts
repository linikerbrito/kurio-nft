import { nftFixtures, type MockNft } from '@/mocks/fixtures/nfts'
import { userFixtures, type MockUser } from '@/mocks/fixtures/users'

export interface MockCartLine {
  id: string
  nftId: string
  editionId: string
  quantity: number
}

export interface MockCart {
  id: string
  lines: MockCartLine[]
  couponCode: string | null
}

export interface MockSession {
  userId: string
  expiresAt: string
}

interface MockDb {
  nfts: MockNft[]
  carts: Record<string, MockCart>
  users: MockUser[]
  sessions: Record<string, MockSession>
  /** NFT ids saved by each user id, newest first. */
  favorites: Record<string, string[]>
}

/**
 * Carts, accounts, sessions and favorites survive reloads, as a real API would keep them;
 * the catalog always starts clean.
 */
const STORAGE_KEYS = {
  carts: 'kurio:mock-carts',
  users: 'kurio:mock-users',
  sessions: 'kurio:mock-sessions',
  favorites: 'kurio:mock-favorites',
} as const

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable: data lives only in memory for this page.
  }
}

function createDb(restore: boolean): MockDb {
  return {
    nfts: structuredClone([...nftFixtures]),
    carts: restore ? load(STORAGE_KEYS.carts, {}) : {},
    users: restore
      ? load(STORAGE_KEYS.users, structuredClone([...userFixtures]))
      : structuredClone([...userFixtures]),
    sessions: restore ? load(STORAGE_KEYS.sessions, {}) : {},
    favorites: restore ? load(STORAGE_KEYS.favorites, {}) : {},
  }
}

let db = createDb(true)

export function getDb(): MockDb {
  return db
}

export function persistCarts(): void {
  save(STORAGE_KEYS.carts, db.carts)
}

export function persistAccounts(): void {
  save(STORAGE_KEYS.users, db.users)
  save(STORAGE_KEYS.sessions, db.sessions)
}

export function persistFavorites(): void {
  save(STORAGE_KEYS.favorites, db.favorites)
}

/** Restores the known initial state of every mocked resource. */
export function resetDb(): void {
  db = createDb(false)
  try {
    Object.values(STORAGE_KEYS).forEach((key) => window.localStorage.removeItem(key))
  } catch {
    // Nothing persisted to clear.
  }
}

/** Test control: every open session becomes expired, as if its time ran out. */
export function expireSessions(): void {
  const past = new Date(Date.now() - 1000).toISOString()
  for (const session of Object.values(db.sessions)) session.expiresAt = past
  persistAccounts()
}

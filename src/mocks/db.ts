import { nftFixtures, type MockNft } from '@/mocks/fixtures/nfts'
import type { CartCoupon, CartSummary } from '@/features/cart/types/cart'
import type { OrderItem, OrderStatus } from '@/features/orders/types/orders'
import { z } from 'zod'
import {
  walletListSchema,
  type Wallet,
  type WalletConnection,
} from '@/features/wallets/types/wallets'
import { userFixtures, type MockUser } from '@/mocks/fixtures/users'
import { walletFixtures } from '@/mocks/fixtures/wallets'

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

export interface MockConnection extends WalletConnection {
  userId: string
  active: boolean
}

export interface MockOrderItem extends OrderItem {
  editionId: string
}

export interface MockOrder {
  id: string
  userId: string
  status: OrderStatus
  version: number
  /** Decided when the order is placed (scenario); applied when it settles. */
  outcome: 'confirmed' | 'rejected'
  createdAt: string
  settlesAt: string
  settledAt: string | null
  failureReason: string | null
  txHash: string | null
  wallet: Pick<WalletConnection, 'label' | 'address' | 'network' | 'provider'>
  items: MockOrderItem[]
  coupon: CartCoupon | null
  summary: CartSummary
}

/** An `Idempotency-Key` already used: the same body gets the same order back. */
export interface MockIdempotencyRecord {
  requestHash: string
  orderId: string
}

interface MockOrders {
  orders: MockOrder[]
  connections: Record<string, MockConnection>
  idempotency: Record<string, MockIdempotencyRecord>
}

interface MockDb extends MockOrders {
  nfts: MockNft[]
  carts: Record<string, MockCart>
  users: MockUser[]
  sessions: Record<string, MockSession>
  /** NFT ids saved by each user id, newest first. */
  favorites: Record<string, string[]>
  /** Saved wallets by user id. */
  wallets: Record<string, Wallet[]>
}

/**
 * Carts, accounts, sessions, favorites, wallets and orders survive reloads, as a real API
 * would keep them. The catalog starts from the fixtures, minus what confirmed orders sold.
 */
const STORAGE_KEYS = {
  carts: 'kurio:mock-carts',
  users: 'kurio:mock-users',
  sessions: 'kurio:mock-sessions',
  favorites: 'kurio:mock-favorites',
  wallets: 'kurio:mock-wallets',
  orders: 'kurio:mock-orders',
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

function cloneWallets(): Record<string, Wallet[]> {
  return Object.fromEntries(
    Object.entries(walletFixtures).map(([userId, wallets]) => [
      userId,
      structuredClone([...wallets]),
    ]),
  )
}

/** Wallets saved by an older version of the mocks (other fields) are replaced by the fixtures. */
function restoreWallets(): Record<string, Wallet[]> {
  const stored = load<unknown>(STORAGE_KEYS.wallets, null)
  const parsed = z.record(z.string(), walletListSchema).safeParse(stored)
  return parsed.success ? parsed.data : cloneWallets()
}

const emptyOrders: MockOrders = { orders: [], connections: {}, idempotency: {} }

/** Stock sold by confirmed orders, replayed on the fixtures after a reload. */
function applySales(nfts: MockNft[], orders: MockOrder[]): MockNft[] {
  for (const order of orders) {
    if (order.status !== 'confirmed') continue
    for (const item of order.items) {
      const edition = nfts
        .find((nft) => nft.id === item.nftId)
        ?.editions.find((candidate) => candidate.id === item.editionId)
      if (edition) edition.available = Math.max(0, edition.available - item.quantity)
    }
  }
  for (const nft of nfts) {
    nft.available = nft.editions.reduce((total, edition) => total + edition.available, 0)
  }
  return nfts
}

function createDb(restore: boolean): MockDb {
  const orders = restore ? load(STORAGE_KEYS.orders, emptyOrders) : structuredClone(emptyOrders)
  return {
    ...orders,
    nfts: applySales(structuredClone([...nftFixtures]), orders.orders),
    carts: restore ? load(STORAGE_KEYS.carts, {}) : {},
    users: restore
      ? load(STORAGE_KEYS.users, structuredClone([...userFixtures]))
      : structuredClone([...userFixtures]),
    sessions: restore ? load(STORAGE_KEYS.sessions, {}) : {},
    favorites: restore ? load(STORAGE_KEYS.favorites, {}) : {},
    wallets: restore ? restoreWallets() : cloneWallets(),
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

export function persistWallets(): void {
  save(STORAGE_KEYS.wallets, db.wallets)
}

export function persistOrders(): void {
  const { orders, connections, idempotency } = db
  save(STORAGE_KEYS.orders, { orders, connections, idempotency })
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

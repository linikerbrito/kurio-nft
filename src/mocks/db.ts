import { nftFixtures, type MockNft } from '@/mocks/fixtures/nfts'

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

interface MockDb {
  nfts: MockNft[]
  carts: Record<string, MockCart>
}

/** Carts survive reloads, as a real API would keep them; the catalog always starts clean. */
const CARTS_STORAGE_KEY = 'kurio:mock-carts'

function loadCarts(): Record<string, MockCart> {
  try {
    const raw = window.localStorage.getItem(CARTS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, MockCart>) : {}
  } catch {
    return {}
  }
}

function createDb(carts: Record<string, MockCart>): MockDb {
  return { nfts: structuredClone([...nftFixtures]), carts }
}

let db = createDb(loadCarts())

export function getDb(): MockDb {
  return db
}

export function persistCarts(): void {
  try {
    window.localStorage.setItem(CARTS_STORAGE_KEY, JSON.stringify(db.carts))
  } catch {
    // Storage unavailable: carts live only in memory for this page.
  }
}

/** Restores the known initial state of every mocked resource. */
export function resetDb(): void {
  db = createDb({})
  try {
    window.localStorage.removeItem(CARTS_STORAGE_KEY)
  } catch {
    // Nothing persisted to clear.
  }
}

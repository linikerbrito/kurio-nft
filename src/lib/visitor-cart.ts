const STORAGE_KEY = 'kurio:cart-id'

let memoryCartId: string | undefined

function createId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `cart-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

/**
 * Identifies the visitor's cart across reloads. The API keeps the cart; the browser only
 * remembers which one is its own. Falls back to memory when storage is unavailable.
 */
export function getVisitorCartId(): string {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) return stored
    const created = createId()
    window.localStorage.setItem(STORAGE_KEY, created)
    return created
  } catch {
    memoryCartId ??= createId()
    return memoryCartId
  }
}

/** Starts a fresh visitor cart, so a signed-out browser no longer sees the account's items. */
export function rotateVisitorCartId(): void {
  memoryCartId = undefined
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing stored to clear.
  }
}

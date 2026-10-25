const STORAGE_KEY = 'kurio:session-token'

/** Fired by the HTTP layer when an authenticated request comes back 401. */
export const SESSION_EXPIRED_EVENT = 'kurio:session-expired'

let memoryToken: string | null = null

/** Bearer token of the signed-in user; kept so the session survives a reload. */
export function getSessionToken(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return memoryToken
  }
}

export function setSessionToken(token: string): void {
  memoryToken = token
  try {
    window.localStorage.setItem(STORAGE_KEY, token)
  } catch {
    // Storage unavailable: the session lasts until the page closes.
  }
}

export function clearSessionToken(): void {
  memoryToken = null
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing stored to clear.
  }
}

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
  takeSessionExpired()
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

const EXPIRED_KEY = 'kurio:session-expired'

/**
 * Remembers in this tab that the last session ended on the server, so the next protected
 * screen still explains why it asks to sign in (even after a reload).
 */
export function markSessionExpired(): void {
  try {
    window.sessionStorage.setItem(EXPIRED_KEY, '1')
  } catch {
    // Without storage the notice only shows on the redirect itself.
  }
}

/** Reads and clears the mark left by `markSessionExpired`. */
export function takeSessionExpired(): boolean {
  try {
    const expired = window.sessionStorage.getItem(EXPIRED_KEY) === '1'
    window.sessionStorage.removeItem(EXPIRED_KEY)
    return expired
  } catch {
    return false
  }
}

import type { z } from 'zod'

/**
 * Small JSON store in `sessionStorage`: survives a reload of the tab and ends with it.
 * Values are validated on read, so a stale or edited entry is simply ignored.
 */
export function readSessionValue<T extends z.ZodType>(key: string, schema: T): z.infer<T> | null {
  try {
    const raw = window.sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = schema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function writeSessionValue(key: string, value: unknown): void {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage unavailable: the value lives only while the page is open.
  }
}

export function removeSessionValues(prefix: string): void {
  try {
    const keys = Array.from({ length: window.sessionStorage.length }, (_, index) =>
      window.sessionStorage.key(index),
    )
    for (const key of keys) {
      if (key?.startsWith(prefix)) window.sessionStorage.removeItem(key)
    }
  } catch {
    // Nothing stored to clear.
  }
}

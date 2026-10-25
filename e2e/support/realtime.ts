import type { Page } from '@playwright/test'
import { expect } from './fixtures'

interface RealtimeControls {
  updateNft: (
    nftId: string,
    changes: { price?: string; editionId?: string; available?: number },
  ) => void
  replayLast: () => void
  emitStale: (nftId: string, price: string) => void
  disconnect: (durationMs?: number) => void
  connectionCount: () => number
  deliveries: () => {
    type: 'nft.updated' | 'order.updated'
    resourceId: string
    targetUserId: string | null
    recipients: (string | null)[]
  }[]
}

/**
 * Runs one of the server-side Socket.IO controls of the mock layer. Events still travel
 * through `socket.io-client` in the page; nothing touches the app state directly.
 */
async function control<K extends keyof RealtimeControls>(
  page: Page,
  name: K,
  ...args: Parameters<RealtimeControls[K]>
): Promise<ReturnType<RealtimeControls[K]>> {
  return page.evaluate(
    ({ name, args }) => {
      const controls = (window as Window & { kurioMocks?: { realtime: RealtimeControls } })
        .kurioMocks?.realtime
      if (!controls) throw new Error('Mock controls are not installed')
      const fn = controls[name] as (...values: unknown[]) => ReturnType<RealtimeControls[K]>
      return fn(...args)
    },
    { name, args },
  )
}

/** Waits until the page's socket finished the handshake with the mock server. */
export async function waitForSocket(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.evaluate(() => {
        const controls = (window as Window & { kurioMocks?: { realtime: RealtimeControls } })
          .kurioMocks?.realtime
        // The controls appear once the mock layer has started.
        return controls ? controls.connectionCount() : 0
      }),
    )
    .toBe(1)
}

export function updateNft(
  page: Page,
  nftId: string,
  changes: { price?: string; editionId?: string; available?: number },
) {
  return control(page, 'updateNft', nftId, changes)
}

export function replayLastEvent(page: Page) {
  return control(page, 'replayLast')
}

export function emitStaleNft(page: Page, nftId: string, price: string) {
  return control(page, 'emitStale', nftId, price)
}

export function dropConnections(page: Page, durationMs: number) {
  return control(page, 'disconnect', durationMs)
}

export function socketCount(page: Page) {
  return control(page, 'connectionCount')
}

export function deliveries(page: Page) {
  return control(page, 'deliveries')
}

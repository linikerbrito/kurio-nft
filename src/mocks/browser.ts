import { setupWorker } from 'msw/browser'
import { expireSessions, holdOrders, resetDb } from '@/mocks/db'
import { settlePendingOrders } from '@/mocks/orders'
import { handlers } from '@/mocks/handlers'
import { realtimeControls } from '@/mocks/realtime'
import { mockScenarios, resetLatency, setMockScenario, type MockScenario } from '@/mocks/scenario'

export const worker = setupWorker(...handlers)

interface MockControls {
  scenarios: readonly MockScenario[]
  setScenario: (scenario: MockScenario) => void
  reset: () => void
  /** Expires every open session, to exercise the expiration flows. */
  expireSessions: () => void
  /** Settles pending orders now instead of after their 3 s, emitting `order.updated`. */
  settleOrders: () => void
  /** Keeps pending orders pending (across reloads) until `settleOrders` runs. */
  holdOrders: (hold: boolean) => void
  /** Server side of the Socket.IO simulation: emits events, replays and drops connections. */
  realtime: typeof realtimeControls
}

declare global {
  interface Window {
    kurioMocks?: MockControls
  }
}

/** Mock-only control used by the demo and by the Playwright specs. */
function installControls(): void {
  window.kurioMocks = {
    scenarios: mockScenarios,
    setScenario: setMockScenario,
    reset: () => {
      resetDb()
      resetLatency()
    },
    expireSessions,
    settleOrders: settlePendingOrders,
    holdOrders,
    realtime: realtimeControls,
  }
}

export async function startMocking(): Promise<void> {
  installControls()
  await worker.start({
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
    onUnhandledFrame: 'bypass',
    quiet: import.meta.env.PROD,
  })
}

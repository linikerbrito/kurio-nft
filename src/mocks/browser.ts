import { setupWorker } from 'msw/browser'
import { expireSessions, resetDb } from '@/mocks/db'
import { handlers } from '@/mocks/handlers'
import { mockScenarios, resetLatency, setMockScenario, type MockScenario } from '@/mocks/scenario'

export const worker = setupWorker(...handlers)

interface MockControls {
  scenarios: readonly MockScenario[]
  setScenario: (scenario: MockScenario) => void
  reset: () => void
  /** Expires every open session, to exercise the expiration flows. */
  expireSessions: () => void
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

import { delay } from 'msw'

/**
 * `default` success, `slow` long latency, `empty` empty catalog, `error` transient failures.
 * Checkout: `wallet-rejected` (the wallet refuses to connect), `price-changed` (a price goes
 * up while the order is sent), `order-timeout` (the order is created but the answer arrives
 * after the client gave up) and `payment-rejected` (the payment is refused).
 */
export const mockScenarios = [
  'default',
  'slow',
  'empty',
  'error',
  'wallet-rejected',
  'price-changed',
  'order-timeout',
  'payment-rejected',
] as const
export type MockScenario = (typeof mockScenarios)[number]

const STORAGE_KEY = 'kurio:mock-scenario'
const QUERY_PARAM = 'mockScenario'

function isScenario(value: string | null | undefined): value is MockScenario {
  return mockScenarios.some((scenario) => scenario === value)
}

function readStoredScenario(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function setMockScenario(scenario: MockScenario): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, scenario)
  } catch {
    // Storage unavailable: the scenario falls back to the env default.
  }
}

/** Precedence: `?mockScenario=` in the page URL, stored choice, env default. */
export function getMockScenario(): MockScenario {
  const fromUrl = new URLSearchParams(window.location.search).get(QUERY_PARAM)
  if (isScenario(fromUrl)) {
    setMockScenario(fromUrl)
    return fromUrl
  }
  const stored = readStoredScenario()
  if (isScenario(stored)) return stored
  const fromEnv = import.meta.env.VITE_MOCK_SCENARIO
  return isScenario(fromEnv) ? fromEnv : 'default'
}

/** Deterministic latency cycle so variable timing is reproducible across runs. */
const defaultLatencies = [180, 320, 240, 400, 260]
let latencyIndex = 0

export function resetLatency(): void {
  latencyIndex = 0
}

export async function simulateLatency(): Promise<void> {
  if (getMockScenario() === 'slow') {
    await delay(2_500)
    return
  }
  const latency = defaultLatencies[latencyIndex % defaultLatencies.length] ?? 250
  latencyIndex++
  await delay(latency)
}

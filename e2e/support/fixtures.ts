import { test as base, expect, type Locator, type Page } from '@playwright/test'

export type MockScenario =
  | 'default'
  | 'slow'
  | 'empty'
  | 'error'
  | 'wallet-rejected'
  | 'price-changed'
  | 'order-timeout'
  | 'payment-rejected'
  | 'offline'
  | 'timeout'
  | 'out-of-order'

interface Fixtures {
  /** Mock scenario stored before the app boots; override with `test.use({ scenario })`. */
  scenario: MockScenario
  isMobileLayout: boolean
}

export const test = base.extend<Fixtures>({
  scenario: ['default', { option: true }],
  // Playwright requires the destructuring pattern even when no fixture is used.
  // eslint-disable-next-line no-empty-pattern
  isMobileLayout: async ({}, use, testInfo) => {
    await use(testInfo.project.name === 'mobile')
  },
  page: async ({ page, scenario }, use) => {
    await page.addInitScript((value) => {
      window.localStorage.setItem('kurio:mock-scenario', value)
    }, scenario)
    await use(page)
  },
})

export { expect }

/** Switches the scenario of the running mock worker without reloading the page. */
export async function setScenario(page: Page, scenario: MockScenario): Promise<void> {
  await page.evaluate((value) => {
    const controls = (window as Window & { kurioMocks?: { setScenario: (s: string) => void } })
      .kurioMocks
    if (!controls) throw new Error('Mock controls are not installed')
    controls.setScenario(value)
  }, scenario)
}

export function results(page: Page): Locator {
  return page.getByRole('list', { name: 'Resultados do catálogo' })
}

export function cardNames(page: Page): Locator {
  return results(page).getByRole('heading', { level: 3 })
}

/** Waits until the grid shows fresh data instead of the previous page kept as placeholder. */
export async function waitForResults(page: Page): Promise<void> {
  await expect(results(page)).toBeVisible()
  await expect(results(page)).not.toHaveAttribute('aria-busy', 'true')
}

/**
 * Returns the container with the filter controls: the sidebar on desktop,
 * the drawer on phones (opened here).
 */
export async function openFilters(page: Page, isMobileLayout: boolean): Promise<Locator> {
  if (!isMobileLayout) {
    return page.getByRole('complementary', { name: 'Filtros do catálogo' })
  }
  await page.getByRole('button', { name: 'Filtros e ordenação' }).click()
  const drawer = page.getByRole('dialog', { name: 'Filtros' })
  await expect(drawer).toBeVisible()
  return drawer
}

export async function closeFilters(page: Page, isMobileLayout: boolean): Promise<void> {
  if (!isMobileLayout) return
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Filtros' })).toBeHidden()
}

/** Filter options are toggle buttons named "<label>, <count> NFTs". */
export function filterOption(scope: Locator, label: string): Locator {
  return scope.getByRole('button', { name: new RegExp(`^${label}\\s*,`) })
}

/** Demo accounts of the mocks (password documented in the README). */
export const DEMO_PASSWORD = 'Kurio@123'
export const ANA = { name: 'Ana Colecionadora', email: 'ana@kurio.dev' }
export const BRUNO = { name: 'Bruno Criador', email: 'bruno@kurio.dev' }

/** Fills and submits the login form shown at `/login` (dialog or page). */
export async function signIn(page: Page, email: string, password = DEMO_PASSWORD): Promise<void> {
  await page.getByLabel('E-mail', { exact: true }).filter({ visible: true }).fill(email)
  await page.getByLabel('Senha', { exact: true }).filter({ visible: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar', exact: true }).filter({ visible: true }).click()
}

/** Signs out through the header menu (desktop) or the profile menu (phones). */
export async function signOut(page: Page, isMobileLayout: boolean): Promise<void> {
  if (isMobileLayout) {
    await page.goto('/perfil')
    await page.getByRole('button', { name: 'Sair', exact: true }).click()
  } else {
    await page.getByRole('button', { name: /^Conta de / }).click()
    await page.getByRole('menuitem', { name: 'Sair' }).click()
  }
  await expect(page.getByText('Você saiu da sua conta.')).toBeVisible()
}

export async function expireSessions(page: Page): Promise<void> {
  await page.evaluate(() => {
    const controls = (window as Window & { kurioMocks?: { expireSessions: () => void } }).kurioMocks
    if (!controls) throw new Error('Mock controls are not installed')
    controls.expireSessions()
  })
}

/** Keeps new orders pending, even across reloads, until `settleOrders` runs. */
export async function holdOrders(page: Page): Promise<void> {
  await page.evaluate(() => {
    const controls = (window as Window & { kurioMocks?: { holdOrders: (hold: boolean) => void } })
      .kurioMocks
    if (!controls) throw new Error('Mock controls are not installed')
    controls.holdOrders(true)
  })
}

/** Settles pending orders on the simulated server now (instead of waiting their 3 s). */
export async function settleOrders(page: Page): Promise<void> {
  await page.evaluate(() => {
    const controls = (window as Window & { kurioMocks?: { settleOrders: () => void } }).kurioMocks
    if (!controls) throw new Error('Mock controls are not installed')
    controls.settleOrders()
  })
}

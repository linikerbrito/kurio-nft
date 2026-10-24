import { test as base, expect, type Locator, type Page } from '@playwright/test'

export type MockScenario = 'default' | 'slow' | 'empty' | 'error'

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

import type { Page } from '@playwright/test'
import { addEmerald, EMERALD, openCheckout } from './support/checkout'
import { expect, test } from './support/fixtures'

/**
 * Visual regression of the screens that have frames in the design. Data comes from the default
 * mock scenario, the clock is frozen and every image and font is loaded before the capture,
 * so the same build always renders the same pixels.
 */

const FROZEN_NOW = new Date('2026-10-25T15:00:00-03:00')

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(FROZEN_NOW)
})

/** Scrolls through the page so lazy images load, then waits for images and fonts. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    const step = window.innerHeight / 2
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    window.scrollTo(0, 0)
    await document.fonts.ready
  })
  // Images hidden at this breakpoint (display: none) never load and are not in the capture.
  await page.waitForFunction(() =>
    Array.from(document.images)
      .filter((image) => image.getClientRects().length > 0)
      .every((image) => image.complete && image.naturalWidth > 0),
  )
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0)
}

/** Toasts come and go on their own timer; they are covered in every capture. */
function toasts(page: Page) {
  return [page.locator('[data-sonner-toaster]')]
}

/**
 * Desktop pages are captured whole. Phones and dialogs are captured as the screen shows them,
 * like the frames: fixed bars and overlays would land mid-page in a full-page image.
 */
async function capture(page: Page, name: string, fullPage: boolean) {
  await settle(page)
  await expect(page).toHaveScreenshot(name, { fullPage, mask: toasts(page) })
}

test.describe('Regressão visual', () => {
  test('início', async ({ page, isMobileLayout }) => {
    await page.goto('/')
    await expect(page.getByRole('list', { name: 'Resultados do catálogo' })).toBeVisible()
    await capture(page, 'inicio.png', !isMobileLayout)
  })

  test('detalhe do NFT', async ({ page, isMobileLayout }) => {
    await page.goto(EMERALD)
    await expect(page.getByRole('heading', { name: 'Emerald Ape #042', level: 1 })).toBeVisible()
    await capture(page, 'detalhe.png', !isMobileLayout)
  })

  test('carrinho', async ({ page, isMobileLayout }) => {
    await addEmerald(page)
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' }).first()).toBeVisible()
    await capture(page, 'carrinho.png', !isMobileLayout)
  })

  test('login', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible()
    await capture(page, 'login.png', false)
  })

  test('pagamento', async ({ page, isMobileLayout }) => {
    await openCheckout(page)
    if (isMobileLayout) {
      await expect(page.getByRole('heading', { name: 'Dados do colecionador' })).toBeVisible()
      await capture(page, 'pagamento-dados.png', !isMobileLayout)
      await page.goto('/pagamento?etapa=carteira')
      await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
      await expect(page.getByRole('radio', { name: 'Principal' })).toBeChecked()
      await capture(page, 'pagamento-carteira.png', !isMobileLayout)
      return
    }
    await expect(page.getByRole('heading', { name: 'Perfil do colecionador' })).toBeVisible()
    await expect(page.getByLabel('Tipo de carteira', { exact: true })).not.toHaveValue('')
    await capture(page, 'pagamento.png', !isMobileLayout)
  })
})

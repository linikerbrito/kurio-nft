import type { Page } from '@playwright/test'
import { ANA, expect, signIn } from './fixtures'

export const EMERALD = '/nft/emerald-ape-042'

/** Adds Emerald Ape (edition 1/10) from the detail page; ends on the cart. */
export async function addEmerald(page: Page) {
  await page.goto(EMERALD)
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
}

/** Signed in as Ana with Emerald Ape in the cart, on the payment screen. */
export async function openCheckout(page: Page) {
  await page.goto('/login?redirect=/carrinho')
  await signIn(page, ANA.email)
  await expect(page).toHaveURL(/^[^?]*\/carrinho$/)
  await addEmerald(page)
  await page.getByRole('link', { name: 'Conectar e finalizar' }).filter({ visible: true }).click()
  await expect(page).toHaveURL(/\/pagamento/)
}

/** Fills what the profile does not provide and picks MetaMask (both steps on phones). */
export async function fillCheckout(page: Page, isMobileLayout: boolean) {
  await page.getByLabel('Código de indicação').fill('KURIO2026')
  await page.getByLabel('Nome ENS').fill('anacoleciona')
  if (isMobileLayout) {
    await page.getByRole('button', { name: 'Continuar para a carteira' }).click()
    await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
  }
  await page.getByRole('radio', { name: 'MetaMask' }).check()
}

export async function openReview(page: Page) {
  await page.getByRole('button', { name: 'Confirmar compra' }).click()
  const review = page.getByRole('dialog', { name: 'Revise sua compra' })
  await expect(review).toBeVisible()
  return review
}

export function ordersCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const raw = window.localStorage.getItem('kurio:mock-orders')
    const stored: unknown = raw ? JSON.parse(raw) : null
    if (
      stored &&
      typeof stored === 'object' &&
      'orders' in stored &&
      Array.isArray(stored.orders)
    ) {
      return stored.orders.length
    }
    return 0
  })
}

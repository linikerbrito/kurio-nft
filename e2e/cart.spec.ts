import type { Page } from '@playwright/test'
import { expect, setScenario, test } from './support/fixtures'

const EMERALD = '/nft/emerald-ape-042'

/** Adds the default edition (1/10) of Emerald Ape from the detail page and opens the cart. */
async function buyEmerald(page: Page, quantity = 1) {
  await page.goto(EMERALD)
  const increase = page.getByRole('button', { name: 'Aumentar quantidade', exact: true })
  for (let step = 1; step < quantity; step++) await increase.click()
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
}

function visibleText(page: Page, text: string | RegExp) {
  return page.getByText(text).filter({ visible: true })
}

test.describe('Carrinho', () => {
  test('carrinho vazio convida a explorar o catálogo', async ({ page }) => {
    await page.goto('/carrinho')

    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio.' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Explorar NFTs' })).toBeVisible()
  })

  test('adiciona pelo detalhe e mostra os valores da API', async ({ page }) => {
    await buyEmerald(page, 2)

    await expect(page.getByRole('link', { name: 'Emerald Ape #042' }).first()).toBeVisible()
    await expect(page.getByRole('status', { name: 'Quantidade de Emerald Ape #042' })).toHaveText(
      '2',
    )
    await expect(visibleText(page, '2.388 ETH')).toBeVisible()
    await expect(visibleText(page, '0.008 ETH')).toBeVisible()
  })

  test('altera a quantidade, respeita o estoque e remove o item', async ({ page }) => {
    await buyEmerald(page)

    const increase = page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' })
    await increase.click()
    await increase.click()
    await expect(page.getByRole('status', { name: 'Quantidade de Emerald Ape #042' })).toHaveText(
      '3',
    )
    await expect(increase).toBeDisabled()
    await expect(visibleText(page, '3.57 ETH').first()).toBeVisible()

    await page.getByRole('button', { name: 'Remover Emerald Ape #042 do carrinho' }).click()
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio.' })).toBeVisible()
  })

  test('cupom inválido, expirado, válido e remoção', async ({ page }) => {
    await buyEmerald(page)

    const field = page.getByLabel('Código promocional').filter({ visible: true })
    const apply = page.getByRole('button', { name: 'Aplicar' }).filter({ visible: true })

    await field.fill('xyz')
    await apply.click()
    await expect(visibleText(page, 'Cupom inválido.')).toBeVisible()
    await expect(field).toHaveAttribute('aria-invalid', 'true')

    await field.fill('expirado')
    await apply.click()
    await expect(visibleText(page, 'Este cupom expirou.')).toBeVisible()

    await field.fill('kurio10')
    await apply.click()
    await expect(visibleText(page, /Cupom KURIO10 aplicado/)).toBeVisible()
    await expect(visibleText(page, '(-) 0.11 ETH')).toBeVisible()

    await page.getByRole('button', { name: 'Remover cupom' }).filter({ visible: true }).click()
    await expect(visibleText(page, '(-) 0.00 ETH')).toBeVisible()
  })

  test('desfaz a mudança otimista quando a API falha', async ({ page }) => {
    await buyEmerald(page)
    const quantity = page.getByRole('status', { name: 'Quantidade de Emerald Ape #042' })
    await expect(quantity).toHaveText('1')

    await setScenario(page, 'error')
    await page.getByRole('button', { name: 'Aumentar quantidade de Emerald Ape #042' }).click()

    await expect(
      page.getByText('Serviço temporariamente indisponível. Tente novamente.'),
    ).toBeVisible()
    await expect(quantity).toHaveText('1')
  })

  test('mantém o carrinho após recarregar a página', async ({ page }) => {
    await buyEmerald(page)
    await page.reload()

    await expect(page.getByRole('status', { name: 'Quantidade de Emerald Ape #042' })).toHaveText(
      '1',
    )
  })

  test('finalizar exige entrar na conta e volta ao pagamento', async ({ page }) => {
    await buyEmerald(page)

    await page.getByRole('link', { name: 'Conectar e finalizar' }).click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fpagamento/)
  })
})

test.describe('Carrinho — falha da API', () => {
  test.use({ scenario: 'error' })

  test('mostra o erro com nova tentativa', async ({ page }) => {
    await page.goto('/carrinho')

    await expect(
      page.getByRole('heading', { name: 'Não foi possível carregar o carrinho.' }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  })
})

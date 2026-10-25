import type { Page } from '@playwright/test'
import { addEmerald } from './support/checkout'
import { cardNames, expect, setScenario, test, waitForResults } from './support/fixtures'

function visibleText(page: Page, text: string | RegExp) {
  return page.getByText(text).filter({ visible: true }).first()
}

test.describe('Rede — sem conexão', () => {
  test.use({ scenario: 'offline' })

  test('explica a falha e se recupera ao tentar de novo', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Não foi possível carregar os NFTs.')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByText('Sem conexão com o servidor.')).toBeVisible()

    await setScenario(page, 'default')
    await page.getByRole('button', { name: 'Tentar novamente' }).click()
    await waitForResults(page)
    await expect(cardNames(page)).toHaveCount(9)
  })
})

test.describe('Rede — tempo esgotado', () => {
  test('cupom sem resposta a tempo avisa e funciona na nova tentativa', async ({ page }) => {
    test.slow()
    await addEmerald(page)
    const field = page.getByLabel('Código promocional').filter({ visible: true })
    const apply = page.getByRole('button', { name: 'Aplicar' }).filter({ visible: true })

    await setScenario(page, 'timeout')
    await field.fill('KURIO10')
    await apply.click()
    await expect(visibleText(page, 'O servidor demorou a responder.')).toBeVisible({
      timeout: 15_000,
    })
    await expect(visibleText(page, '(-) 0.00 ETH')).toBeVisible()

    await setScenario(page, 'default')
    await apply.click()
    await expect(visibleText(page, /Cupom KURIO10 aplicado/)).toBeVisible()
  })
})

test.describe('Rede — respostas fora de ordem', () => {
  test.use({ scenario: 'out-of-order' })

  test('a resposta antiga que chega depois não substitui a atual', async ({ page }) => {
    await page.goto('/')
    await waitForResults(page)

    // What "Novos lançamentos" lists, asked straight to the simulated API.
    const expected = await page.evaluate(async () => {
      const response = await fetch('/api/nfts?tab=new&sort=recent&page=1&pageSize=9')
      const body = (await response.json()) as { items: { name: string }[] }
      return body.items.map((item) => item.name)
    })

    // "Em alta" answers 1.5 s late; "Novos lançamentos" is asked right after and answers first.
    const trendingSettled = new Promise<void>((resolve) => {
      const settle = (request: { url: () => string }) => {
        if (request.url().includes('tab=trending')) resolve()
      }
      page.on('requestfinished', settle)
      page.on('requestfailed', settle)
    })
    await page.getByRole('button', { name: 'Em alta' }).click()
    await page.getByRole('button', { name: 'Novos lançamentos' }).click()
    await trendingSettled

    await expect(page).toHaveURL(/tab=new/)
    await expect(page.getByRole('button', { name: 'Novos lançamentos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await waitForResults(page)
    await expect(cardNames(page)).toHaveText(expected)
  })
})

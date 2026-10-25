import type { Page } from '@playwright/test'
import { addEmerald, fillCheckout, openCheckout, openReview } from './support/checkout'
import { expect, settleOrders, test } from './support/fixtures'

/** Page wider than the viewport means horizontal scrolling or cut content. */
async function expectNoHorizontalOverflow(page: Page, screen: string) {
  // Lets lazy content and fonts settle before measuring.
  await page.evaluate(() => document.fonts.ready)
  const { scrollWidth, viewport } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }))
  expect(scrollWidth, `${screen}: conteúdo mais largo que a tela`).toBeLessThanOrEqual(viewport)
}

test.describe('Layout sem overflow horizontal', () => {
  test('telas públicas', async ({ page }) => {
    const screens: [string, string, (page: Page) => ReturnType<Page['getByRole']>][] = [
      ['Início', '/', (p) => p.getByRole('list', { name: 'Resultados do catálogo' })],
      ['Detalhe', '/nft/emerald-ape-042', (p) => p.getByRole('heading', { level: 1 })],
      ['Login', '/login', (p) => p.getByRole('button', { name: 'Entrar', exact: true }).first()],
      ['Cadastro', '/cadastro', (p) => p.getByLabel('Nome de usuário').first()],
      ['NFT inexistente', '/nft/nao-existe', (p) => p.getByText('NFT não encontrado.')],
    ]
    for (const [screen, path, ready] of screens) {
      await page.goto(path)
      await expect(ready(page)).toBeVisible()
      await expectNoHorizontalOverflow(page, screen)
    }

    await addEmerald(page)
    await expectNoHorizontalOverflow(page, 'Carrinho')
  })

  test('o banner da Início cabe no cartão em celulares estreitos', async ({
    page,
    isMobileLayout,
  }) => {
    test.skip(!isMobileLayout, 'O banner compacto só existe no celular.')
    for (const width of [320, 360, 375, 390, 414]) {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/')
      const hero = page.getByRole('region', { name: 'SEJA DONO DA CULTURA DIGITAL' })
      await expect(hero.getByRole('group', { name: 'Destaques' })).toBeVisible()
      const problems = await hero.evaluate((section) => {
        const box = section.getBoundingClientRect()
        const cut = [...section.querySelectorAll<HTMLElement>('*')].filter((element) => {
          const rect = element.getBoundingClientRect()
          return (
            rect.width > 0 &&
            (rect.top < box.top - 0.5 ||
              rect.bottom > box.bottom + 0.5 ||
              rect.left < box.left - 0.5 ||
              rect.right > box.right + 0.5)
          )
        })
        const title = section.querySelector('h1')
        const titleOverflows = title ? title.scrollWidth > title.clientWidth : false
        return { cut: cut.map((element) => element.tagName), titleOverflows }
      })
      expect(problems, `${width} px`).toEqual({ cut: [], titleOverflows: false })
      await expectNoHorizontalOverflow(page, `Início ${width} px`)
    }
  })

  test('telas da conta, pagamento e recibo', async ({ page, isMobileLayout }) => {
    await openCheckout(page)
    await expectNoHorizontalOverflow(page, 'Pagamento')

    for (const [screen, path, heading] of [
      ['Perfil', '/perfil', 'Perfil do colecionador'],
      ['Carteiras', '/perfil/carteiras', 'Carteira principal'],
      ['Lista de interesse', '/perfil/favoritos', 'Lista de interesse'],
    ] as const) {
      await page.goto(path)
      await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible()
      await expectNoHorizontalOverflow(page, screen)
    }

    await page.goto('/pagamento')
    await fillCheckout(page, isMobileLayout)
    await expectNoHorizontalOverflow(page, 'Pagamento preenchido')
    const review = await openReview(page)
    await expectNoHorizontalOverflow(page, 'Revisão')
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()
    await expect(page).toHaveURL(/\/pedidos\/ord-/)
    await settleOrders(page)
    await expect(
      page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible()
    await expectNoHorizontalOverflow(page, 'Recibo')
  })
})

import type { Locator, Page } from '@playwright/test'
import { expect, test, waitForResults } from './support/fixtures'

/** True when the focused element is inside `container`. */
function focusIsInside(container: Locator) {
  return container.evaluate((element) => element.contains(document.activeElement))
}

async function tabTimes(page: Page, times: number) {
  for (let step = 0; step < times; step++) await page.keyboard.press('Tab')
}

test.describe('Acessibilidade — teclado e foco', () => {
  test('o primeiro Tab mostra o atalho para o conteúdo e ele leva ao main', async ({ page }) => {
    await page.goto('/')
    await waitForResults(page)

    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Pular para o conteúdo' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeVisible()

    await page.keyboard.press('Enter')
    await expect(page.locator('main#main')).toBeFocused()
  })

  test('abre o detalhe pelo teclado a partir do catálogo', async ({ page }) => {
    await page.goto('/')
    await waitForResults(page)

    const card = page
      .getByRole('list', { name: 'Resultados do catálogo' })
      .getByRole('link', { name: 'Emerald Ape #042', exact: true })
    await card.focus()
    await expect(card).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/nft\/emerald-ape-042$/)
  })

  test('o login valida pelo Enter e leva o foco ao primeiro campo inválido', async ({ page }) => {
    await page.goto('/login')
    const email = page.getByLabel('E-mail', { exact: true }).filter({ visible: true })
    const password = page.getByLabel('Senha', { exact: true }).filter({ visible: true })

    await password.focus()
    await page.keyboard.press('Enter')

    await expect(email).toBeFocused()
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(email).toHaveAccessibleDescription('Informe seu e-mail.')
    await expect(password).toHaveAccessibleDescription('Informe sua senha.')
  })

  test('o diálogo de login prende o foco e fecha com Escape', async ({ page, isMobileLayout }) => {
    test.skip(isMobileLayout, 'No mobile o login é uma página, não um diálogo.')
    await page.goto('/')
    await waitForResults(page)

    const signIn = page.getByRole('link', { name: 'Entrar' })
    await signIn.focus()
    await page.keyboard.press('Enter')

    const dialog = page.getByRole('dialog', { name: 'Entrar na Kurio' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('E-mail', { exact: true })).toBeFocused()

    await tabTimes(page, 15)
    expect(await focusIsInside(dialog)).toBe(true)
    await page.keyboard.press('Shift+Tab')
    expect(await focusIsInside(dialog)).toBe(true)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/$/)
  })

  test('a busca devolve o foco ao botão que a abriu', async ({ page, isMobileLayout }) => {
    test.skip(isMobileLayout, 'No mobile a busca é o campo do topo da Início.')
    await page.goto('/')
    await waitForResults(page)

    const trigger = page.getByRole('button', { name: 'Buscar NFTs' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Buscar NFTs' })
    await expect(dialog.getByRole('searchbox', { name: 'Termo de busca' })).toBeFocused()

    await tabTimes(page, 6)
    expect(await focusIsInside(dialog)).toBe(true)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('a gaveta de filtros prende o foco e o devolve ao fechar', async ({
    page,
    isMobileLayout,
  }) => {
    test.skip(!isMobileLayout, 'No desktop os filtros ficam na barra lateral.')
    await page.goto('/')
    await waitForResults(page)

    const trigger = page.getByRole('button', { name: 'Filtros e ordenação' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    const drawer = page.getByRole('dialog', { name: 'Filtros' })
    await expect(drawer).toBeVisible()
    expect(await focusIsInside(drawer)).toBe(true)

    await tabTimes(page, 25)
    expect(await focusIsInside(drawer)).toBe(true)

    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(trigger).toBeFocused()
  })
})

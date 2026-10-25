import type { Page } from '@playwright/test'
import { ANA, BRUNO, expect, setScenario, signIn, signOut, test } from './support/fixtures'

const EMERALD = '/nft/emerald-ape-042'

/** The detail heart: the "Favoritar" button on desktop, the round button on phones. */
function detailHeart(page: Page) {
  return page.getByRole('button', { name: 'Favoritar Emerald Ape #042' }).filter({ visible: true })
}

/** The heart is optimistic; waits for the API to store the change before leaving the page. */
async function toggleAndSave(page: Page) {
  const saved = page.waitForResponse(
    (response) => response.url().includes('/api/favorites/') && response.ok(),
  )
  await detailHeart(page).click()
  await saved
}

async function openEmeraldAs(page: Page, email: string) {
  await page.goto(`/login?redirect=${EMERALD}`)
  await signIn(page, email)
  await expect(page).toHaveURL(new RegExp(`^[^?]*${EMERALD}$`))
}

test.describe('Favoritos', () => {
  test('visitante é levado ao login e volta ao NFT', async ({ page }) => {
    await page.goto(EMERALD)
    await page
      .getByRole('link', { name: 'Favoritar Emerald Ape #042 (entre na sua conta para salvar)' })
      .filter({ visible: true })
      .click()

    await expect(page).toHaveURL(/\/login\?redirect=%2Fnft%2Femerald-ape-042/)
    await signIn(page, ANA.email)
    await expect(page).toHaveURL(new RegExp(`^[^?]*${EMERALD}$`))
    await expect(detailHeart(page)).toHaveAttribute('aria-pressed', 'false')
  })

  test('favorita, mantém após recarregar e desfaz', async ({ page }) => {
    await openEmeraldAs(page, ANA.email)
    await toggleAndSave(page)
    await expect(detailHeart(page)).toHaveAttribute('aria-pressed', 'true')

    await page.reload()
    await expect(detailHeart(page)).toHaveAttribute('aria-pressed', 'true')

    await toggleAndSave(page)
    await expect(detailHeart(page)).toHaveAttribute('aria-pressed', 'false')
    await page.reload()
    await expect(detailHeart(page)).toHaveAttribute('aria-pressed', 'false')
  })

  test('o coração do card na Início acompanha o favorito', async ({ page, isMobileLayout }) => {
    test.skip(!isMobileLayout, 'Os cards só mostram o coração no layout mobile.')
    await openEmeraldAs(page, ANA.email)
    await toggleAndSave(page)

    await page.goto('/')
    await expect(
      page.getByRole('button', { name: 'Favoritar Emerald Ape #042' }).first(),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: 'Favoritar Sage Nomad #009' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  test('falha da API desfaz o coração e avisa', async ({ page }) => {
    await openEmeraldAs(page, ANA.email)
    const heart = detailHeart(page)
    await expect(heart).toHaveAttribute('aria-pressed', 'false')

    await setScenario(page, 'error')
    await heart.click()

    await expect(
      page.getByText('Serviço temporariamente indisponível. Tente novamente.'),
    ).toBeVisible()
    await expect(heart).toHaveAttribute('aria-pressed', 'false')

    await setScenario(page, 'default')
    await heart.click()
    await expect(heart).toHaveAttribute('aria-pressed', 'true')
  })

  test('cada conta tem seus próprios favoritos', async ({ page, isMobileLayout }) => {
    await openEmeraldAs(page, ANA.email)
    await toggleAndSave(page)

    await signOut(page, isMobileLayout)
    await openEmeraldAs(page, BRUNO.email)
    await expect(detailHeart(page)).toHaveAttribute('aria-pressed', 'false')
  })
})

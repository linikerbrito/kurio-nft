import { expect, test } from './support/fixtures'

const EMERALD = '/nft/emerald-ape-042'

test.describe('Detalhe do NFT', () => {
  test('abre por acesso direto com os dados do NFT', async ({ page }) => {
    await page.goto(EMERALD)

    await expect(page.getByRole('heading', { level: 1, name: 'Emerald Ape #042' })).toBeVisible()
    await expect(page).toHaveTitle('Emerald Ape #042 · Kurio')
    await expect(page.getByText('ID do token: #0042').filter({ visible: true })).toBeVisible()
    await expect(page.getByText('Coleção: Kurio Apes').filter({ visible: true })).toBeVisible()
  })

  test('informa NFT inexistente e volta ao catálogo', async ({ page }) => {
    await page.goto('/nft/nao-existe')

    await expect(page.getByRole('heading', { name: 'NFT não encontrado.' })).toBeVisible()
    await page.getByRole('link', { name: 'Voltar ao catálogo' }).click()
    await expect(page).toHaveURL(/\/#catalogo$/)
  })

  test('edição esgotada fica indisponível e a primeira disponível vem marcada', async ({
    page,
  }) => {
    await page.goto(EMERALD)

    await expect(page.getByRole('radio', { name: '1/1 (esgotada)' })).toBeDisabled()
    await expect(page.getByRole('radio', { name: '1/10', exact: true })).toBeChecked()
  })

  test('a edição escolhida vai para a URL e é restaurada por ela', async ({ page }) => {
    await page.goto(EMERALD)

    await page
      .locator('label')
      .filter({ visible: true, hasText: /^1\/50$/ })
      .click()
    await expect(page).toHaveURL(/edicao=emerald-ape-042-1-50/)

    await page.goto(`${EMERALD}?edicao=emerald-ape-042-1-50`)
    await expect(page.getByRole('radio', { name: '1/50', exact: true })).toBeChecked()

    await page.goto(`${EMERALD}?edicao=emerald-ape-042-1-1`)
    await expect(page.getByRole('radio', { name: '1/10', exact: true })).toBeChecked()
  })

  test('a quantidade respeita o limite da edição', async ({ page }) => {
    await page.goto(EMERALD)

    const increase = page.getByRole('button', { name: 'Aumentar quantidade' })
    const quantity = page.getByRole('status', { name: 'Quantidade' })
    await expect(quantity).toHaveText('1')
    await expect(page.getByRole('button', { name: 'Diminuir quantidade' })).toBeDisabled()

    await increase.click()
    await increase.click()
    await expect(quantity).toHaveText('3')
    await expect(increase).toBeDisabled()
    await expect(
      page.getByText('Limite de 3 unidades nesta edição').filter({ visible: true }),
    ).toBeVisible()
  })

  test('favoritar leva ao login e guarda o retorno', async ({ page }) => {
    await page.goto(EMERALD)

    await page.getByRole('link', { name: /^Favoritar Emerald Ape #042/ }).click()
    await expect(page).toHaveURL(/\/login\?redirect=%2Fnft%2Femerald-ape-042/)
  })

  test('mostra mais NFTs da mesma coleção sem repetir o atual', async ({ page }) => {
    await page.goto(EMERALD)

    const related = page.getByRole('list', { name: 'NFTs da mesma coleção' })
    const names = related.getByRole('heading', { level: 3 })
    await expect(names).toHaveCount(5)
    await expect(related.getByRole('heading', { name: 'Emerald Ape #042' })).toHaveCount(0)
    await expect(names.first()).toHaveText('Sage Nomad #009')

    await page.getByRole('button', { name: 'Página 2 de 3' }).click()
    await expect(names.first()).not.toHaveText('Sage Nomad #009')
  })

  test('troca de aba mostra o resumo das avaliações', async ({ page }) => {
    await page.goto(EMERALD)

    await page.getByRole('tab', { name: /Avaliações de colecionadores/ }).click()
    await expect(page.getByText(/Nota média 4,\d de 5/)).toBeVisible()
  })
})

test.describe('Detalhe do NFT — mobile', () => {
  test('barra de compra mostra o total e o botão voltar retorna à Início', async ({
    page,
    isMobileLayout,
  }) => {
    test.skip(!isMobileLayout, 'Só existe no layout mobile')
    await page.goto('/')
    await page.getByRole('link', { name: 'Emerald Ape #042', exact: true }).click()
    await expect(page).toHaveURL(/\/nft\/emerald-ape-042/)

    const buyBar = page.getByRole('region', { name: 'Compra' })
    await expect(buyBar).toContainText('1.19 ETH')
    await buyBar.getByRole('button', { name: 'Aumentar quantidade' }).click()
    await expect(buyBar).toContainText('2.38 ETH')

    await page.getByRole('button', { name: 'Voltar' }).click()
    await expect(page).toHaveURL(/\/$/)
  })
})

import {
  cardNames,
  closeFilters,
  expect,
  filterOption,
  openFilters,
  results,
  setScenario,
  test,
  waitForResults,
} from './support/fixtures'

/** First page of "Listados recentemente", as in the home frames of the design. */
const firstPage = [
  'Emerald Ape #042',
  'Sage Nomad #009',
  'Neon Vessel #552',
  'Cosmic Bloom #118',
  'Violet Nomad #314',
  'Ivory Baron #088',
  'Golden Beat #207',
  'Amber Echo #233',
  'Golden Signal #160',
]

test.describe('Início — catálogo', () => {
  test('lista a primeira página na ordem do layout', async ({ page }) => {
    await page.goto('/')
    await waitForResults(page)

    await expect(cardNames(page)).toHaveText(firstPage)
    await expect(page.getByText('40 NFTs encontrados')).toBeAttached()
    await expect(page.getByRole('link', { name: 'Página 1' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  test('combina filtros, volta à primeira página e restaura o estado pelo histórico', async ({
    page,
    isMobileLayout,
  }) => {
    await page.goto('/')
    await waitForResults(page)
    await page.getByRole('link', { name: 'Página 2' }).click()
    await expect(page).toHaveURL(/page=2/)
    await waitForResults(page)
    await expect(cardNames(page).first()).toHaveText('Amber Drifter #624')

    const filters = await openFilters(page, isMobileLayout)
    await filterOption(filters, 'Música').click()
    await expect(filterOption(filters, 'Música')).toHaveAttribute('aria-pressed', 'true')
    await filterOption(filters, 'Polygon').click()
    await closeFilters(page, isMobileLayout)

    await expect(page).not.toHaveURL(/page=/)
    await expect(page).toHaveURL(/category=.*music/)
    await expect(page).toHaveURL(/network=.*polygon/)
    await waitForResults(page)
    await expect(cardNames(page)).toHaveText(['Golden Signal #160', 'Azure Ranger #567'])

    await page.goBack()
    await expect(page).not.toHaveURL(/network=/)
    await expect(page.getByText('8 NFTs encontrados')).toBeAttached()

    await page.goBack()
    await expect(page).toHaveURL(/page=2/)
    await waitForResults(page)
    await expect(cardNames(page).first()).toHaveText('Amber Drifter #624')

    await page.goForward()
    await page.goForward()
    await waitForResults(page)
    await expect(cardNames(page)).toHaveText(['Golden Signal #160', 'Azure Ranger #567'])
  })

  test('ordena pelo menor preço', async ({ page, isMobileLayout }) => {
    await page.goto('/')
    await waitForResults(page)

    const filters = await openFilters(page, isMobileLayout)
    const scope = isMobileLayout ? filters : page.locator('#catalogo')
    await scope.getByLabel('Ordenar por:').selectOption('price-asc')
    await closeFilters(page, isMobileLayout)

    await expect(page).toHaveURL(/sort=price-asc/)
    await waitForResults(page)
    const prices = results(page).getByRole('paragraph')
    await expect(prices.nth(0)).toHaveText('0.02 ETH')
    await expect(prices.nth(1)).toHaveText('0.05 ETH')
    await expect(prices.nth(2)).toHaveText('0.12 ETH')
  })

  test('filtra pela faixa de preço usando o teclado', async ({ page, isMobileLayout }) => {
    await page.goto('/')
    await waitForResults(page)

    const filters = await openFilters(page, isMobileLayout)
    const maxThumb = filters.getByRole('slider', { name: 'Preço máximo' })
    await maxThumb.focus()
    await page.keyboard.press('End')
    for (let step = 0; step < 73; step++) await page.keyboard.press('PageDown')
    await expect(maxThumb).toHaveAttribute('aria-valuetext', '5,00 ETH')
    await filters.getByRole('button', { name: 'Aplicar' }).click()
    await closeFilters(page, isMobileLayout)

    await expect(page).toHaveURL(/maxPrice=/)
    await expect(page.getByText('32 NFTs encontrados')).toBeAttached()
  })

  test('busca por nome e limpa a busca', async ({ page, isMobileLayout }) => {
    await page.goto('/')
    await waitForResults(page)

    if (isMobileLayout) {
      const field = page.getByRole('searchbox', { name: 'Buscar NFTs' })
      await field.fill('nomad')
      await field.press('Enter')
    } else {
      await page.getByRole('button', { name: 'Buscar NFTs' }).click()
      const dialog = page.getByRole('dialog', { name: 'Buscar NFTs' })
      await dialog.getByRole('searchbox', { name: 'Termo de busca' }).fill('nomad')
      await dialog.getByRole('searchbox', { name: 'Termo de busca' }).press('Enter')
      await expect(dialog).toBeHidden()
    }

    await expect(page).toHaveURL(/q=nomad/)
    await waitForResults(page)
    await expect(cardNames(page)).toHaveText(['Sage Nomad #009', 'Violet Nomad #314'])

    await page.getByRole('button', { name: 'Limpar busca' }).click()
    await expect(page).not.toHaveURL(/q=/)
    await expect(page.getByText('40 NFTs encontrados')).toBeAttached()
  })

  test('a busca leva o foco e a tela até os resultados', async ({ page, isMobileLayout }) => {
    if (isMobileLayout) {
      await page.goto('/')
      await waitForResults(page)
      const field = page.getByRole('searchbox', { name: 'Buscar NFTs' })
      await field.fill('nomad')
      await field.press('Enter')
    } else {
      // From another page the results only exist after the home page loads.
      await page.goto('/nft/emerald-ape-042')
      await page.getByRole('button', { name: 'Buscar NFTs' }).click()
      const dialog = page.getByRole('dialog', { name: 'Buscar NFTs' })
      await dialog.getByRole('searchbox', { name: 'Termo de busca' }).fill('nomad')
      await dialog.getByRole('searchbox', { name: 'Termo de busca' }).press('Enter')
    }

    const catalog = page.getByRole('region', { name: 'Catálogo de NFTs' })
    await expect(catalog).toBeFocused()
    await expect(catalog).toBeInViewport()
    await expect(cardNames(page)).toHaveText(['Sage Nomad #009', 'Violet Nomad #314'])
    await expect(cardNames(page).first()).toBeInViewport()
  })

  test('o banner do celular troca de destaque ao arrastar para o lado', async ({
    page,
    isMobileLayout,
  }) => {
    test.skip(!isMobileLayout, 'O banner com gesto é o do celular.')
    await page.goto('/')
    const hero = page.getByRole('region', { name: 'SEJA DONO DA CULTURA DIGITAL' })
    const dots = hero.getByRole('group', { name: 'Destaques' }).getByRole('button')
    await expect(dots.first()).toHaveAttribute('aria-pressed', 'true')
    const box = await hero.boundingBox()
    if (!box) throw new Error('Banner sem tamanho')

    // A real finger drag (touch events), starting on the artwork link.
    const cdp = await page.context().newCDPSession(page)
    const y = box.y + box.height / 2
    async function swipe(fromX: number, toX: number) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: fromX, y }],
      })
      for (let step = 1; step <= 5; step++) {
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [{ x: fromX + ((toX - fromX) * step) / 5, y }],
        })
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    }
    const right = box.x + box.width - 60
    const left = box.x + 60

    await swipe(right, left)
    await expect(dots.nth(1)).toHaveAttribute('aria-pressed', 'true')
    await expect(page).toHaveURL(/\/$/)

    // Back to the first, then past it to the last one.
    await swipe(left, right)
    await expect(dots.first()).toHaveAttribute('aria-pressed', 'true')
    await swipe(left, right)
    await expect(dots.last()).toHaveAttribute('aria-pressed', 'true')

    // A short tap still opens the highlighted NFT.
    await hero.getByRole('link', { name: /^Ver / }).click()
    await expect(page).toHaveURL(/\/nft\//)
  })

  test('troca de aba filtra a mesma grade', async ({ page }) => {
    await page.goto('/')
    await waitForResults(page)

    const trending = page.getByRole('button', { name: 'Em alta' })
    await trending.click()
    await expect(trending).toHaveAttribute('aria-pressed', 'true')
    await expect(page).toHaveURL(/tab=trending/)
    await expect(page.getByText('21 NFTs encontrados')).toBeAttached()
  })

  test('abre o detalhe a partir do card', async ({ page }) => {
    await page.goto('/')
    await waitForResults(page)

    await results(page).getByRole('link', { name: 'Emerald Ape #042', exact: true }).click()
    await expect(page).toHaveURL(/\/nft\/emerald-ape-042$/)
  })

  test('página fora do intervalo oferece voltar à primeira', async ({ page }) => {
    await page.goto('/?page=99')

    await expect(page.getByText('Esta página não existe.')).toBeVisible()
    await page.getByRole('link', { name: 'Voltar para a primeira página' }).click()
    await waitForResults(page)
    await expect(cardNames(page)).toHaveText(firstPage)
  })
})

test.describe('Início — layout mobile', () => {
  test('vitrine em duas colunas com a coluna direita deslocada', async ({
    page,
    isMobileLayout,
  }) => {
    test.skip(!isMobileLayout, 'Só existe no layout mobile')
    await page.goto('/')
    await waitForResults(page)

    const cards = results(page).getByRole('listitem')
    const left = await cards.nth(0).boundingBox()
    const right = await cards.nth(1).boundingBox()
    expect(left && right).toBeTruthy()
    expect(right!.x).toBeGreaterThan(left!.x)
    expect(Math.round(right!.y - left!.y)).toBe(32)
  })
})

test.describe('Início — estados', () => {
  test.describe('carregamento lento', () => {
    test.use({ scenario: 'slow' })

    test('mostra skeletons e depois os cards', async ({ page }) => {
      await page.goto('/')

      await expect(page.locator('[data-slot="skeleton"]:visible').first()).toBeVisible()
      await waitForResults(page)
      await expect(cardNames(page)).toHaveCount(9, { timeout: 10_000 })
      await expect(page.locator('#catalogo [data-slot="skeleton"]')).toHaveCount(0)
    })
  })

  test.describe('resultado vazio', () => {
    test.use({ scenario: 'empty' })

    test('informa que não há NFTs', async ({ page }) => {
      await page.goto('/')

      await expect(page.getByText('Nenhum NFT encontrado com esses filtros.')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Limpar filtros' })).toBeVisible()
    })
  })

  test.describe('falha da API', () => {
    test.use({ scenario: 'error' })

    test('mostra o erro e se recupera ao tentar de novo', async ({ page }) => {
      await page.goto('/')

      const message = page.getByText('Não foi possível carregar os NFTs.')
      await expect(message).toBeVisible({ timeout: 15_000 })

      await setScenario(page, 'default')
      await page.getByRole('button', { name: 'Tentar novamente' }).click()

      await waitForResults(page)
      await expect(cardNames(page)).toHaveText(firstPage)
      await expect(message).toBeHidden()
    })
  })
})

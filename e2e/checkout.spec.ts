import { EMERALD, fillCheckout, openCheckout, openReview, ordersCount } from './support/checkout'
import { ANA, expect, expireSessions, setScenario, signIn, test } from './support/fixtures'

const receiptTitle = 'Seus NFTs agora estão na sua carteira'

test.describe('Pagamento', () => {
  test('compra completa, do catálogo ao recibo confirmado', async ({ page, isMobileLayout }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Emerald Ape #042' }).first().click()
    await expect(page).toHaveURL(new RegExp(`${EMERALD}$`))
    await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
    await page.getByRole('link', { name: 'Conectar e finalizar' }).filter({ visible: true }).click()

    // Checkout needs an account: login brings the user back to the payment screen.
    await expect(page).toHaveURL(/\/login\?redirect=%2Fpagamento/)
    await signIn(page, ANA.email)
    await expect(page).toHaveURL(/\/pagamento$/)

    await fillCheckout(page, isMobileLayout)
    const review = await openReview(page)
    await expect(review.getByText('Emerald Ape #042')).toBeVisible()
    await expect(review.getByText('MetaMask conectada')).toBeVisible()
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()

    await expect(page).toHaveURL(/\/pedidos\/ord-/)
    await expect(
      page.getByRole('heading', { name: 'Aguardando confirmação da rede' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: receiptTitle })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('table', { name: 'NFTs comprados' })).toContainText(
      'Emerald Ape #042',
    )
    await expect(page.getByRole('link', { name: /Ver no Etherscan/ })).toBeVisible()

    // Only what was bought leaves the cart.
    await page.goto('/carrinho')
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio.' })).toBeVisible()
  })

  test('valida os campos antes da revisão', async ({ page, isMobileLayout }) => {
    await openCheckout(page)
    if (isMobileLayout) {
      await page.getByRole('button', { name: 'Continuar para a carteira' }).click()
    } else {
      await page.getByRole('button', { name: 'Confirmar compra' }).click()
    }
    await expect(page.getByText('Informe o código de indicação.')).toBeVisible()
    await expect(page.getByLabel('Nome ENS')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('carteira recusa a conexão e depois conecta', async ({ page, isMobileLayout }) => {
    await openCheckout(page)
    await fillCheckout(page, isMobileLayout)
    await setScenario(page, 'wallet-rejected')
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(
      page.getByText('A conexão foi recusada no MetaMask.', { exact: false }),
    ).toBeVisible()
    await expect(page.getByRole('dialog')).toBeHidden()

    await setScenario(page, 'default')
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Desconectar carteira' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByText('Carteira desconectada.').first()).toBeVisible()
  })

  test('pagamento recusado mantém os itens no carrinho', async ({ page, isMobileLayout }) => {
    await openCheckout(page)
    await fillCheckout(page, isMobileLayout)
    await setScenario(page, 'payment-rejected')
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()

    await expect(page.getByRole('heading', { name: 'Pagamento recusado' })).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByRole('heading', { name: receiptTitle })).toBeHidden()
    await page.getByRole('link', { name: 'Ver carrinho' }).click()
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' }).first()).toBeVisible()
  })

  test('preço alterado exige nova confirmação', async ({ page, isMobileLayout }) => {
    await openCheckout(page)
    await fillCheckout(page, isMobileLayout)
    await setScenario(page, 'price-changed')
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()

    await expect(review.getByRole('alert')).toContainText('Os valores mudaram')
    await expect(review.getByRole('alert')).toContainText('1.19 ETH → 1.24 ETH')
    await expect(page).toHaveURL(/\/pagamento/)

    await review.getByRole('button', { name: 'Confirmar com os novos valores' }).click()
    await expect(page.getByRole('heading', { name: receiptTitle })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('1.24 ETH').first()).toBeVisible()
  })

  test('clique repetido cria um único pedido', async ({ page, isMobileLayout }) => {
    await openCheckout(page)
    await fillCheckout(page, isMobileLayout)
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar pagamento' }).dblclick()

    await expect(page).toHaveURL(/\/pedidos\/ord-/)
    expect(await ordersCount(page)).toBe(1)
  })

  test('timeout após criar o pedido recupera o mesmo pedido', async ({ page, isMobileLayout }) => {
    test.slow()
    await openCheckout(page)
    await fillCheckout(page, isMobileLayout)
    await setScenario(page, 'order-timeout')
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()

    await expect(review.getByRole('alert')).toContainText('Não recebemos a confirmação a tempo', {
      timeout: 10_000,
    })
    expect(await ordersCount(page)).toBe(1)

    await review.getByRole('button', { name: 'Tentar novamente' }).click()
    await expect(page).toHaveURL(/\/pedidos\/ord-/)
    await expect(page.getByRole('heading', { name: receiptTitle })).toBeVisible({ timeout: 10_000 })
    expect(await ordersCount(page)).toBe(1)
  })

  test('recarregar após o timeout retoma a compra sem duplicar', async ({
    page,
    isMobileLayout,
  }) => {
    test.slow()
    await openCheckout(page)
    await fillCheckout(page, isMobileLayout)
    await setScenario(page, 'order-timeout')
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()
    await expect(review.getByRole('alert')).toContainText('Não recebemos a confirmação a tempo', {
      timeout: 10_000,
    })

    await page.reload()
    await page.getByRole('button', { name: 'Retomar compra' }).click()
    await expect(page).toHaveURL(/\/pedidos\/ord-/)

    // Pending orders survive a reload of the order page too.
    await page.reload()
    await expect(page.getByRole('heading', { name: receiptTitle })).toBeVisible({ timeout: 10_000 })
    expect(await ordersCount(page)).toBe(1)
  })

  test('sessão expirada no pagamento volta ao login e mantém os dados', async ({
    page,
    isMobileLayout,
  }) => {
    await openCheckout(page)
    await fillCheckout(page, isMobileLayout)
    await expireSessions(page)
    // The next request gets a 401: the confirmation itself or a background refresh of the cart,
    // whichever comes first. Either one must lead back to login.
    await page
      .getByRole('button', { name: 'Confirmar compra' })
      .click({ timeout: 3_000 })
      .catch(() => undefined)

    await expect(page).toHaveURL(/\/login\?.*sessao=expirada/)
    await expect(page.getByText('Sua sessão expirou. Entre novamente').first()).toBeVisible()
    await signIn(page, ANA.email)
    await expect(page).toHaveURL(/\/pagamento/)

    // The draft of this tab comes back for the same user.
    await page.goto('/pagamento')
    await expect(page.getByLabel('Código de indicação')).toHaveValue('KURIO2026')
    await expect(page.getByLabel('Nome ENS')).toHaveValue('anacoleciona')
  })
})

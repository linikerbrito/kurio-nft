import type { Page } from '@playwright/test'
import {
  addEmerald,
  EMERALD,
  fillCheckout,
  openCheckout,
  openReview,
  ordersCount,
} from './support/checkout'
import { ANA, BRUNO, expect, settleOrders, signIn, signOut, test } from './support/fixtures'
import {
  deliveries,
  dropConnections,
  emitStaleNft,
  replayLastEvent,
  socketCount,
  updateNft,
  waitForSocket,
} from './support/realtime'

const EMERALD_ID = 'emerald-ape-042'

function visibleText(page: Page, text: string | RegExp) {
  return page.getByText(text).filter({ visible: true }).first()
}

test.describe('Tempo real', () => {
  test('preço e estoque mudam no detalhe sem regredir com eventos repetidos ou antigos', async ({
    page,
  }) => {
    await page.goto(EMERALD)
    await waitForSocket(page)

    await updateNft(page, EMERALD_ID, {
      price: '1.50',
      editionId: `${EMERALD_ID}-1-10`,
      available: 0,
    })
    await expect(visibleText(page, /1\.50 ETH/)).toBeVisible()
    await expect(page.getByRole('radio', { name: '1/10 (esgotada)' })).toBeDisabled()

    // A repeated delivery and an older version must not change what is on screen.
    await replayLastEvent(page)
    await emitStaleNft(page, EMERALD_ID, '0.10')
    await expect(visibleText(page, /1\.50 ETH/)).toBeVisible()
    await expect(page.getByText('0.10 ETH')).toHaveCount(0)
  })

  test('o catálogo mostra o novo preço', async ({ page }) => {
    await page.goto('/')
    await waitForSocket(page)
    const card = page
      .getByRole('list', { name: 'Resultados do catálogo' })
      .getByRole('listitem')
      .filter({ hasText: 'Emerald Ape #042' })
    await expect(card).toContainText('1.19 ETH')

    await updateNft(page, EMERALD_ID, { price: '2.00' })
    await expect(card).toContainText('2.00 ETH')
  })

  test('o carrinho avisa a mudança e atualiza o resumo', async ({ page }) => {
    await addEmerald(page)
    await waitForSocket(page)

    await updateNft(page, EMERALD_ID, { price: '1.50' })
    await expect(
      page.getByText('O preço de Emerald Ape #042 mudou para 1.50 ETH. O resumo foi atualizado.'),
    ).toBeVisible()
    await expect(visibleText(page, /^1\.508 ETH$/)).toBeVisible()
  })

  test('o checkout não confirma com uma cotação desatualizada', async ({
    page,
    isMobileLayout,
  }) => {
    await openCheckout(page)
    await fillCheckout(page, isMobileLayout)
    const review = await openReview(page)
    await waitForSocket(page)

    await updateNft(page, EMERALD_ID, { price: '1.40' })
    await expect(review.getByRole('alert')).toContainText('Os valores mudaram')
    await expect(review.getByRole('alert')).toContainText('1.19 ETH → 1.40 ETH')

    await review.getByRole('button', { name: 'Confirmar com os novos valores' }).click()
    await expect(
      page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByRole('table', { name: 'NFTs comprados' })).toContainText('1.40 ETH')
  })

  test('pedido pendente se recupera depois de uma queda da conexão', async ({
    page,
    isMobileLayout,
  }) => {
    test.slow()
    await openCheckout(page)
    await fillCheckout(page, isMobileLayout)
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()
    await expect(
      page.getByRole('heading', { name: 'Aguardando confirmação da rede' }),
    ).toBeVisible()

    // The order settles while the socket is down: its event is lost and must be reconciled.
    await dropConnections(page, 5_000)
    await expect(
      page.getByRole('heading', { name: 'Seus NFTs agora estão na sua carteira' }),
    ).toBeVisible({
      timeout: 20_000,
    })
    expect(await ordersCount(page)).toBe(1)
  })

  test('trocar de usuário fecha a conexão anterior', async ({ page, isMobileLayout }) => {
    await page.goto('/login')
    await signIn(page, ANA.email)
    await expect(page.getByText(`Você entrou como ${ANA.name}.`)).toBeVisible()
    await waitForSocket(page)

    await signOut(page, isMobileLayout)
    await expect.poll(() => socketCount(page)).toBe(1)

    await page.goto('/login')
    await signIn(page, BRUNO.email)
    await expect(page.getByText(`Você entrou como ${BRUNO.name}.`)).toBeVisible()
    await expect.poll(() => socketCount(page)).toBe(1)
  })

  test('o pedido de outra sessão não chega ao usuário seguinte', async ({
    page,
    isMobileLayout,
  }) => {
    await openCheckout(page)
    await fillCheckout(page, isMobileLayout)
    const review = await openReview(page)
    await review.getByRole('button', { name: 'Confirmar pagamento' }).click()
    await expect(
      page.getByRole('heading', { name: 'Aguardando confirmação da rede' }),
    ).toBeVisible()
    const orderId = new URL(page.url()).pathname.split('/').pop() ?? ''

    // Ana leaves while her order is pending; Bruno signs in on the same tab.
    await page.goto('/')
    await signOut(page, isMobileLayout)
    await page.goto('/login')
    await signIn(page, BRUNO.email)
    await expect(page.getByText(`Você entrou como ${BRUNO.name}.`)).toBeVisible()
    await waitForSocket(page)

    // Positive control first: Bruno's connection is identified and gets public events.
    await updateNft(page, EMERALD_ID, { price: '1.30' })
    await expect
      .poll(
        async () =>
          (await deliveries(page)).findLast(
            (record) => record.type === 'nft.updated' && record.resourceId === EMERALD_ID,
          )?.recipients,
      )
      .toEqual(['user-bruno'])

    // Ana's order settles now; its event targets only Ana and reaches nobody here.
    await settleOrders(page)
    await expect
      .poll(async () =>
        (await deliveries(page)).find(
          (record) => record.type === 'order.updated' && record.resourceId === orderId,
        ),
      )
      .toMatchObject({ targetUserId: 'user-ana', recipients: [] })
  })
})

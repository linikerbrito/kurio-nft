import type { Page } from '@playwright/test'
import { addEmerald, openCheckout, openReview } from './support/checkout'
import { expect, test } from './support/fixtures'

function field(page: Page, label: string) {
  return page.getByLabel(label, { exact: true })
}

function message(page: Page, text: string) {
  return page.getByText(text, { exact: true }).filter({ visible: true })
}

async function continueToWallet(page: Page) {
  await page.getByRole('button', { name: 'Continuar para a carteira' }).click()
  await expect(page.getByRole('heading', { name: 'Pagamento com carteira' })).toBeVisible()
}

test.describe('Pagamento — campos', () => {
  test('cada campo valida o que o layout pede e, corrigido, leva à revisão', async ({
    page,
    isMobileLayout,
  }) => {
    await openCheckout(page)

    // Invalid value in every collector field of the layout.
    await field(page, 'Nome de exibição').fill('')
    await field(page, 'Nome de usuário').fill('Ana Silva')
    await field(page, 'Nome do perfil').fill('')
    await field(page, 'E-mail').fill('ana@')
    await field(page, 'Código de indicação').fill('ab')
    await field(page, 'Nome ENS').fill('Ana!')
    await field(page, 'ENS ou carteira secundária (opcional)').fill('x'.repeat(81))
    await field(page, 'Observação do colecionador (opcional)').fill('y'.repeat(281))

    await page
      .getByRole('button', {
        name: isMobileLayout ? 'Continuar para a carteira' : 'Confirmar compra',
      })
      .click()
    for (const text of [
      'Informe o nome de exibição.',
      'Use de 3 a 20 letras minúsculas, números, ponto ou _.',
      'Informe o nome do perfil.',
      'Informe um e-mail válido.',
      'Use de 4 a 12 letras ou números.',
      'Use 3 ou mais letras minúsculas, números ou hífen.',
      'Use até 80 caracteres.',
      'Use até 280 caracteres.',
    ]) {
      await expect(message(page, text)).toBeVisible()
    }
    await expect(field(page, 'Nome de exibição')).toHaveAttribute('aria-invalid', 'true')
    await expect(page.getByRole('dialog')).toBeHidden()

    await field(page, 'Nome de exibição').fill('Ana Colecionadora')
    await field(page, 'Nome de usuário').fill('ana.silva')
    await field(page, 'Nome do perfil').fill('Ana')
    await field(page, 'E-mail').fill('ana@kurio.dev')
    await field(page, 'Código de indicação').fill('KURIO2026')
    await field(page, 'Nome ENS').fill('anacoleciona')
    await field(page, 'ENS ou carteira secundária (opcional)').fill('nova.kurio.eth')
    await field(page, 'Observação do colecionador (opcional)').fill('Entrega para a coleção.')
    if (isMobileLayout) await continueToWallet(page)

    // The signing wallet is required too.
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(message(page, 'Escolha a carteira que vai assinar o pagamento.')).toBeVisible()

    await page.getByRole('radio', { name: 'Coinbase Wallet' }).check()
    const review = await openReview(page)
    await expect(review.getByText('Coinbase Wallet conectada', { exact: false })).toBeVisible()
    await expect(review.getByText('Ana Colecionadora')).toBeVisible()
  })

  test('carteiras salvas: tipo, rede, endereço e outra carteira', async ({
    page,
    isMobileLayout,
  }) => {
    await openCheckout(page)
    await field(page, 'Código de indicação').fill('KURIO2026')
    await field(page, 'Nome ENS').fill('anacoleciona')
    if (isMobileLayout) {
      await continueToWallet(page)
      // Phones choose among the saved wallets as cards.
      await expect(page.getByRole('radio', { name: /^Principal/ })).toBeChecked()
      await page.getByRole('radio', { name: /^Reserva/ }).check()
      await page.getByText('Usar outra carteira?').click()
      await expect(field(page, 'Endereço da carteira')).toHaveValue(
        '0x5C3D8e1f0a2b4c6d8e0f1a3b5c7d9e1f3a5b7A21',
      )
      await expect(field(page, 'Rede')).toHaveValue('polygon')
      await field(page, 'Endereço da carteira').fill('0xC0FFEE0000000000000000000000000000000002')
    } else {
      const walletType = field(page, 'Tipo de carteira')
      await expect(walletType.locator('option')).toHaveText([
        'Selecione uma carteira',
        'Principal · 0xA91F…E82C',
        'Reserva · nova.kurio.eth',
      ])
      await expect(walletType).toHaveValue('wallet-ana-primary')
      await expect(field(page, 'Rede')).toHaveValue('ethereum')
      await expect(field(page, 'Endereço da carteira')).toHaveValue(
        '0xA91F3b7c2d9e4f1a6b8c0d5e7f9a1b3c5d7eE82C',
      )

      // Choosing the reserve wallet brings its network and address.
      await walletType.selectOption('wallet-ana-reserve')
      await expect(field(page, 'Rede')).toHaveValue('polygon')
      await expect(field(page, 'Endereço da carteira')).toHaveValue(
        '0x5C3D8e1f0a2b4c6d8e0f1a3b5c7d9e1f3a5b7A21',
      )

      // Typing another address switches to "Usar outra carteira?" on its own.
      await field(page, 'Endereço da carteira').fill('0xC0FFEE0000000000000000000000000000000002')
      await expect(page.getByRole('checkbox', { name: 'Usar outra carteira?' })).toBeChecked()
      await expect(walletType).toBeDisabled()

      // Turning it off goes back to the saved wallet.
      await page.getByRole('checkbox', { name: 'Usar outra carteira?' }).uncheck()
      await expect(field(page, 'Endereço da carteira')).toHaveValue(
        '0x5C3D8e1f0a2b4c6d8e0f1a3b5c7d9e1f3a5b7A21',
      )
      await page.getByRole('checkbox', { name: 'Usar outra carteira?' }).check()
      await field(page, 'Endereço da carteira').fill('0xC0FFEE0000000000000000000000000000000002')
    }

    await page.getByRole('radio', { name: 'MetaMask' }).check()
    const review = await openReview(page)
    await expect(review.getByText('Outra carteira · 0xC0FF…0002')).toBeVisible()
    await expect(review.getByText('Rede Polygon', { exact: false })).toBeVisible()
  })

  test('conta sem carteiras salvas digita o endereço de outra carteira', async ({
    page,
    isMobileLayout,
  }) => {
    await page.goto('/cadastro')
    await field(page, 'Nome de usuário').fill('Carla')
    await field(page, 'E-mail').fill('carla@kurio.dev')
    await field(page, 'Senha').fill('Carla2026')
    await field(page, 'Confirmar senha').fill('Carla2026')
    await page.getByRole('button', { name: /^(Criar conta|Criar perfil)$/ }).click()
    await expect(page.getByText('Você entrou como Carla.')).toBeVisible()
    await addEmerald(page)
    await page.getByRole('link', { name: 'Conectar e finalizar' }).filter({ visible: true }).click()
    await expect(page).toHaveURL(/\/pagamento/)

    await field(page, 'Código de indicação').fill('CARLA2026')
    await field(page, 'Nome ENS').fill('carlateste')
    if (isMobileLayout) {
      await continueToWallet(page)
      await expect(
        page.getByText('Você ainda não tem carteiras salvas.', { exact: false }),
      ).toBeVisible()
    } else {
      await expect(field(page, 'Tipo de carteira')).toBeDisabled()
      await expect(field(page, 'Tipo de carteira')).toHaveAccessibleDescription(
        /Você ainda não tem carteiras salvas/,
      )
    }
    await expect(page.getByRole('checkbox', { name: 'Usar outra carteira?' })).toBeChecked()

    await field(page, 'Endereço da carteira').fill('0x123')
    await page.getByRole('radio', { name: 'MetaMask' }).check()
    await page.getByRole('button', { name: 'Confirmar compra' }).click()
    await expect(message(page, 'Use um endereço 0x com 40 caracteres hexadecimais.')).toBeVisible()
    await expect(message(page, 'Selecione uma rede.')).toBeVisible()

    await field(page, 'Endereço da carteira').fill('0xC0FFEE0000000000000000000000000000000001')
    await field(page, 'Rede').selectOption('polygon')
    const review = await openReview(page)
    await expect(review.getByText('Outra carteira · 0xC0FF…0001')).toBeVisible()
  })
})

import type { Page } from '@playwright/test'
import { ANA, BRUNO, expect, expireSessions, signIn, signOut, test } from './support/fixtures'

const EMERALD = '/nft/emerald-ape-042'

async function addEmeraldToCart(page: Page) {
  await page.goto(EMERALD)
  await page.getByRole('button', { name: /^(COMPRAR|Comprar NFT)$/ }).click()
  await expect(page).toHaveURL(/\/carrinho$/)
  await expect(page.getByRole('link', { name: 'Emerald Ape #042' }).first()).toBeVisible()
}

function field(page: Page, label: string) {
  return page.getByLabel(label, { exact: true }).filter({ visible: true })
}

test.describe('Sessão', () => {
  test('rota protegida sem sessão leva ao login e volta após entrar', async ({ page }) => {
    await page.goto('/perfil')
    await expect(page).toHaveURL(/\/login\?redirect=%2Fperfil/)

    await signIn(page, ANA.email)

    await expect(page).toHaveURL(/\/perfil$/)
    await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue(ANA.email)
  })

  test('valida os campos e recusa senha incorreta', async ({ page }) => {
    await page.goto('/login')
    await page
      .getByRole('button', { name: 'Entrar', exact: true })
      .filter({ visible: true })
      .click()

    await expect(page.getByText('Informe seu e-mail.')).toBeVisible()
    await expect(page.getByText('Informe sua senha.')).toBeVisible()
    await expect(field(page, 'E-mail')).toHaveAttribute('aria-invalid', 'true')

    await signIn(page, ANA.email, 'senhaErrada1')
    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('Google e Facebook avisam que estão indisponíveis', async ({ page }) => {
    await page.goto('/login')
    const google = page.getByRole('button', {
      name: 'Continuar com Google (indisponível na demonstração)',
    })
    await expect(google).toHaveAttribute('aria-disabled', 'true')

    await google.focus()
    await page.keyboard.press('Space')
    await expect(page.getByText('Indisponível nesta demonstração')).toBeVisible()
  })

  test('cadastro valida, recusa e-mail repetido e cria a conta', async ({ page }) => {
    await page.goto('/cadastro')
    const submit = page.getByRole('button', { name: /^(Criar conta|Criar perfil)$/ })

    await field(page, 'Nome de usuário').fill('Carla')
    await field(page, 'E-mail').fill(ANA.email)
    await field(page, 'Senha').fill('curta')
    await field(page, 'Confirmar senha').fill('outra')
    await submit.click()
    await expect(page.getByText('A senha precisa de pelo menos 8 caracteres.')).toBeVisible()
    await expect(page.getByText('As senhas não conferem.')).toBeVisible()

    await field(page, 'Senha').fill('Carla2026')
    await field(page, 'Confirmar senha').fill('Carla2026')
    await submit.click()
    await expect(
      page.getByText('Este e-mail já está cadastrado. Entre na sua conta.'),
    ).toBeVisible()

    await field(page, 'E-mail').fill('carla@kurio.dev')
    await submit.click()
    await expect(page.getByText('Você entrou como Carla.')).toBeVisible()
    await expect(page).toHaveURL(/\/$/)
  })

  test('a sessão sobrevive ao recarregar a página', async ({ page }) => {
    await page.goto('/login?redirect=/perfil')
    await signIn(page, ANA.email)
    await expect(page).toHaveURL(/^[^?]*\/perfil$/)
    await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue(ANA.email)

    await page.reload()

    await expect(page).toHaveURL(/\/perfil$/)
    await expect(page.getByLabel('Nome de exibição', { exact: true })).toHaveValue(ANA.name)
  })

  test('sessão expirada volta ao login com aviso e retoma a rota', async ({ page }) => {
    await page.goto('/login?redirect=/perfil')
    await signIn(page, ANA.email)
    await expect(page).toHaveURL(/^[^?]*\/perfil$/)
    await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue(ANA.email)

    await expireSessions(page)
    await page.reload()

    await expect(page).toHaveURL(/\/login\?.*sessao=expirada/)
    await expect(page.getByText('Sua sessão expirou. Entre novamente').first()).toBeVisible()

    await signIn(page, ANA.email)
    await expect(page).toHaveURL(/\/perfil$/)
  })

  test('carrinho do visitante passa para a conta ao entrar', async ({ page }) => {
    await addEmeraldToCart(page)

    await page.goto('/login?redirect=/carrinho')
    await signIn(page, ANA.email)

    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' }).first()).toBeVisible()
  })

  test('sair e trocar de usuário não mostra dados da conta anterior', async ({
    page,
    isMobileLayout,
  }) => {
    await page.goto('/login')
    await signIn(page, ANA.email)
    await expect(page.getByText(`Você entrou como ${ANA.name}.`)).toBeVisible()
    await addEmeraldToCart(page)

    await signOut(page, isMobileLayout)
    await page.goto('/carrinho')
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio.' })).toBeVisible()

    await page.goto('/login?redirect=/carrinho')
    await signIn(page, BRUNO.email)
    await expect(page).toHaveURL(/\/carrinho$/)
    await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio.' })).toBeVisible()

    await signOut(page, isMobileLayout)
    await page.goto('/login?redirect=/carrinho')
    await signIn(page, ANA.email)
    await expect(page.getByRole('link', { name: 'Emerald Ape #042' }).first()).toBeVisible()
  })
})

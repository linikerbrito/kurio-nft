import type { Page } from '@playwright/test'
import { ANA, BRUNO, DEMO_PASSWORD, expect, signIn, signOut, test } from './support/fixtures'

/** 2×2 PNG, enough to exercise the avatar upload. */
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGP8z8DwnwEKmBhggAkGAEgOAg6Rk0sKAAAAAElFTkSuQmCC',
  'base64',
)

async function openAs(page: Page, email: string, path: '/perfil' | '/perfil/carteiras') {
  await page.goto(`/login?redirect=${path}`)
  await signIn(page, email)
  await expect(page).toHaveURL(new RegExp(`^[^?]*${path}$`))
}

function field(page: Page, label: string) {
  return page.getByLabel(label, { exact: true })
}

test.describe('Perfil', () => {
  test('edita os dados e mantém após recarregar', async ({ page, isMobileLayout }) => {
    await openAs(page, ANA.email, '/perfil')
    await expect(field(page, 'Nome de exibição')).toHaveValue(ANA.name)

    await field(page, 'Nome de exibição').fill('Ana Souza')
    await field(page, 'Apelido da carteira').fill('Cofre principal')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByText('Perfil atualizado.')).toBeVisible()
    if (!isMobileLayout) {
      await expect(page.getByRole('button', { name: 'Conta de Ana Souza' })).toBeVisible()
    }

    await page.reload()
    await expect(field(page, 'Nome de exibição')).toHaveValue('Ana Souza')
    await expect(field(page, 'Apelido da carteira')).toHaveValue('Cofre principal')
  })

  test('valida os campos e mostra o conflito da API', async ({ page }) => {
    await openAs(page, ANA.email, '/perfil')

    await field(page, 'Nome de exibição').fill('')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByText('O nome precisa de pelo menos 2 caracteres.')).toBeVisible()

    await field(page, 'Nome de exibição').fill(ANA.name)
    await field(page, 'Nome de usuário').fill('bruno')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await expect(page.getByText('Este nome de usuário já está em uso.')).toBeVisible()
    await expect(field(page, 'Nome de usuário')).toHaveAttribute('aria-invalid', 'true')
  })

  test('altera a senha e entra com a nova', async ({ page, isMobileLayout }) => {
    await openAs(page, ANA.email, '/perfil')
    const save = page.getByRole('button', { name: 'Salvar', exact: true })

    await field(page, 'Senha atual').fill('errada123')
    await field(page, 'Nova senha').fill('NovaSenha1')
    await field(page, 'Confirmar nova senha').fill('Outra1234')
    await save.click()
    await expect(page.getByText('As senhas não conferem.')).toBeVisible()

    await field(page, 'Confirmar nova senha').fill('NovaSenha1')
    await save.click()
    await expect(page.getByText('A senha atual está incorreta.')).toBeVisible()

    await field(page, 'Senha atual').fill(DEMO_PASSWORD)
    await save.click()
    await expect(page.getByText('Perfil e senha atualizados.')).toBeVisible()
    await expect(field(page, 'Senha atual')).toHaveValue('')

    await signOut(page, isMobileLayout)
    await page.goto('/login?redirect=/perfil')
    await signIn(page, ANA.email, DEMO_PASSWORD)
    await expect(page.getByText('E-mail ou senha incorretos.')).toBeVisible()
    await signIn(page, ANA.email, 'NovaSenha1')
    await expect(page).toHaveURL(/\/perfil$/)
  })

  test('troca e remove o avatar', async ({ page }) => {
    await openAs(page, ANA.email, '/perfil')
    const picker = page.getByLabel('Escolher imagem do avatar')

    await picker.setInputFiles({
      name: 'notas.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('oi'),
    })
    await expect(page.getByText('Use uma imagem PNG, JPG ou WebP.')).toBeVisible()

    await picker.setInputFiles({ name: 'avatar.png', mimeType: 'image/png', buffer: tinyPng })
    await expect(page.getByText('Avatar atualizado.')).toBeVisible()
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('img', { name: 'Seu avatar' })).toBeVisible()
    await page.getByRole('button', { name: 'Remover' }).click()
    await expect(page.getByRole('img', { name: 'Sem avatar' })).toBeVisible()
  })

  test('itens fora da demonstração avisam que estão indisponíveis', async ({ page }) => {
    await openAs(page, ANA.email, '/perfil')
    const activity = page.getByRole('link', { name: 'Atividade (indisponível na demonstração)' })
    await expect(activity).toHaveAttribute('aria-disabled', 'true')
    await activity.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByText('Indisponível nesta demonstração')).toBeVisible()
  })
})

test.describe('Carteiras', () => {
  test('edita a carteira principal, valida e mantém após recarregar', async ({ page }) => {
    await openAs(page, ANA.email, '/perfil/carteiras')
    const primary = page.getByRole('form', { name: 'Dados da carteira principal' })
    await expect(primary.getByLabel('Apelido da carteira', { exact: true })).toHaveValue(
      'Principal',
    )

    await primary.getByLabel('Endereço da carteira', { exact: true }).fill('0x123')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(
      primary.getByText(
        'Endereço inválido. Ele começa com 0x e tem mais 40 números ou letras de a a f.',
      ),
    ).toBeVisible()

    // The address of the secondary wallet cannot be reused.
    await primary
      .getByLabel('Endereço da carteira', { exact: true })
      .fill('0x5C3D8e1f0a2b4c6d8e0f1a3b5c7d9e1f3a5b7A21')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(
      primary.getByText('Este endereço já está cadastrado na sua outra carteira.'),
    ).toBeVisible()

    await primary
      .getByLabel('Endereço da carteira', { exact: true })
      .fill('0xA91F3b7c2d9e4f1a6b8c0d5e7f9a1b3c5d7eE82C')
    await primary.getByLabel('Apelido da carteira', { exact: true }).fill('Cofre')
    await primary.getByLabel('Tipo de carteira', { exact: true }).selectOption('coinbase')
    await primary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira principal salva.')).toBeVisible()

    await page.reload()
    await expect(primary.getByLabel('Apelido da carteira', { exact: true })).toHaveValue('Cofre')
    await expect(primary.getByLabel('Tipo de carteira', { exact: true })).toHaveValue('coinbase')
  })

  test('adiciona a carteira secundária igual à principal', async ({ page }) => {
    await openAs(page, BRUNO.email, '/perfil/carteiras')
    await expect(page.getByText('Você ainda não adicionou uma carteira secundária.')).toBeVisible()

    await page.getByRole('checkbox', { name: 'Igual à carteira principal' }).check()
    const secondary = page.getByRole('form', { name: 'Dados da carteira secundária' })
    await expect(secondary.getByLabel('Nome de exibição', { exact: true })).toHaveValue(BRUNO.name)
    await expect(secondary.getByLabel('Código de indicação', { exact: true })).toHaveValue(
      'ATELIE01',
    )

    await secondary.getByLabel('Apelido da carteira', { exact: true }).fill('Reserva')
    await secondary
      .getByLabel('Endereço da carteira', { exact: true })
      .fill('0xC0FFEE0000000000000000000000000000000001')
    await secondary.getByRole('button', { name: 'Salvar carteira' }).click()
    await expect(page.getByText('Carteira secundária salva.')).toBeVisible()

    await page.reload()
    await expect(
      page
        .getByRole('form', { name: 'Dados da carteira secundária' })
        .getByLabel('Apelido da carteira', { exact: true }),
    ).toHaveValue('Reserva')
  })
})

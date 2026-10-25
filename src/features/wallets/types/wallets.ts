import { z } from 'zod'
import { networkSchema } from '@/features/catalog/types/catalog'
import { emailField } from '@/features/auth/types/auth'

/** Ethereum-style address: `0x` followed by 40 hex digits. ENS names get their own hint. */
export const walletAddressSchema = z
  .string()
  .trim()
  .superRefine((value, context) => {
    if (/^0x[0-9a-fA-F]{40}$/.test(value)) return
    context.addIssue({
      code: 'custom',
      message: /\.eth$/i.test(value)
        ? 'Aqui vai o endereço 0x da carteira; nomes ENS vão no campo ENS.'
        : 'Endereço inválido. Ele começa com 0x e tem mais 40 números ou letras de a a f.',
    })
  })

export const walletKindSchema = z.enum(['primary', 'secondary'])
export type WalletKind = z.infer<typeof walletKindSchema>

/** Apps used to sign the payment ("Carteira e rede" in the payment screen). */
export const walletProviderIds = ['walletconnect', 'metamask', 'coinbase'] as const
export const walletProviderSchema = z.enum(walletProviderIds)
export type WalletProvider = z.infer<typeof walletProviderSchema>

export const walletProviderLabels: Record<WalletProvider, string> = {
  walletconnect: 'WalletConnect',
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
}

/** `GET /api/wallets`: the wallets saved in the collector's account. */
export const walletSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: walletKindSchema,
  address: z.string(),
  /** "ENS ou carteira secundária (opcional)". */
  ensName: z.string().nullable(),
  network: networkSchema,
  /** "Tipo de carteira": the app that holds it. */
  provider: walletProviderSchema,
  /** Owner data of the wallet form ("Nome de exibição", "Nome do perfil"…). */
  displayName: z.string(),
  profileName: z.string(),
  email: z.string(),
  referralCode: z.string(),
  /** "Nome ENS" without the `.eth` suffix. */
  ensHandle: z.string(),
})
export type Wallet = z.infer<typeof walletSchema>
export const walletListSchema = z.array(walletSchema)

/** `POST /api/wallet-connections`: a saved wallet or a typed address, signed with a provider. */
export interface ConnectWalletInput {
  walletId: string | null
  address: string | null
  network: z.infer<typeof networkSchema>
  provider: WalletProvider
}

export const walletConnectionSchema = z.object({
  id: z.string(),
  walletId: z.string().nullable(),
  label: z.string(),
  address: z.string(),
  network: networkSchema,
  provider: walletProviderSchema,
  connectedAt: z.string(),
})
export type WalletConnection = z.infer<typeof walletConnectionSchema>

const text = (required: string, max = 40) =>
  z.string().trim().min(1, required).max(max, `Use até ${max} caracteres.`)

/** Fields of the "Carteira principal/secundária" forms, as laid out in the design. */
export const walletFormSchema = z.object({
  label: text('Informe o apelido da carteira.', 30),
  displayName: text('Informe o nome de exibição.'),
  profileName: text('Informe o nome do perfil.'),
  network: networkSchema.or(z.literal('')).refine((value) => value !== '', 'Selecione uma rede.'),
  address: walletAddressSchema,
  ensName: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        /^[a-z0-9-]+(\.[a-z0-9-]+)*\.eth$/.test(value) ||
        walletAddressSchema.safeParse(value).success,
      'Use um nome .eth ou um endereço 0x.',
    ),
  provider: walletProviderSchema
    .or(z.literal(''))
    .refine((value) => value !== '', 'Selecione uma carteira.'),
  referralCode: z
    .string()
    .trim()
    .min(1, 'Informe o código de indicação.')
    .regex(/^[A-Za-z0-9]{4,12}$/, 'Use de 4 a 12 letras ou números.'),
  email: emailField,
  ensHandle: z
    .string()
    .trim()
    .min(1, 'Informe o nome ENS.')
    .regex(/^[a-z0-9-]{3,}$/, 'Use 3 ou mais letras minúsculas, números ou hífen.'),
})
export type WalletFormValues = z.input<typeof walletFormSchema>

/** `POST /api/wallets` and `PATCH /api/wallets/:id` body. */
export const walletInputSchema = walletSchema.omit({ id: true, kind: true })
export type WalletInput = z.infer<typeof walletInputSchema>

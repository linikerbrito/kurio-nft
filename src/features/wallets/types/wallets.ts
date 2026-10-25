import { z } from 'zod'
import { networkSchema } from '@/features/catalog/types/catalog'

/** Ethereum-style address: `0x` followed by 40 hex digits. */
export const walletAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[0-9a-fA-F]{40}$/, 'Use um endereço 0x com 40 caracteres hexadecimais.')

export const walletKindSchema = z.enum(['primary', 'secondary'])
export type WalletKind = z.infer<typeof walletKindSchema>

/** `GET /api/wallets`: the wallets saved in the collector's account. */
export const walletSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: walletKindSchema,
  address: z.string(),
  ensName: z.string().nullable(),
  network: networkSchema,
})
export type Wallet = z.infer<typeof walletSchema>
export const walletListSchema = z.array(walletSchema)

/** Apps used to sign the payment ("Carteira e rede" in the payment screen). */
export const walletProviderIds = ['walletconnect', 'metamask', 'coinbase'] as const
export const walletProviderSchema = z.enum(walletProviderIds)
export type WalletProvider = z.infer<typeof walletProviderSchema>

export const walletProviderLabels: Record<WalletProvider, string> = {
  walletconnect: 'WalletConnect',
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
}

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

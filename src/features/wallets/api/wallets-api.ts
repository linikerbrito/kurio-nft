import {
  walletConnectionSchema,
  walletListSchema,
  walletSchema,
  type ConnectWalletInput,
  type Wallet,
  type WalletConnection,
  type WalletInput,
  type WalletKind,
} from '@/features/wallets/types/wallets'
import { http, parseResponse } from '@/lib/http'

export const walletKeys = {
  all: ['wallets'] as const,
}

export async function fetchWallets(signal?: AbortSignal): Promise<Wallet[]> {
  const { data } = await http.get<unknown>('/wallets', { signal })
  return parseResponse(walletListSchema, data)
}

export async function createWallet(kind: WalletKind, input: WalletInput): Promise<Wallet> {
  const { data } = await http.post<unknown>('/wallets', { ...input, kind })
  return parseResponse(walletSchema, data)
}

export async function updateWallet(walletId: string, input: WalletInput): Promise<Wallet> {
  const { data } = await http.patch<unknown>(`/wallets/${encodeURIComponent(walletId)}`, input)
  return parseResponse(walletSchema, data)
}

/** Simulated wallet handshake: the API answers as the wallet app would (accept or refuse). */
export async function connectWallet(input: ConnectWalletInput): Promise<WalletConnection> {
  const { data } = await http.post<unknown>('/wallet-connections', input)
  return parseResponse(walletConnectionSchema, data)
}

export async function disconnectWallet(connectionId: string): Promise<void> {
  await http.delete(`/wallet-connections/${encodeURIComponent(connectionId)}`)
}

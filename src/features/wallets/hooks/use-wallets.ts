import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/use-session'
import {
  connectWallet,
  createWallet,
  disconnectWallet,
  fetchWallets,
  updateWallet,
  walletKeys,
} from '@/features/wallets/api/wallets-api'
import type {
  ConnectWalletInput,
  Wallet,
  WalletInput,
  WalletKind,
} from '@/features/wallets/types/wallets'

export function useWallets() {
  const { data: session } = useSession()
  return useQuery({
    queryKey: walletKeys.all,
    queryFn: ({ signal }) => fetchWallets(signal),
    enabled: Boolean(session),
    staleTime: 60_000,
  })
}

/** Connections are per checkout attempt, so they never go to the cache. */
export function useConnectWallet() {
  return useMutation({ mutationFn: (input: ConnectWalletInput) => connectWallet(input) })
}

export function useDisconnectWallet() {
  return useMutation({ mutationFn: (connectionId: string) => disconnectWallet(connectionId) })
}

/** Creates the wallet of a kind or updates the saved one; the list is replaced in the cache. */
export function useSaveWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      wallet,
      kind,
      input,
    }: {
      wallet?: Wallet
      kind: WalletKind
      input: WalletInput
    }) => (wallet ? updateWallet(wallet.id, input) : createWallet(kind, input)),
    onSuccess: (saved) => {
      queryClient.setQueryData<Wallet[]>(walletKeys.all, (wallets = []) =>
        wallets.some((item) => item.id === saved.id)
          ? wallets.map((item) => (item.id === saved.id ? saved : item))
          : [...wallets, saved],
      )
    },
  })
}

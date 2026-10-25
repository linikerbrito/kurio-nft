import { useMutation, useQuery } from '@tanstack/react-query'
import { useSession } from '@/features/auth/hooks/use-session'
import {
  connectWallet,
  disconnectWallet,
  fetchWallets,
  walletKeys,
} from '@/features/wallets/api/wallets-api'
import type { ConnectWalletInput } from '@/features/wallets/types/wallets'

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

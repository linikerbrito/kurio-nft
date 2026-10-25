import type { Network } from '@/features/catalog/types/catalog'
import { networkLabels } from '@/features/nft/network-labels'

/** "0xA91F…E82C": the start and end of an address, as the design shows it. */
export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address
}

export function networkDescription(network: Network): string {
  return network === 'ethereum' ? 'Rede principal Ethereum' : `Rede ${networkLabels[network]}`
}

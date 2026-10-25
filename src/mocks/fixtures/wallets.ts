import type { Wallet } from '@/features/wallets/types/wallets'

const ana = {
  displayName: 'Ana Colecionadora',
  profileName: 'Ana',
  email: 'ana@kurio.dev',
  referralCode: 'KURIO2026',
  ensHandle: 'anacoleciona',
}

/** Saved wallets of the demo accounts (addresses are fictitious). */
export const walletFixtures: Readonly<Record<string, readonly Wallet[]>> = {
  'user-ana': [
    {
      ...ana,
      id: 'wallet-ana-primary',
      label: 'Principal',
      kind: 'primary',
      address: '0xA91F3b7c2d9e4f1a6b8c0d5e7f9a1b3c5d7eE82C',
      ensName: null,
      network: 'ethereum',
      provider: 'metamask',
    },
    {
      ...ana,
      id: 'wallet-ana-reserve',
      label: 'Reserva',
      kind: 'secondary',
      address: '0x5C3D8e1f0a2b4c6d8e0f1a3b5c7d9e1f3a5b7A21',
      ensName: 'nova.kurio.eth',
      network: 'polygon',
      provider: 'coinbase',
    },
  ],
  'user-bruno': [
    {
      id: 'wallet-bruno-primary',
      label: 'Principal',
      kind: 'primary',
      address: '0xB7E24d6f8a0c2e4f6a8b0c2d4e6f8a0b2c4d19F0',
      ensName: null,
      network: 'ethereum',
      provider: 'walletconnect',
      displayName: 'Bruno Criador',
      profileName: 'Bruno',
      email: 'bruno@kurio.dev',
      referralCode: 'ATELIE01',
      ensHandle: 'brunocria',
    },
  ],
}

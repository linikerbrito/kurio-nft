import { createFileRoute } from '@tanstack/react-router'
import { WalletsPage } from '@/features/wallets/pages/wallets-page'

export const Route = createFileRoute('/_authenticated/perfil/carteiras')({
  staticData: {
    layout: {
      header: true,
      footer: false,
      bottomNav: true,
    },
  },
  component: WalletsPage,
})

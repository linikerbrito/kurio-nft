import { createFileRoute } from '@tanstack/react-router'
import { FavoritesPage } from '@/features/favorites/pages/favorites-page'

export const Route = createFileRoute('/_authenticated/perfil/favoritos')({
  staticData: {
    layout: {
      header: true,
      footer: false,
      bottomNav: true,
    },
  },
  component: FavoritesPage,
})

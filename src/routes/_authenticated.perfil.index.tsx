import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/features/profile/pages/profile-page'

export const Route = createFileRoute('/_authenticated/perfil/')({
  staticData: {
    layout: {
      header: true,
      footer: false,
      bottomNav: true,
    },
  },
  component: ProfilePage,
})

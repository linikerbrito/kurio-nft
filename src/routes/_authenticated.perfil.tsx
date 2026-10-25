import { createFileRoute } from '@tanstack/react-router'
import { ProfileLayout } from '@/features/profile/components/profile-layout'

export const Route = createFileRoute('/_authenticated/perfil')({
  staticData: {
    layout: {
      header: true,
      footer: false,
      bottomNav: true,
    },
  },
  component: ProfileLayout,
})

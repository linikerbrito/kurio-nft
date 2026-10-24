import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/features/catalog/pages/home-page'

export const Route = createFileRoute('/')({
  staticData: {
    layout: {
      header: true,
      footer: true,
      bottomNav: true,
    },
  },
  component: HomePage,
})

import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/features/catalog/pages/home-page'
import { catalogSearchSchema } from '@/features/catalog/types/catalog'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  staticData: {
    layout: {
      header: true,
      footer: true,
      bottomNav: true,
    },
  },
  component: HomePage,
})

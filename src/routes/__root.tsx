import { createRootRouteWithContext } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { AppShell } from '@/shared/layout/app-shell'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: AppShell,
  staticData: {
    layout: {
      header: true,
      footer: true,
      bottomNav: false,
    },
  },
})

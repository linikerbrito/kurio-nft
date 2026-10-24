import { createRouter } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'
import { queryClient } from '@/lib/query-client'

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultNotFoundComponent: NotFoundPage,
  defaultErrorComponent: ErrorPage,
})

function NotFoundPage() {
  return <h1>Página não encontrada</h1>
}

function ErrorPage() {
  return <h1>Ocorreu um erro</h1>
}

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

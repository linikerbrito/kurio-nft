import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getSession } from '@/features/auth/session'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const { session, hadToken } = await getSession(context.queryClient)

    if (!session) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
          // A token that no longer works means the session expired on the way here.
          sessao: hadToken ? 'expirada' : undefined,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}

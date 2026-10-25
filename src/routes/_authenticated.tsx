import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { getSession } from '@/features/auth/session'
import { takeSessionExpired } from '@/lib/session-token'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    const { session, hadToken } = await getSession(context.queryClient)

    if (!session) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
          // A token that no longer works (now, or in an earlier request of this tab) means the
          // session expired on the way here.
          sessao: takeSessionExpired() || hadToken ? 'expirada' : undefined,
        },
      })
    }
  },
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  return <Outlet />
}

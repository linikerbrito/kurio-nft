import { createFileRoute, redirect } from '@tanstack/react-router'
import { authSearchSchema } from '@/features/auth/auth-search'
import { LoginPage } from '@/features/auth/pages/login-page'
import { getSession } from '@/features/auth/session'

export const Route = createFileRoute('/login')({
  validateSearch: authSearchSchema,
  /** Someone already signed in goes straight to where they were heading. */
  beforeLoad: async ({ context, search }) => {
    const { session } = await getSession(context.queryClient)
    if (session) throw redirect({ href: search.redirect ?? '/' })
  },
  staticData: {
    layout: {
      header: true,
      footer: true,
      bottomNav: false,
    },
  },
  component: LoginPage,
})

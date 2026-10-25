import { useEffect } from 'react'
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { toast } from 'sonner'
import { fetchSession, login, logout, register } from '@/features/auth/api/auth-api'
import type { AuthResponse, RegisterInput, Session } from '@/features/auth/types/auth'
import { cartKeys } from '@/features/cart/hooks/use-cart'
import { favoriteKeys } from '@/features/favorites/api/favorites-api'
import { ApiError } from '@/lib/http'
import {
  clearSessionToken,
  getSessionToken,
  SESSION_EXPIRED_EVENT,
  setSessionToken,
} from '@/lib/session-token'
import { rotateVisitorCartId } from '@/lib/visitor-cart'

export const sessionKeys = {
  all: ['session'] as const,
}

/** Paths that need an account; matches the `_authenticated` routes. */
const PROTECTED_PATHS = ['/pagamento', '/perfil', '/pedidos']

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

/** Without a token there is no request: the visitor is simply signed out. */
export function sessionQueryOptions() {
  return queryOptions({
    queryKey: sessionKeys.all,
    queryFn: async ({ signal }): Promise<Session | null> => {
      if (!getSessionToken()) return null
      try {
        return await fetchSession(signal)
      } catch (error) {
        if (error instanceof ApiError && error.code === 'unauthorized') return null
        throw error
      }
    },
    staleTime: 30_000,
  })
}

export function useSession() {
  return useQuery(sessionQueryOptions())
}

/**
 * Drops every private cache entry, so the next user (or the visitor) never sees the previous
 * account's data. The cart is refetched as the visitor's.
 */
export function clearPrivateData(queryClient: QueryClient): void {
  queryClient.setQueryData(sessionQueryOptions().queryKey, null)
  queryClient.removeQueries({ queryKey: cartKeys.all })
  queryClient.removeQueries({ queryKey: favoriteKeys.all })
}

function useSignIn<TVariables>(request: (variables: TVariables) => Promise<AuthResponse>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: async ({ token, user, expiresAt }) => {
      const previousUser = queryClient.getQueryData(sessionQueryOptions().queryKey)?.user
      if (previousUser && previousUser.id !== user.id) clearPrivateData(queryClient)
      setSessionToken(token)
      const session: Session = { user, expiresAt }
      queryClient.setQueryData(sessionQueryOptions().queryKey, session)
      // The API merged the visitor cart into the account cart.
      await queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
  })
}

export function useLogin() {
  return useSignIn(({ email, password }: { email: string; password: string }) =>
    login(email, password),
  )
}

export function useRegister() {
  return useSignIn((input: RegisterInput) => register(input))
}

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  return useMutation({
    mutationFn: async () => {
      try {
        await logout()
      } catch {
        // Signing out locally is enough even when the API cannot be reached.
      }
    },
    onSettled: () => {
      clearSessionToken()
      rotateVisitorCartId()
      clearPrivateData(queryClient)
      toast.success('Você saiu da sua conta.')
      if (isProtectedPath(pathname)) void navigate({ to: '/' })
    },
  })
}

/**
 * Reacts to a session that ended while the app was open: clears private data and, on a
 * protected screen, sends the user to sign in again with the way back preserved.
 */
export function useSessionExpiredHandler() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useRouterState({ select: (state) => state.location })

  useEffect(() => {
    function handleExpired() {
      clearPrivateData(queryClient)
      if (isProtectedPath(location.pathname)) {
        void navigate({
          to: '/login',
          search: { redirect: location.href, sessao: 'expirada' },
        })
      } else {
        toast.info('Sua sessão expirou. Entre novamente para continuar.')
      }
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired)
  }, [queryClient, navigate, location.pathname, location.href])
}

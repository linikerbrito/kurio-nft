import type { QueryClient } from '@tanstack/react-query'
import { sessionQueryOptions } from '@/features/auth/hooks/use-session'
import type { Session } from '@/features/auth/types/auth'
import { getSessionToken } from '@/lib/session-token'

/**
 * Session for route guards. Reuses the cached session while it is fresh and asks the API
 * otherwise, so a session that expired between navigations is noticed.
 */
export async function getSession(
  queryClient: QueryClient,
): Promise<{ session: Session | null; hadToken: boolean }> {
  const hadToken = getSessionToken() !== null
  const session = await queryClient.fetchQuery(sessionQueryOptions())
  return { session, hadToken }
}

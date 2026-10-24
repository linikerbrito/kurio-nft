import { useRouterState } from '@tanstack/react-router'

/** Search params for `/login` that bring the user back to the current page afterwards. */
export function useLoginRedirectSearch(): { redirect: string } {
  const href = useRouterState({ select: (state) => state.location.href })
  return { redirect: href }
}

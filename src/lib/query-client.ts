import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/http'

const MAX_RETRIES = 2

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) =>
        error instanceof ApiError && error.retryable && failureCount < MAX_RETRIES,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})

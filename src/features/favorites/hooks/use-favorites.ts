import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from '@/features/auth/hooks/use-session'
import {
  addFavorite,
  favoriteKeys,
  fetchFavorites,
  removeFavorite,
} from '@/features/favorites/api/favorites-api'
import type { Favorites } from '@/features/favorites/types/favorites'
import { toApiError } from '@/lib/http'

/** Only signed-in users have favorites; visitors make no request. */
export function useFavorites() {
  const { data: session } = useSession()
  return useQuery({
    queryKey: favoriteKeys.all,
    queryFn: ({ signal }) => fetchFavorites(signal),
    enabled: Boolean(session),
    staleTime: 30_000,
  })
}

export function useIsFavorite(nftId: string): boolean {
  return useFavorites().data?.nftIds.includes(nftId) ?? false
}

interface ToggleFavoriteInput {
  nftId: string
  favorite: boolean
}

/** The summary of a newly saved NFT only arrives with the API answer; removals are immediate. */
function withFavorite(favorites: Favorites, { nftId, favorite }: ToggleFavoriteInput): Favorites {
  const others = favorites.nftIds.filter((id) => id !== nftId)
  return {
    nftIds: favorite ? [nftId, ...others] : others,
    items: favorite ? favorites.items : favorites.items.filter((item) => item.id !== nftId),
  }
}

/**
 * Optimistic toggle: the heart changes at once and rolls back, with a message, when the API
 * refuses. Same pattern as the cart quantity.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ nftId, favorite }: ToggleFavoriteInput) =>
      favorite ? addFavorite(nftId) : removeFavorite(nftId),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: favoriteKeys.all })
      const previous = queryClient.getQueryData<Favorites>(favoriteKeys.all)
      queryClient.setQueryData(
        favoriteKeys.all,
        withFavorite(previous ?? { nftIds: [], items: [] }, input),
      )
      return { previous }
    },
    onError: (error, input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(favoriteKeys.all, context.previous)
      } else {
        // Clicked before the list loaded: undo just this change and fetch the real list.
        const current = queryClient.getQueryData<Favorites>(favoriteKeys.all)
        if (current) {
          queryClient.setQueryData(
            favoriteKeys.all,
            withFavorite(current, { ...input, favorite: !input.favorite }),
          )
        }
        void queryClient.invalidateQueries({ queryKey: favoriteKeys.all })
      }
      toast.error(toApiError(error).message)
    },
    onSuccess: (favorites) => queryClient.setQueryData(favoriteKeys.all, favorites),
  })
}

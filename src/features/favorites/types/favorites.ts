import { z } from 'zod'
import { nftSummarySchema } from '@/features/catalog/types/catalog'

/**
 * `GET/PUT/DELETE /api/favorites`: the NFTs the signed-in user saved, newest first. `items` are
 * their current summaries (price, stock), for the "Lista de interesse" screen.
 */
export const favoritesSchema = z.object({
  nftIds: z.array(z.string()),
  items: z.array(nftSummarySchema),
})
export type Favorites = z.infer<typeof favoritesSchema>

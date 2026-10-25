import { z } from 'zod'

/** `GET/PUT/DELETE /api/favorites`: the NFTs the signed-in user saved, newest first. */
export const favoritesSchema = z.object({
  nftIds: z.array(z.string()),
})
export type Favorites = z.infer<typeof favoritesSchema>

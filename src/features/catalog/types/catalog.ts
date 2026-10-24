import { z } from 'zod'
import { ethAmountSchema } from '@/lib/api-contract'

export const categoryIds = [
  'digital-art',
  'photography',
  'music',
  '3d-art',
  'collectibles',
  'generative',
  'gaming',
  'memberships',
  'utility',
] as const
export const categoryIdSchema = z.enum(categoryIds)
export type CategoryId = z.infer<typeof categoryIdSchema>

export const networkIds = ['ethereum', 'polygon', 'solana'] as const
export const networkSchema = z.enum(networkIds)
export type Network = z.infer<typeof networkSchema>

export const catalogTabs = ['all', 'new', 'trending'] as const
export const catalogTabSchema = z.enum(catalogTabs)
export type CatalogTab = z.infer<typeof catalogTabSchema>

export const catalogSorts = ['recent', 'price-asc', 'price-desc', 'popular'] as const
export const catalogSortSchema = z.enum(catalogSorts)
export type CatalogSort = z.infer<typeof catalogSortSchema>

export const raritySchema = z.enum(['common', 'rare'])
export type Rarity = z.infer<typeof raritySchema>

export const nftImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
})
export type NftImage = z.infer<typeof nftImageSchema>

export const nftSummarySchema = z.object({
  id: z.string(),
  tokenId: z.string(),
  name: z.string(),
  image: nftImageSchema,
  price: ethAmountSchema,
  previousPrice: ethAmountSchema.nullable(),
  network: networkSchema,
  category: categoryIdSchema,
  collection: z.object({ id: z.string(), name: z.string() }),
  rarity: raritySchema,
  available: z.number().int().nonnegative(),
  version: z.number().int().nonnegative(),
})
export type NftSummary = z.infer<typeof nftSummarySchema>

export const nftEditionSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Total supply of the edition; null for open editions. */
  supply: z.number().int().positive().nullable(),
  available: z.number().int().nonnegative(),
})
export type NftEdition = z.infer<typeof nftEditionSchema>

export const nftSchema = nftSummarySchema.extend({
  description: z.string(),
  story: z.array(z.string()),
  gallery: z.array(nftImageSchema).min(1),
  editions: z.array(nftEditionSchema).min(1),
  attributes: z.array(z.string()),
  rating: z.object({
    average: z.number().min(0).max(5),
    count: z.number().int().nonnegative(),
  }),
  contract: z.object({ address: z.string(), standard: z.string() }),
  royaltyPercent: z.number().nonnegative(),
  listedAt: z.iso.datetime(),
})
export type Nft = z.infer<typeof nftSchema>

function facetSchema<T extends z.ZodType>(idSchema: T) {
  return z.object({ id: idSchema, label: z.string(), count: z.number().int().nonnegative() })
}

export const catalogFacetsSchema = z.object({
  categories: z.array(facetSchema(categoryIdSchema)),
  networks: z.array(facetSchema(networkSchema)),
  priceRange: z.object({ min: ethAmountSchema, max: ethAmountSchema }),
})
export type CatalogFacets = z.infer<typeof catalogFacetsSchema>

export const nftListResponseSchema = z.object({
  items: z.array(nftSummarySchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  facets: catalogFacetsSchema,
})
export type NftListResponse = z.infer<typeof nftListResponseSchema>

export const featuredNftsResponseSchema = z.object({
  slides: z.array(nftSummarySchema),
  spotlight: nftSummarySchema,
})
export type FeaturedNftsResponse = z.infer<typeof featuredNftsResponseSchema>

/**
 * Catalog state kept in the URL. Invalid values fall back to the defaults
 * instead of breaking the page, so shared or hand-edited links still load.
 */
export const catalogSearchSchema = z.object({
  q: z.string().trim().max(80).optional().catch(undefined),
  category: z.array(categoryIdSchema).optional().catch(undefined),
  network: z.array(networkSchema).optional().catch(undefined),
  minPrice: ethAmountSchema.optional().catch(undefined),
  maxPrice: ethAmountSchema.optional().catch(undefined),
  tab: catalogTabSchema.optional().catch(undefined),
  sort: catalogSortSchema.optional().catch(undefined),
  page: z.number().int().positive().optional().catch(undefined),
})
export type CatalogSearch = z.infer<typeof catalogSearchSchema>

/** Normalized parameters sent to `GET /nfts`. */
export interface NftListQuery {
  q?: string
  category?: CategoryId[]
  network?: Network[]
  minPrice?: string
  maxPrice?: string
  tab: CatalogTab
  sort: CatalogSort
  page: number
  pageSize: number
}

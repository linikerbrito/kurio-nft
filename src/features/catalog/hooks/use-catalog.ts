import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import { fetchFeaturedNfts, fetchNft, fetchNftList } from '@/features/catalog/api/catalog-api'
import type { CatalogSearch, NftListQuery } from '@/features/catalog/types/catalog'

export const NFT_PAGE_SIZE = 9

export const catalogKeys = {
  all: ['nfts'] as const,
  lists: () => [...catalogKeys.all, 'list'] as const,
  list: (query: NftListQuery) => [...catalogKeys.lists(), query] as const,
  featured: () => [...catalogKeys.all, 'featured'] as const,
  detail: (id: string) => [...catalogKeys.all, 'detail', id] as const,
}

/** Applies defaults and a stable order so equivalent URLs share one cache entry. */
export function toNftListQuery(search: CatalogSearch): NftListQuery {
  return {
    q: search.q || undefined,
    category: search.category?.length ? [...search.category].sort() : undefined,
    network: search.network?.length ? [...search.network].sort() : undefined,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    tab: search.tab ?? 'all',
    sort: search.sort ?? 'recent',
    page: search.page ?? 1,
    pageSize: NFT_PAGE_SIZE,
  }
}

export function nftListQueryOptions(query: NftListQuery) {
  return queryOptions({
    queryKey: catalogKeys.list(query),
    queryFn: ({ signal }) => fetchNftList(query, signal),
    placeholderData: keepPreviousData,
  })
}

export function featuredNftsQueryOptions() {
  return queryOptions({
    queryKey: catalogKeys.featured(),
    queryFn: ({ signal }) => fetchFeaturedNfts(signal),
    staleTime: 5 * 60_000,
  })
}

export function nftDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: catalogKeys.detail(id),
    queryFn: ({ signal }) => fetchNft(id, signal),
  })
}

export function useNftList(search: CatalogSearch) {
  return useQuery(nftListQueryOptions(toNftListQuery(search)))
}

export function useFeaturedNfts() {
  return useQuery(featuredNftsQueryOptions())
}

export function useNft(id: string) {
  return useQuery(nftDetailQueryOptions(id))
}

import { http, parseResponse } from '@/lib/http'
import {
  featuredNftsResponseSchema,
  nftListResponseSchema,
  nftSchema,
  type FeaturedNftsResponse,
  type Nft,
  type NftListQuery,
  type NftListResponse,
} from '@/features/catalog/types/catalog'

export async function fetchNftList(
  query: NftListQuery,
  signal?: AbortSignal,
): Promise<NftListResponse> {
  const { data } = await http.get<unknown>('/nfts', { params: query, signal })
  return parseResponse(nftListResponseSchema, data)
}

export async function fetchFeaturedNfts(signal?: AbortSignal): Promise<FeaturedNftsResponse> {
  const { data } = await http.get<unknown>('/nfts/featured', { signal })
  return parseResponse(featuredNftsResponseSchema, data)
}

export async function fetchNft(id: string, signal?: AbortSignal): Promise<Nft> {
  const { data } = await http.get<unknown>(`/nfts/${encodeURIComponent(id)}`, { signal })
  return parseResponse(nftSchema, data)
}

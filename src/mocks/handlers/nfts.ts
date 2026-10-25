import Decimal from 'decimal.js'
import { delay, http, HttpResponse } from 'msw'
import { z } from 'zod'
import { ethAmountSchema } from '@/lib/api-contract'
import {
  catalogSortSchema,
  catalogTabSchema,
  categoryIdSchema,
  categoryIds,
  networkIds,
  networkSchema,
  type CatalogFacets,
  type FeaturedNftsResponse,
  type Nft,
  type NftListResponse,
  type NftSummary,
} from '@/features/catalog/types/catalog'
import { getDb } from '@/mocks/db'
import { categoryLabels, featuredFixture, networkLabels, type MockNft } from '@/mocks/fixtures/nfts'
import { errorResponse, transientFailure } from '@/mocks/responses'
import { settleDueOrders } from '@/mocks/orders'
import { getMockScenario, simulateLatency } from '@/mocks/scenario'
import { API_BASE } from '@/mocks/config'

const NEW_RELEASE_WINDOW_DAYS = 14
const TRENDING_MIN_POPULARITY = 600

const listQuerySchema = z
  .object({
    q: z.string().trim().max(80).optional(),
    collection: z.string().trim().max(80).optional(),
    category: z.array(categoryIdSchema),
    network: z.array(networkSchema),
    minPrice: ethAmountSchema.optional(),
    maxPrice: ethAmountSchema.optional(),
    tab: catalogTabSchema.default('all'),
    sort: catalogSortSchema.default('recent'),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(48).default(9),
  })
  .refine(
    (query) =>
      query.minPrice === undefined ||
      query.maxPrice === undefined ||
      new Decimal(query.minPrice).lte(query.maxPrice),
    { path: ['minPrice'], message: 'O preço mínimo deve ser menor ou igual ao máximo.' },
  )

type ListQuery = z.infer<typeof listQuerySchema>

function toSummary(nft: MockNft): NftSummary {
  return {
    id: nft.id,
    tokenId: nft.tokenId,
    name: nft.name,
    image: nft.image,
    price: nft.price,
    previousPrice: nft.previousPrice,
    network: nft.network,
    category: nft.category,
    collection: nft.collection,
    rarity: nft.rarity,
    available: nft.available,
    version: nft.version,
  }
}

function toDetail(nft: MockNft): Nft {
  const detail: Nft & { popularity?: number } = { ...nft }
  delete detail.popularity
  return detail
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function matchesText(nft: MockNft, q: string | undefined): boolean {
  if (!q) return true
  const term = normalize(q)
  return [nft.name, nft.collection.name, ...nft.attributes].some((value) =>
    normalize(value).includes(term),
  )
}

function matchesTab(nft: MockNft, query: ListQuery, newestListing: number): boolean {
  if (query.tab === 'new') {
    const ageInDays = (newestListing - Date.parse(nft.listedAt)) / 86_400_000
    return ageInDays < NEW_RELEASE_WINDOW_DAYS
  }
  if (query.tab === 'trending') return nft.popularity >= TRENDING_MIN_POPULARITY
  return true
}

function matchesFilters(nft: MockNft, query: ListQuery): boolean {
  const price = new Decimal(nft.price)
  return (
    (query.collection === undefined || nft.collection.id === query.collection) &&
    (query.category.length === 0 || query.category.includes(nft.category)) &&
    (query.network.length === 0 || query.network.includes(nft.network)) &&
    (query.minPrice === undefined || price.gte(query.minPrice)) &&
    (query.maxPrice === undefined || price.lte(query.maxPrice))
  )
}

function compare(sort: ListQuery['sort']) {
  return (a: MockNft, b: MockNft): number => {
    if (sort === 'price-asc') return new Decimal(a.price).comparedTo(b.price)
    if (sort === 'price-desc') return new Decimal(b.price).comparedTo(a.price)
    if (sort === 'popular') return b.popularity - a.popularity
    return Date.parse(b.listedAt) - Date.parse(a.listedAt)
  }
}

function buildFacets(nfts: MockNft[], scope: MockNft[]): CatalogFacets {
  const prices = nfts.map((nft) => new Decimal(nft.price))
  return {
    categories: categoryIds.map((id) => ({
      id,
      label: categoryLabels[id],
      count: scope.filter((nft) => nft.category === id).length,
    })),
    networks: networkIds.map((id) => ({
      id,
      label: networkLabels[id],
      count: scope.filter((nft) => nft.network === id).length,
    })),
    priceRange: {
      min: (prices.length ? Decimal.min(...prices) : new Decimal(0)).toFixed(2),
      max: (prices.length ? Decimal.max(...prices) : new Decimal(0)).toFixed(2),
    },
  }
}

function validationFailure(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.') || 'query'
    fieldErrors[field] ??= issue.message
  }
  return errorResponse('validation', 'Parâmetros de busca inválidos.', fieldErrors)
}

export const nftHandlers = [
  http.get(`${API_BASE}/nfts`, async ({ request }) => {
    await simulateLatency()
    settleDueOrders()
    const scenario = getMockScenario()
    if (scenario === 'error') return transientFailure()

    const params = new URL(request.url).searchParams
    // `out-of-order`: the trending tab answers late, after any request made right after it.
    if (scenario === 'out-of-order' && params.get('tab') === 'trending') await delay(1_500)
    const parsed = listQuerySchema.safeParse({
      q: params.get('q') ?? undefined,
      collection: params.get('collection') ?? undefined,
      category: params.getAll('category'),
      network: params.getAll('network'),
      minPrice: params.get('minPrice') ?? undefined,
      maxPrice: params.get('maxPrice') ?? undefined,
      tab: params.get('tab') ?? undefined,
      sort: params.get('sort') ?? undefined,
      page: params.get('page') ?? undefined,
      pageSize: params.get('pageSize') ?? undefined,
    })
    if (!parsed.success) return validationFailure(parsed.error)

    const query = parsed.data
    const catalog = scenario === 'empty' ? [] : getDb().nfts
    const newestListing = Math.max(...getDb().nfts.map((nft) => Date.parse(nft.listedAt)))
    const scope = catalog.filter(
      (nft) => matchesText(nft, query.q) && matchesTab(nft, query, newestListing),
    )
    const results = scope.filter((nft) => matchesFilters(nft, query)).sort(compare(query.sort))
    const start = (query.page - 1) * query.pageSize

    const body: NftListResponse = {
      items: results.slice(start, start + query.pageSize).map(toSummary),
      page: query.page,
      pageSize: query.pageSize,
      total: results.length,
      totalPages: Math.ceil(results.length / query.pageSize),
      facets: buildFacets(getDb().nfts, scope),
    }
    return HttpResponse.json(body)
  }),

  http.get(`${API_BASE}/nfts/featured`, async () => {
    await simulateLatency()
    settleDueOrders()
    if (getMockScenario() === 'error') return transientFailure()

    const { nfts } = getDb()
    const byId = (id: string) => nfts.find((nft) => nft.id === id)
    const spotlight = byId(featuredFixture.spotlightId)
    if (!spotlight) return errorResponse('not_found', 'Destaque não encontrado.')

    const body: FeaturedNftsResponse = {
      slides: featuredFixture.slideIds
        .map(byId)
        .filter((nft): nft is MockNft => nft !== undefined)
        .map(toSummary),
      spotlight: toSummary(spotlight),
    }
    return HttpResponse.json(body)
  }),

  http.get<{ id: string }>(`${API_BASE}/nfts/:id`, async ({ params }) => {
    await simulateLatency()
    settleDueOrders()
    if (getMockScenario() === 'error') return transientFailure()

    const nft = getDb().nfts.find((item) => item.id === params.id)
    if (!nft) return errorResponse('not_found', 'NFT não encontrado.')
    return HttpResponse.json(toDetail(nft))
  }),
]

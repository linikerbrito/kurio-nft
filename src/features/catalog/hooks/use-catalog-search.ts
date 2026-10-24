import { useCallback } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import type { CatalogSearch } from '@/features/catalog/types/catalog'

const homeRoute = getRouteApi('/')

/** Drops empty values and defaults so the URL only carries what the user chose. */
export function cleanCatalogSearch(search: CatalogSearch): CatalogSearch {
  return {
    q: search.q?.trim() || undefined,
    category: search.category?.length ? search.category : undefined,
    network: search.network?.length ? search.network : undefined,
    minPrice: search.minPrice,
    maxPrice: search.maxPrice,
    tab: search.tab === 'all' ? undefined : search.tab,
    sort: search.sort === 'recent' ? undefined : search.sort,
    page: search.page === 1 ? undefined : search.page,
  }
}

export function useCatalogSearch() {
  const search = homeRoute.useSearch()
  const navigate = homeRoute.useNavigate()

  /** Any filter change goes back to the first page. */
  const updateFilters = useCallback(
    (patch: Partial<CatalogSearch>) =>
      navigate({
        search: (prev) => cleanCatalogSearch({ ...prev, ...patch, page: undefined }),
        resetScroll: false,
      }),
    [navigate],
  )

  const clearFilters = useCallback(
    () =>
      navigate({
        search: (prev) => cleanCatalogSearch({ tab: prev.tab, sort: prev.sort }),
        resetScroll: false,
      }),
    [navigate],
  )

  return { search, updateFilters, clearFilters }
}

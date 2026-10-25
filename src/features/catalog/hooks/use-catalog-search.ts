import { useCallback, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { catalogSearchSchema, type CatalogSearch } from '@/features/catalog/types/catalog'

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

/**
 * Catalog state from the URL. Also works where the home page is a backdrop (the login and
 * sign-up dialogs): there the search is parsed to the defaults and changes go to `/`.
 */
export function useCatalogSearch() {
  const rawSearch = useSearch({ strict: false })
  const search = useMemo(() => catalogSearchSchema.parse(rawSearch), [rawSearch])
  const navigate = useNavigate()

  /** Any filter change goes back to the first page. */
  const updateFilters = useCallback(
    (patch: Partial<CatalogSearch>) =>
      navigate({
        to: '/',
        search: cleanCatalogSearch({ ...search, ...patch, page: undefined }),
        resetScroll: false,
      }),
    [navigate, search],
  )

  const clearFilters = useCallback(
    () =>
      navigate({
        to: '/',
        search: cleanCatalogSearch({ tab: search.tab, sort: search.sort }),
        resetScroll: false,
      }),
    [navigate, search],
  )

  return { search, updateFilters, clearFilters }
}

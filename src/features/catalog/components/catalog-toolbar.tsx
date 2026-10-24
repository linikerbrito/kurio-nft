import { ChevronDown, X } from 'lucide-react'
import { useCatalogSearch } from '@/features/catalog/hooks/use-catalog-search'
import {
  catalogSortSchema,
  type CatalogSort,
  type CatalogTab,
} from '@/features/catalog/types/catalog'

const tabLabels: Record<CatalogTab, string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
}

const sortLabels: Record<CatalogSort, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  popular: 'Mais populares',
}

export function CatalogToolbar() {
  const { search, updateFilters } = useCatalogSearch()
  const activeTab = search.tab ?? 'all'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div role="group" aria-label="Listas de NFTs" className="flex gap-5">
          {(Object.keys(tabLabels) as CatalogTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={tab === activeTab}
              onClick={() => updateFilters({ tab })}
              className="relative pb-1 text-[0.9375rem] text-fg transition-colors hover:text-primary aria-pressed:font-semibold aria-pressed:text-primary aria-pressed:after:absolute aria-pressed:after:inset-x-0 aria-pressed:after:bottom-0 aria-pressed:after:h-0.5 aria-pressed:after:bg-primary"
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-[0.9375rem] text-fg">
          <label htmlFor="catalog-sort">Ordenar por:</label>
          <div className="relative">
            <select
              id="catalog-sort"
              value={search.sort ?? 'recent'}
              onChange={(event) => {
                const sort = catalogSortSchema.safeParse(event.target.value)
                if (sort.success) updateFilters({ sort: sort.data })
              }}
              className="cursor-pointer appearance-none rounded-sm bg-transparent py-0.5 pr-5 text-fg transition-colors hover:text-primary"
            >
              {(Object.keys(sortLabels) as CatalogSort[]).map((sort) => (
                <option key={sort} value={sort} className="bg-surface text-fg">
                  {sortLabels[sort]}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-0 size-4 -translate-y-1/2"
            />
          </div>
        </div>
      </div>

      {search.q && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-fg-muted">
          Resultados para <span className="font-semibold text-fg">“{search.q}”</span>
          <button
            type="button"
            onClick={() => updateFilters({ q: undefined })}
            className="inline-flex items-center gap-1 rounded-sm border border-border-default px-2 py-0.5 text-xs text-fg transition-colors hover:border-primary hover:text-primary"
          >
            <X aria-hidden="true" className="size-3" />
            Limpar busca
          </button>
        </p>
      )}
    </div>
  )
}

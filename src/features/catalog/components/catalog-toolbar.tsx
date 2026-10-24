import { SlidersHorizontal, X } from 'lucide-react'
import { FiltersSheet } from '@/features/catalog/components/filters-sheet'
import { SortSelect } from '@/features/catalog/components/sort-select'
import { useCatalogSearch } from '@/features/catalog/hooks/use-catalog-search'
import type { CatalogFacets, CatalogTab } from '@/features/catalog/types/catalog'

const tabLabels: Record<CatalogTab, string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
}

interface CatalogToolbarProps {
  facets: CatalogFacets | undefined
  facetsUnavailable: boolean
}

export function CatalogToolbar({ facets, facetsUnavailable }: CatalogToolbarProps) {
  const { search, updateFilters } = useCatalogSearch()
  const activeTab = search.tab ?? 'all'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div role="group" aria-label="Listas de NFTs" className="flex gap-4 md:gap-5">
          {(Object.keys(tabLabels) as CatalogTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              aria-pressed={tab === activeTab}
              onClick={() => updateFilters({ tab })}
              className="relative pb-1 text-sm leading-4 whitespace-nowrap text-fg transition-colors hover:text-fg-accent aria-pressed:font-bold aria-pressed:text-fg-accent aria-pressed:after:absolute aria-pressed:after:inset-x-0 aria-pressed:after:bottom-0 aria-pressed:after:h-0.5 aria-pressed:after:bg-primary md:pb-[0.4375rem] md:text-[0.9375rem] md:font-medium md:aria-pressed:font-medium"
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-6 md:flex">
          <FiltersSheet facets={facets} unavailable={facetsUnavailable}>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-[6px] border border-line px-3 py-1.5 text-[0.9375rem] text-fg transition-colors hover:border-primary hover:text-fg-accent lg:hidden"
            >
              <SlidersHorizontal aria-hidden="true" className="size-4" />
              Filtros
            </button>
          </FiltersSheet>
          <SortSelect id="catalog-sort" />
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

import { useState, type FormEvent } from 'react'
import filterIcon from '@/assets/figma/mobile/m-filter.svg'
import searchIcon from '@/assets/figma/mobile/m-search.svg'
import { FiltersSheet } from '@/features/catalog/components/filters-sheet'
import { useCatalogSearch } from '@/features/catalog/hooks/use-catalog-search'
import type { CatalogFacets } from '@/features/catalog/types/catalog'

interface MobileCatalogBarProps {
  facets: CatalogFacets | undefined
  facetsUnavailable: boolean
}

/** Search field and filter button that replace the header and sidebar on phones. */
export function MobileCatalogBar({ facets, facetsUnavailable }: MobileCatalogBarProps) {
  const { search, updateFilters } = useCatalogSearch()
  const [term, setTerm] = useState(search.q ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateFilters({ q: term.trim() || undefined })
  }

  return (
    <div className="mt-10 flex gap-2 md:hidden">
      <form
        role="search"
        onSubmit={handleSubmit}
        className="flex h-[2.8125rem] min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-surface px-3 focus-within:ring-2 focus-within:ring-primary/40"
      >
        <img src={searchIcon} alt="" width={22} height={22} className="size-[1.375rem] shrink-0" />
        <label htmlFor="mobile-nft-search" className="sr-only">
          Buscar NFTs
        </label>
        <input
          id="mobile-nft-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Explorar coleções"
          maxLength={80}
          autoComplete="off"
          enterKeyHint="search"
          className="min-w-0 flex-1 bg-transparent text-sm leading-4 font-bold text-fg outline-none placeholder:text-fg-subtle"
        />
      </form>
      <FiltersSheet facets={facets} unavailable={facetsUnavailable}>
        <button
          type="button"
          aria-label="Filtros e ordenação"
          className="flex size-[2.8125rem] shrink-0 items-center justify-center rounded-[14px] bg-linear-137 from-primary/45 from-25% to-primary"
        >
          <img src={filterIcon} alt="" width={16} height={16} className="h-4 w-4" />
        </button>
      </FiltersSheet>
    </div>
  )
}

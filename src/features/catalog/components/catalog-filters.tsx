import { useId, useState } from 'react'
import { useCatalogSearch } from '@/features/catalog/hooks/use-catalog-search'
import type { CatalogFacets } from '@/features/catalog/types/catalog'
import { centsToEth, ethToCents, formatEthLocale } from '@/lib/eth'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'
import { Slider } from '@/shared/ui/slider'

const sectionTitleClass = 'text-lg leading-4 font-bold text-fg'

interface FilterOptionProps {
  label: string
  count: number
  selected: boolean
  onToggle: () => void
  boldCount?: boolean
}

function FilterOption({ label, count, selected, onToggle, boldCount = false }: FilterOptionProps) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onToggle}
        className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between rounded-sm px-2 text-[0.9375rem] leading-10 text-fg-muted transition-colors hover:bg-surface-warm hover:text-fg-accent aria-pressed:font-semibold aria-pressed:text-fg-accent"
      >
        <span>{label}</span>
        <span aria-hidden="true" className={boldCount ? 'font-bold' : undefined}>
          ({count})
        </span>
        <span className="sr-only">, {count} NFTs</span>
      </button>
    </li>
  )
}

function toggle<T>(list: readonly T[] | undefined, value: T): T[] {
  const current = list ?? []
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
}

interface PriceFilterProps {
  range: CatalogFacets['priceRange']
  minPrice: string | undefined
  maxPrice: string | undefined
  onApply: (minPrice: string | undefined, maxPrice: string | undefined) => void
}

function PriceFilter({ range, minPrice, maxPrice, onApply }: PriceFilterProps) {
  const idPrefix = useId()
  const bounds: [number, number] = [ethToCents(range.min), ethToCents(range.max)]
  const [value, setValue] = useState<[number, number]>([
    ethToCents(minPrice ?? range.min),
    ethToCents(maxPrice ?? range.max),
  ])
  const [low, high] = value

  function handleApply() {
    onApply(
      low <= bounds[0] ? undefined : centsToEth(low),
      high >= bounds[1] ? undefined : centsToEth(high),
    )
  }

  return (
    <section aria-labelledby={`${idPrefix}-price-filter-title`} className="space-y-3">
      <h3 id={`${idPrefix}-price-filter-title`} className={sectionTitleClass}>
        Faixa de preço
      </h3>
      <Slider
        min={bounds[0]}
        max={bounds[1]}
        step={1}
        minStepsBetweenThumbs={1}
        value={value}
        onValueChange={(next) => {
          const [nextLow = low, nextHigh = high] = next
          setValue([nextLow, nextHigh])
        }}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        thumbValueText={(cents) => `${formatEthLocale(centsToEth(cents))} ETH`}
        className="ml-3 h-[0.9375rem] w-[calc(100%-0.75rem)]"
      />
      <p className="pl-3 text-[0.9375rem] leading-[1.125rem] text-fg" aria-live="polite">
        Preço: {formatEthLocale(centsToEth(low))} - {formatEthLocale(centsToEth(high))} ETH
      </p>
      <Button
        type="button"
        onClick={handleApply}
        className="ml-3 h-9 px-3 text-base leading-5 font-bold"
      >
        Aplicar
      </Button>
    </section>
  )
}

interface CatalogFiltersProps {
  facets: CatalogFacets | undefined
  unavailable: boolean
}

export function CatalogFilters({ facets, unavailable }: CatalogFiltersProps) {
  const { search, updateFilters } = useCatalogSearch()
  const idPrefix = useId()

  if (!facets) {
    return unavailable ? (
      <p className="bg-surface px-5 py-6 text-sm text-fg-muted">
        Filtros indisponíveis no momento.
      </p>
    ) : (
      <CatalogFiltersSkeleton />
    )
  }

  return (
    <div className="space-y-10 bg-surface px-5 pt-5 pb-7">
      <section aria-labelledby={`${idPrefix}-category-filter-title`} className="space-y-3">
        <h3 id={`${idPrefix}-category-filter-title`} className={sectionTitleClass}>
          Coleções
        </h3>
        <ul className="px-3">
          {facets.categories.map((facet) => (
            <FilterOption
              key={facet.id}
              label={facet.label}
              count={facet.count}
              boldCount
              selected={search.category?.includes(facet.id) ?? false}
              onToggle={() => updateFilters({ category: toggle(search.category, facet.id) })}
            />
          ))}
        </ul>
      </section>

      <PriceFilter
        key={`${search.minPrice}-${search.maxPrice}-${facets.priceRange.min}-${facets.priceRange.max}`}
        range={facets.priceRange}
        minPrice={search.minPrice}
        maxPrice={search.maxPrice}
        onApply={(minPrice, maxPrice) => updateFilters({ minPrice, maxPrice })}
      />

      <section aria-labelledby={`${idPrefix}-network-filter-title`} className="space-y-3">
        <h3 id={`${idPrefix}-network-filter-title`} className={sectionTitleClass}>
          Rede
        </h3>
        <ul className="pl-3">
          {facets.networks.map((facet) => (
            <FilterOption
              key={facet.id}
              label={facet.label}
              count={facet.count}
              selected={search.network?.includes(facet.id) ?? false}
              onToggle={() => updateFilters({ network: toggle(search.network, facet.id) })}
            />
          ))}
        </ul>
      </section>
    </div>
  )
}

function CatalogFiltersSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-10 bg-surface p-5">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        {Array.from({ length: 9 }, (_, index) => (
          <Skeleton key={index} className="mx-3 my-[0.8125rem] h-[0.875rem]" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mx-3 h-4" />
        <Skeleton className="mx-3 h-5 w-44" />
        <Skeleton className="mx-3 h-9 w-24" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-16" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="mx-3 my-[0.8125rem] h-[0.875rem]" />
        ))}
      </div>
    </div>
  )
}

import arrowDownIcon from '@/assets/figma/arrow-down.svg'
import { useCatalogSearch } from '@/features/catalog/hooks/use-catalog-search'
import { catalogSortSchema, type CatalogSort } from '@/features/catalog/types/catalog'
import { MaskIcon } from '@/shared/components/mask-icon'

const sortLabels: Record<CatalogSort, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  popular: 'Mais populares',
}

interface SortSelectProps {
  id: string
  /** `stacked` puts the label above the select, for narrow containers such as the drawer. */
  layout?: 'inline' | 'stacked'
  className?: string
}

/** Native select: the Radix Select let the closing click reach the card underneath. */
export function SortSelect({ id, layout = 'inline', className = '' }: SortSelectProps) {
  const { search, updateFilters } = useCatalogSearch()

  return (
    <div
      className={`flex text-[0.9375rem] text-fg ${
        layout === 'stacked' ? 'flex-col items-start gap-1' : 'items-center gap-0.5'
      } ${className}`}
    >
      <label htmlFor={id}>Ordenar por:</label>
      <div className="relative">
        <select
          id={id}
          value={search.sort ?? 'recent'}
          onChange={(event) => {
            const sort = catalogSortSchema.safeParse(event.target.value)
            if (sort.success) updateFilters({ sort: sort.data })
          }}
          className="cursor-pointer appearance-none rounded-sm bg-transparent py-0.5 pr-6 text-fg transition-colors hover:text-fg-accent"
        >
          {(Object.keys(sortLabels) as CatalogSort[]).map((sort) => (
            <option key={sort} value={sort} className="bg-surface text-fg">
              {sortLabels[sort]}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute top-1/2 right-0 flex size-4 -translate-y-1/2 items-center justify-center">
          <MaskIcon src={arrowDownIcon} className="h-[0.3854rem] w-[0.6771rem]" />
        </span>
      </div>
    </div>
  )
}

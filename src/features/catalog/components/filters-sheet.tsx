import type { ReactNode } from 'react'
import { CatalogFilters } from '@/features/catalog/components/catalog-filters'
import { SortSelect } from '@/features/catalog/components/sort-select'
import type { CatalogFacets } from '@/features/catalog/types/catalog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet'

interface FiltersSheetProps {
  facets: CatalogFacets | undefined
  unavailable: boolean
  /** The trigger element; it receives the dialog semantics from Radix. */
  children: ReactNode
}

/** Filters and sorting in a drawer, for widths where the sidebar does not fit. */
export function FiltersSheet({ facets, unavailable, children }: FiltersSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-[22rem] max-w-[90vw] gap-0 overflow-y-auto">
        <SheetHeader className="px-5 pt-6 pb-2">
          <SheetTitle className="text-lg font-bold">Filtros</SheetTitle>
          <SheetDescription>As mudanças são aplicadas ao catálogo na hora.</SheetDescription>
        </SheetHeader>
        <SortSelect id="catalog-sort-drawer" layout="stacked" className="px-5 pb-4" />
        <CatalogFilters facets={facets} unavailable={unavailable} />
      </SheetContent>
    </Sheet>
  )
}

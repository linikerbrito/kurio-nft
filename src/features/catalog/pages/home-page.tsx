import { CatalogFilters } from '@/features/catalog/components/catalog-filters'
import { CatalogResults } from '@/features/catalog/components/catalog-results'
import { CatalogToolbar } from '@/features/catalog/components/catalog-toolbar'
import { FeaturedSpotlight } from '@/features/catalog/components/featured-spotlight'
import { HomeHero } from '@/features/catalog/components/home-hero'
import { HomePromos } from '@/features/catalog/components/home-promos'
import { MintJournal } from '@/features/catalog/components/mint-journal'
import { MobileCatalogBar } from '@/features/catalog/components/mobile-catalog-bar'
import { MobileHero } from '@/features/catalog/components/mobile-hero'
import { CATALOG_SECTION_ID } from '@/features/catalog/focus-catalog-results'
import { useNftList } from '@/features/catalog/hooks/use-catalog'
import { useCatalogSearch } from '@/features/catalog/hooks/use-catalog-search'

export function HomePage() {
  const { search } = useCatalogSearch()
  const listQuery = useNftList(search)
  const facets = listQuery.data?.facets

  return (
    <>
      <MobileCatalogBar
        key={search.q ?? ''}
        facets={facets}
        facetsUnavailable={listQuery.isError}
      />
      <MobileHero />
      <HomeHero />

      <section
        id={CATALOG_SECTION_ID}
        aria-labelledby="catalog-title"
        tabIndex={-1}
        className="mt-4 grid scroll-mt-6 gap-12 outline-none md:mt-24 lg:grid-cols-[310px_minmax(0,1fr)]"
      >
        <h2 id="catalog-title" className="sr-only">
          Catálogo de NFTs
        </h2>
        <aside aria-label="Filtros do catálogo" className="hidden lg:block">
          <CatalogFilters facets={facets} unavailable={listQuery.isError} />
          <FeaturedSpotlight />
        </aside>
        <div>
          <CatalogToolbar facets={facets} facetsUnavailable={listQuery.isError} />
          <CatalogResults query={listQuery} />
        </div>
      </section>

      <HomePromos />
      <MintJournal />
    </>
  )
}

import { CatalogFilters } from '@/features/catalog/components/catalog-filters'
import { CatalogResults } from '@/features/catalog/components/catalog-results'
import { CatalogToolbar } from '@/features/catalog/components/catalog-toolbar'
import { FeaturedSpotlight } from '@/features/catalog/components/featured-spotlight'
import { HomeHero } from '@/features/catalog/components/home-hero'
import { HomePromos } from '@/features/catalog/components/home-promos'
import { MintJournal } from '@/features/catalog/components/mint-journal'
import { useNftList } from '@/features/catalog/hooks/use-catalog'
import { useCatalogSearch } from '@/features/catalog/hooks/use-catalog-search'

export function HomePage() {
  const { search } = useCatalogSearch()
  const listQuery = useNftList(search)

  return (
    <>
      <HomeHero />

      <section
        id="catalogo"
        aria-labelledby="catalog-title"
        tabIndex={-1}
        className="mt-24 grid scroll-mt-6 gap-12 outline-none lg:grid-cols-[310px_minmax(0,1fr)]"
      >
        <h2 id="catalog-title" className="sr-only">
          Catálogo de NFTs
        </h2>
        <aside aria-label="Filtros do catálogo">
          <CatalogFilters facets={listQuery.data?.facets} unavailable={listQuery.isError} />
          <FeaturedSpotlight />
        </aside>
        <div>
          <CatalogToolbar />
          <CatalogResults query={listQuery} />
        </div>
      </section>

      <HomePromos />
      <MintJournal />
    </>
  )
}

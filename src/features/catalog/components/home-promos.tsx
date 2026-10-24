import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import type { CatalogSearch } from '@/features/catalog/types/catalog'

const PROMO_IMAGE = '/nfts/default.jpg'

interface Promo {
  id: string
  title: string
  description: string
  search: CatalogSearch
  linkLabel: string
}

const promos: Promo[] = [
  {
    id: 'genesis',
    title: 'Lançamentos gênesis de edição limitada',
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    search: { tab: 'new' },
    linkLabel: 'Explorar novos lançamentos',
  },
  {
    id: 'curated',
    title: 'Arte digital selecionada e muito mais',
    description: 'Explore novos artistas, coleções verificadas e obras que definem a cultura.',
    search: { category: ['digital-art'] },
    linkLabel: 'Explorar arte digital',
  },
]

export function HomePromos() {
  return (
    <section aria-label="Coleções em destaque" className="mt-24 grid gap-7 lg:grid-cols-2">
      {promos.map((promo) => (
        <article
          key={promo.id}
          className="grid min-h-[15.625rem] grid-cols-[minmax(0,49%)_1fr] overflow-hidden rounded-lg bg-surface"
        >
          <div className="relative">
            <img
              src={PROMO_IMAGE}
              alt=""
              width={287}
              height={250}
              loading="lazy"
              className="absolute inset-0 size-full rounded-2xl object-cover"
            />
          </div>
          <div className="flex flex-col items-end pt-9 pr-6 pb-6 pl-3 text-right">
            <h2 className="text-lg leading-snug font-bold text-fg">{promo.title}</h2>
            <p className="mt-2 text-sm leading-6 text-fg-muted">{promo.description}</p>
            <Link
              to="/"
              search={promo.search}
              hash="catalogo"
              aria-label={promo.linkLabel}
              className="mt-auto inline-flex h-10 items-center gap-1 rounded-sm bg-primary px-7 text-sm font-semibold text-primary-fg transition-colors hover:bg-primary/90"
            >
              Explorar
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </article>
      ))}
    </section>
  )
}

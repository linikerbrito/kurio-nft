import { Link } from '@tanstack/react-router'
import promoArrowIcon from '@/assets/figma/promo-arrow.svg'
import promoMask from '@/assets/figma/promo-mask.svg'
import type { CatalogSearch } from '@/features/catalog/types/catalog'
import { MaskIcon } from '@/shared/components/mask-icon'

interface Promo {
  id: string
  image: string
  /** Two lines, broken where the design breaks them. */
  title: [string, string]
  description: string
  search: CatalogSearch
  linkLabel: string
}

const promos: Promo[] = [
  {
    id: 'genesis',
    image: '/nfts/ape-emerald.jpg',
    title: ['Lançamentos gênesis', 'de edição limitada'],
    description: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    search: { tab: 'new' },
    linkLabel: 'Explorar novos lançamentos',
  },
  {
    id: 'curated',
    image: '/nfts/ape-onyx.jpg',
    title: ['Arte digital selecionada', 'e muito mais'],
    description: 'Explore novos artistas, coleções verificadas e obras que definem a cultura.',
    search: { category: ['digital-art'] },
    linkLabel: 'Explorar arte digital',
  },
]

export function HomePromos() {
  return (
    <section aria-label="Coleções em destaque" className="mt-12 grid gap-7 md:mt-24 lg:grid-cols-2">
      {promos.map((promo) => (
        <article
          key={promo.id}
          className="relative grid overflow-hidden rounded-[8px] bg-surface md:h-[15.625rem] md:grid-cols-[minmax(0,18.25rem)_1fr]"
        >
          <div className="relative h-40 md:-ml-[5px] md:h-auto">
            <img
              src={promo.image}
              alt=""
              width={292}
              height={250}
              loading="lazy"
              className="absolute inset-0 size-full rounded-[1.125rem] object-cover"
            />
          </div>
          <div className="flex flex-col items-start p-5 md:items-end md:pt-[2.3125rem] md:pr-[1.875rem] md:pb-[2.875rem] md:pl-0 md:text-right">
            <h2 className="text-lg leading-6 font-bold text-fg md:whitespace-nowrap">
              {promo.title[0]}
              <br className="hidden md:block" /> {promo.title[1]}
            </h2>
            <p className="mt-[0.5625rem] max-w-[16.4375rem] text-sm leading-6 text-fg-muted">
              {promo.description}
            </p>
            <Link
              to="/"
              search={promo.search}
              hash="catalogo"
              aria-label={promo.linkLabel}
              className="mt-4 inline-flex h-10 md:mt-auto w-[8.75rem] items-center justify-center gap-0.5 rounded-[6px] bg-primary text-sm leading-5 font-medium text-primary-fg transition-colors hover:bg-primary/90"
            >
              Explorar
              <span className="flex size-[1.125rem] items-center justify-center">
                <MaskIcon src={promoArrowIcon} className="h-[0.6585rem] w-[0.7969rem] -rotate-90" />
              </span>
            </Link>
          </div>
          <img
            src={promoMask}
            alt=""
            width={586}
            height={250}
            className="pointer-events-none absolute inset-0 size-full"
          />
        </article>
      ))}
    </section>
  )
}

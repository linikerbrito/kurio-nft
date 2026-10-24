import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useFeaturedNfts } from '@/features/catalog/hooks/use-catalog'
import { formatEth } from '@/lib/eth'
import { Skeleton } from '@/shared/ui/skeleton'

export function HomeHero() {
  const { data, isPending, isError } = useFeaturedNfts()
  const [activeIndex, setActiveIndex] = useState(0)
  const slides = data?.slides ?? []
  const activeSlide = slides[activeIndex] ?? slides[0]

  return (
    <section
      aria-labelledby="hero-title"
      className="mt-8 hidden gap-6 md:flex md:flex-row md:items-center md:justify-between lg:h-[450px] lg:pl-10"
    >
      <div className="flex min-w-0 flex-col md:flex-1 lg:w-[600px] lg:flex-none">
        <div className="flex flex-col items-start gap-8">
          <div>
            <p className="text-sm leading-4 font-medium tracking-[0.1em] text-fg">
              Bem-vindo à Kurio
            </p>
            <h1
              id="hero-title"
              className="mt-2 text-[2rem] leading-[1.6] font-bold uppercase xl:text-[2.6875rem] xl:leading-[4.375rem]"
            >
              <span className="block">Seja dono do futuro</span>
              <span className="block">da arte digital</span>
            </h1>
            <p className="mt-1 max-w-[34.8125rem] text-sm leading-6 text-fg-muted">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
              digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </p>
          </div>
          <Link
            to="/"
            hash="catalogo"
            search={(prev) => prev}
            className="inline-flex h-10 w-[8.75rem] items-center justify-center rounded-[6px] bg-primary pr-2 text-base leading-5 font-bold text-primary-fg uppercase transition-colors hover:bg-primary/90"
          >
            Explorar
          </Link>
        </div>

        {slides.length > 1 && (
          <div role="group" aria-label="Destaques" className="-my-2 mt-9 flex self-end">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Destaque ${index + 1} de ${slides.length}: ${slide.name}`}
                aria-pressed={index === activeIndex}
                className="group flex size-6 items-center justify-center rounded-full"
              >
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-primary/45 transition-colors group-hover:bg-primary group-aria-pressed:bg-primary"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="aspect-square w-[18.75rem] shrink-0 lg:w-[28.125rem]">
        {isPending && <Skeleton className="size-full rounded-3xl" />}
        {isError && (
          <div className="flex size-full items-center justify-center rounded-3xl bg-surface p-6 text-center text-sm text-fg-muted">
            Destaques indisponíveis no momento.
          </div>
        )}
        {activeSlide && (
          <Link
            to="/nft/$nftId"
            params={{ nftId: activeSlide.id }}
            className="block size-full overflow-hidden rounded-3xl"
            aria-label={`Ver ${activeSlide.name}, ${formatEth(activeSlide.price)}`}
          >
            <img
              src={activeSlide.image.src}
              alt=""
              width={450}
              height={450}
              fetchPriority="high"
              className="size-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
          </Link>
        )}
      </div>
    </section>
  )
}

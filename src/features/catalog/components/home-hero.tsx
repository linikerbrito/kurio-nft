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
      className="grid gap-10 pt-8 lg:grid-cols-[minmax(0,1fr)_450px] lg:gap-6"
    >
      <div className="flex flex-col lg:pt-10 lg:pl-10">
        <p className="text-sm font-medium text-fg">Bem-vindo à Kurio</p>
        <h1
          id="hero-title"
          className="mt-3 text-[2rem] leading-[1.6] font-bold uppercase xl:text-[2.75rem]"
        >
          <span className="block">Seja dono do futuro</span>
          <span className="block">da arte digital</span>
        </h1>
        <p className="mt-1 max-w-[34.5rem] text-sm leading-6 text-fg-muted">
          Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
          rara, apoie artistas e tenha uma parte da cultura da internet.
        </p>
        <Link
          to="/"
          hash="catalogo"
          search={(prev) => prev}
          className="mt-9 inline-flex h-10 w-fit items-center rounded-sm bg-primary px-7 text-base font-bold text-primary-fg uppercase transition-colors hover:bg-primary/90"
        >
          Explorar
        </Link>

        {slides.length > 1 && (
          <div
            role="group"
            aria-label="Destaques"
            className="mt-6 flex justify-end gap-0.5 lg:mt-auto lg:pr-[4.5rem] lg:pb-11"
          >
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

      <div className="aspect-square w-full max-w-[450px] justify-self-center lg:justify-self-end">
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

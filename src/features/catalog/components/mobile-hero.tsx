import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import arrowIcon from '@/assets/figma/mobile/m-arrow-right.svg'
import heroBackground from '@/assets/figma/mobile/m-hero-bg.svg'
import { useFeaturedNfts } from '@/features/catalog/hooks/use-catalog'
import { formatEth } from '@/lib/eth'
import { Skeleton } from '@/shared/ui/skeleton'

/**
 * Compact hero of the phone layout: copy on the left, two overlapping artworks on the right.
 * Below 390 px the artworks shrink (and below 375 px the title) so the title keeps its two
 * lines; the card grows with the copy instead of cutting it (190 px only fits the 414 px frame).
 */
export function MobileHero() {
  const { data, isPending } = useFeaturedNfts()
  const [activeIndex, setActiveIndex] = useState(0)
  const slides = data?.slides ?? []
  const activeSlide = slides[activeIndex] ?? slides[0]
  const nextSlide = slides.length > 1 ? slides[(activeIndex + 1) % slides.length] : undefined

  return (
    <section
      aria-labelledby="mobile-hero-title"
      className="relative mt-4 flex min-h-[11.875rem] flex-col items-center justify-center overflow-hidden rounded-[12px] p-4 md:hidden"
    >
      <img
        src={heroBackground}
        alt=""
        width={366}
        height={190}
        className="pointer-events-none absolute inset-0 size-full"
      />
      <div className="relative flex w-full flex-col items-center gap-4">
        <div className="flex w-full items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-xs leading-4 font-medium text-fg">Bem-vindo à Kurio</p>
            <h1
              id="mobile-hero-title"
              className="mt-1.5 text-base leading-[1.8125rem] font-bold text-fg min-[375px]:text-lg"
            >
              SEJA DONO DA
              <br />
              CULTURA DIGITAL
            </h1>
            <p className="mt-1.5 text-xs leading-[1.125rem] text-fg-muted">
              Descubra NFTs selecionados de criadores do mundo todo.
            </p>
            <Link
              to="/"
              hash="catalogo"
              search={(prev) => prev}
              className="mt-0 flex w-fit items-center gap-2 text-xs leading-[0.875rem] font-bold text-fg-accent"
            >
              EXPLORAR
              <span className="flex size-4 items-center justify-center">
                <img
                  src={arrowIcon}
                  alt=""
                  width={10}
                  height={12}
                  className="h-[0.7188rem] w-[0.5958rem] -rotate-90"
                />
              </span>
            </Link>
          </div>

          <div className="relative size-[7.5rem] shrink-0 min-[390px]:size-[8.625rem]">
            {isPending && <Skeleton className="size-full rounded-2xl" />}
            {activeSlide && (
              <Link
                to="/nft/$nftId"
                params={{ nftId: activeSlide.id }}
                aria-label={`Ver ${activeSlide.name}, ${formatEth(activeSlide.price)}`}
                className="block size-full overflow-hidden rounded-2xl"
              >
                <img
                  src={activeSlide.image.src}
                  alt=""
                  width={138}
                  height={138}
                  fetchPriority="high"
                  className="size-full object-cover"
                />
              </Link>
            )}
            {nextSlide && (
              <img
                src={nextSlide.image.src}
                alt=""
                width={58}
                height={58}
                className="pointer-events-none absolute top-[4.75rem] left-3 size-[3.125rem] rounded-2xl object-cover min-[390px]:top-[5.5rem] min-[390px]:left-[0.875rem] min-[390px]:size-[3.625rem]"
              />
            )}
          </div>
        </div>

        {slides.length > 1 && (
          <div role="group" aria-label="Destaques" className="-my-2 flex">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Destaque ${index + 1} de ${slides.length}: ${slide.name}`}
                aria-pressed={index === activeIndex}
                className="group flex size-6 items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className="size-[0.4375rem] rounded-full bg-primary/45 transition-colors group-aria-pressed:bg-primary"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

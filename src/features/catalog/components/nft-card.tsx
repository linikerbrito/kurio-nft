import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/features/catalog/types/catalog'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { formatEth } from '@/lib/eth'
import { Skeleton } from '@/shared/ui/skeleton'

interface NftCardProps {
  nft: NftSummary
  /** Above-the-fold cards load eagerly to keep LCP low. */
  eager?: boolean
  /** `compact` uses the smaller type of the "Mais desta coleção" row. */
  size?: 'default' | 'compact'
}

/**
 * Phones get the framed card of the mobile design (gradient frame, favorite button, RARO tag);
 * from `md` up it becomes the flat card of the desktop grid.
 */
export function NftCard({ nft, eager = false, size = 'default' }: NftCardProps) {
  const compact = size === 'compact'

  return (
    <article className="group relative rounded-[20px] outline-offset-4 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-primary md:rounded-sm">
      <div className="relative flex h-[12.5rem] items-center justify-center rounded-[20px] bg-linear-140 from-surface from-12% to-surface-raised md:aspect-[258/300] md:h-auto md:rounded-none md:bg-surface md:bg-none md:px-1">
        <div className="relative aspect-square w-[96%] md:aspect-auto md:w-full">
          <img
            src={nft.image.src}
            alt={nft.image.alt}
            width={250}
            height={250}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className="size-full rounded-2xl object-cover transition-transform duration-300 group-hover:scale-[1.02] md:aspect-square md:rounded-[0.9375rem]"
          />
          <FavoriteButton nftId={nft.id} nftName={nft.name} variant="card" />
        </div>
        {nft.rarity === 'rare' && (
          <span className="absolute top-4 left-0 flex h-8 w-[4.25rem] items-center pl-2 text-[0.8125rem] leading-4 font-medium text-primary-fg md:hidden">
            <span aria-hidden="true" className="absolute inset-0 bg-primary" />
            <span className="relative">RARO</span>
          </span>
        )}
      </div>
      <h3
        className={`mt-2 truncate pl-2 text-[0.9375rem] text-fg md:mt-3 md:pl-0 ${
          compact ? 'md:leading-[1.3]' : 'md:text-base md:leading-4'
        }`}
      >
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="outline-none after:absolute after:inset-0 group-hover:text-fg-accent"
        >
          {nft.name}
        </Link>
      </h3>
      <p
        className={`pl-2 text-base leading-4 font-bold text-fg-accent md:pl-0 ${
          compact ? '' : 'md:mt-1.5 md:text-lg'
        }`}
      >
        {formatEth(nft.price)}
        {nft.previousPrice && (
          <span className="ml-3 font-normal text-fg-subtle">
            <span className="sr-only">, preço anterior </span>
            {formatEth(nft.previousPrice)}
          </span>
        )}
      </p>
    </article>
  )
}

export function NftCardSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="h-[12.5rem] w-full rounded-[20px] md:aspect-[258/300] md:h-auto md:rounded-none" />
      <Skeleton className="mt-2 h-[1.125rem] w-3/4 md:mt-3 md:h-4" />
      <Skeleton className="mt-0.5 h-4 w-1/3 md:mt-1.5" />
    </div>
  )
}

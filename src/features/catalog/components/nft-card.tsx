import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/features/catalog/types/catalog'
import { formatEth } from '@/lib/eth'
import { Skeleton } from '@/shared/ui/skeleton'

interface NftCardProps {
  nft: NftSummary
  /** Above-the-fold cards load eagerly to keep LCP low. */
  eager?: boolean
}

export function NftCard({ nft, eager = false }: NftCardProps) {
  return (
    <article className="group relative rounded-sm outline-offset-4 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-primary">
      <div className="flex aspect-[258/300] items-center bg-surface px-1">
        <img
          src={nft.image.src}
          alt={nft.image.alt}
          width={250}
          height={250}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="aspect-square w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>
      <h3 className="mt-5 truncate text-base text-fg">
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="outline-none after:absolute after:inset-0 group-hover:text-primary"
        >
          {nft.name}
        </Link>
      </h3>
      <p className="mt-1 text-base font-bold text-primary">
        {formatEth(nft.price)}
        {nft.previousPrice && (
          <span className="ml-2 font-normal text-fg-muted">
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
      <Skeleton className="aspect-[258/300] w-full rounded-none" />
      <Skeleton className="mt-5 h-5 w-3/4" />
      <Skeleton className="mt-1 h-5 w-1/3" />
    </div>
  )
}

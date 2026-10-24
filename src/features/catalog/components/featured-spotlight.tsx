import { Link } from '@tanstack/react-router'
import { useFeaturedNfts } from '@/features/catalog/hooks/use-catalog'
import { formatEth } from '@/lib/eth'
import { Skeleton } from '@/shared/ui/skeleton'

export function FeaturedSpotlight() {
  const { data, isPending, isError } = useFeaturedNfts()

  if (isError) return null

  return (
    <section aria-labelledby="spotlight-title" className="mt-6 bg-surface">
      <div className="px-5 pt-6 pb-3">
        <h2 id="spotlight-title" className="text-[1.375rem] font-bold text-primary uppercase">
          NFT em destaque
        </h2>
        <p className="mt-1.5 text-center text-xl font-bold text-fg uppercase">Oferta limitada</p>
      </div>
      {isPending ? (
        <Skeleton className="aspect-[310/365] w-full rounded-[1.25rem]" />
      ) : (
        <Link
          to="/nft/$nftId"
          params={{ nftId: data.spotlight.id }}
          aria-label={`Ver ${data.spotlight.name}, ${formatEth(data.spotlight.price)}`}
          className="block overflow-hidden rounded-[1.25rem]"
        >
          <img
            src={data.spotlight.image.src}
            alt=""
            width={310}
            height={365}
            loading="lazy"
            className="aspect-[310/365] w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
        </Link>
      )}
    </section>
  )
}

import { Link } from '@tanstack/react-router'
import { useFeaturedNfts } from '@/features/catalog/hooks/use-catalog'
import { formatEth } from '@/lib/eth'
import { Skeleton } from '@/shared/ui/skeleton'

export function FeaturedSpotlight() {
  const { data, isPending, isError } = useFeaturedNfts()

  if (isError) return null

  return (
    <section
      aria-labelledby="spotlight-title"
      className="mt-6 flex h-[29.375rem] flex-col gap-4 bg-gradient-to-b from-primary/10 to-primary/[0.03] pt-6 pb-1"
    >
      <div className="flex flex-col items-center gap-4 px-5">
        <h2 id="spotlight-title" className="w-full text-2xl leading-8 font-bold text-fg-accent">
          NFT EM DESTAQUE
        </h2>
        <p className="w-full text-center text-[1.375rem] leading-4 font-bold text-fg">
          OFERTA LIMITADA
        </p>
      </div>
      {isPending ? (
        <Skeleton className="h-[23rem] w-full rounded-[1.375rem]" />
      ) : (
        <Link
          to="/nft/$nftId"
          params={{ nftId: data.spotlight.id }}
          aria-label={`Ver ${data.spotlight.name}, ${formatEth(data.spotlight.price)}`}
          className="block h-[23rem] overflow-hidden rounded-[1.375rem]"
        >
          <img
            src={data.spotlight.image.src}
            alt=""
            width={310}
            height={368}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 hover:scale-[1.02]"
          />
        </Link>
      )}
    </section>
  )
}

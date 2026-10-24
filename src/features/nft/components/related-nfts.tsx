import { useState } from 'react'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { useCollectionNfts } from '@/features/catalog/hooks/use-catalog'

const PAGE_SIZE = 5

interface RelatedNftsProps {
  collectionId: string
  currentId: string
}

/** "Mais desta coleção": the catalog cards in rows of five, paged by the carousel dots. */
export function RelatedNfts({ collectionId, currentId }: RelatedNftsProps) {
  const { data, isPending, isError } = useCollectionNfts(collectionId)
  const [page, setPage] = useState(0)

  const items = (data?.items ?? []).filter((nft) => nft.id !== currentId)
  const pageCount = Math.ceil(items.length / PAGE_SIZE)
  const visible = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  if (isError || (!isPending && items.length === 0)) return null

  return (
    <section aria-labelledby="related-title" className="mt-12 md:mt-24">
      <h2
        id="related-title"
        className="border-b border-line pb-3 text-[1.0625rem] leading-4 font-bold text-fg-accent"
      >
        Mais desta coleção
      </h2>

      <ul
        aria-label="NFTs da mesma coleção"
        className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-5 md:gap-x-[1.625rem]"
      >
        {isPending
          ? Array.from({ length: PAGE_SIZE }, (_, index) => (
              <li key={index}>
                <NftCardSkeleton />
              </li>
            ))
          : visible.map((nft) => (
              <li key={nft.id}>
                <NftCard nft={nft} size="compact" />
              </li>
            ))}
      </ul>

      {pageCount > 1 && (
        <div
          role="group"
          aria-label="Páginas da coleção"
          className="mt-8 flex justify-center *:-my-1.5"
        >
          {Array.from({ length: pageCount }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Página ${index + 1} de ${pageCount}`}
              aria-pressed={index === page}
              onClick={() => setPage(index)}
              className="group flex size-6 items-center justify-center rounded-full"
            >
              <span
                aria-hidden="true"
                className="size-3 rounded-full border border-primary transition-colors group-hover:bg-primary/40 group-aria-pressed:bg-primary"
              />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

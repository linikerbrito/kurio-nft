import { useId, useState } from 'react'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import type { NftSummary } from '@/features/catalog/types/catalog'

const PAGE_SIZE = 5

interface NftShowcaseProps {
  title: string
  /** Accessible name of the card list. */
  listLabel: string
  items: NftSummary[]
  isPending: boolean
}

/**
 * Row of catalog cards with carousel dots, as in "Mais desta coleção" (detail) and
 * "Colecionadores também viram" (cart). Renders nothing when there is nothing to show.
 */
export function NftShowcase({ title, listLabel, items, isPending }: NftShowcaseProps) {
  const titleId = useId()
  const [page, setPage] = useState(0)
  const pageCount = Math.ceil(items.length / PAGE_SIZE)
  const visible = items.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  if (!isPending && items.length === 0) return null

  return (
    <section aria-labelledby={titleId} className="mt-12 md:mt-24">
      <h2
        id={titleId}
        className="border-b border-line pb-3 text-[1.0625rem] leading-4 font-bold text-fg-accent"
      >
        {title}
      </h2>

      <ul
        aria-label={listLabel}
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
          aria-label={`Páginas de ${title}`}
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

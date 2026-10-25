import type { Nft, NftEdition } from '@/features/catalog/types/catalog'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { BuyButton, ShareLinks } from '@/features/nft/components/nft-actions'
import { EditionPicker } from '@/features/nft/components/edition-picker'
import { QuantityStepper } from '@/features/nft/components/quantity-stepper'
import { RatingStars } from '@/features/nft/components/rating-stars'
import { formatEth } from '@/lib/eth'

export interface PurchaseState {
  edition: NftEdition | undefined
  onEditionChange: (editionId: string) => void
  quantity: number
  onQuantityChange: (quantity: number) => void
}

export function TokenInfo({ nft }: { nft: Nft }) {
  return (
    <div className="space-y-3 text-[0.9375rem] leading-[1.3] text-fg-subtle">
      <p>ID do token: {nft.tokenId}</p>
      <p>Coleção: {nft.collection.name}</p>
      <p>Atributos: {nft.attributes.join(', ')}</p>
    </div>
  )
}

/** Right column of the desktop detail: title, price, editions, quantity and actions. */
export function NftPurchasePanel({ nft, purchase }: { nft: Nft; purchase: PurchaseState }) {
  const soldOut = purchase.edition === undefined

  return (
    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 self-stretch lg:h-[28rem]">
      <div className="space-y-3">
        <h1 className="text-[1.75rem] leading-[1.3] font-bold text-fg">{nft.name}</h1>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[1.375rem] leading-4 font-bold text-fg-accent">
            {formatEth(nft.price)}
          </p>
          <p className="flex items-center gap-1 text-[0.9375rem] leading-4 text-fg">
            <RatingStars average={nft.rating.average} />
            {nft.rating.count} avaliações de colecionadores
          </p>
        </div>
        <hr className="border-line" />
      </div>

      <div className="space-y-3">
        <h2 className="text-[0.9375rem] leading-4 font-bold text-fg">Sobre este NFT:</h2>
        <p className="text-sm leading-6 text-fg-muted">{nft.description}</p>
      </div>

      <EditionPicker
        name="edition-desktop"
        editions={nft.editions}
        selectedId={purchase.edition?.id}
        onSelect={purchase.onEditionChange}
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <QuantityStepper
          idPrefix="desktop"
          size="lg"
          value={purchase.quantity}
          max={purchase.edition?.available ?? 1}
          onChange={purchase.onQuantityChange}
          disabled={soldOut}
        />
        <div className="flex gap-2">
          <BuyButton
            nftId={nft.id}
            purchase={purchase}
            mode="buy"
            className="inline-flex h-10 w-[8.125rem] items-center justify-center rounded-[6px] bg-primary text-sm leading-5 font-bold text-primary-fg transition-colors hover:bg-primary/90"
          >
            COMPRAR
          </BuyButton>
          <FavoriteButton nftId={nft.id} nftName={nft.name} variant="detail" />
        </div>
      </div>

      <div className="space-y-3">
        <TokenInfo nft={nft} />
        <ShareLinks nftName={nft.name} />
      </div>
    </div>
  )
}

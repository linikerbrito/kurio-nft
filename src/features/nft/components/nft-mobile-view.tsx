import { Link, useCanGoBack, useRouter } from '@tanstack/react-router'
import backIcon from '@/assets/figma/detail/m-back.svg'
import heartIcon from '@/assets/figma/detail/m-heart.svg'
import shopIcon from '@/assets/figma/detail/m-shop.svg'
import starIcon from '@/assets/figma/detail/m-star.svg'
import type { Nft } from '@/features/catalog/types/catalog'
import { useLoginRedirectSearch } from '@/features/auth/hooks/use-login-redirect-search'
import { BuyButton } from '@/features/nft/components/nft-actions'
import { EditionPicker } from '@/features/nft/components/edition-picker'
import type { PurchaseState } from '@/features/nft/components/nft-purchase-panel'
import { TokenInfo } from '@/features/nft/components/nft-purchase-panel'
import { QuantityStepper } from '@/features/nft/components/quantity-stepper'
import { formatEth, multiplyEth } from '@/lib/eth'

/** Raised round button of the design; each use sets its own size. */
const roundButtonBase =
  'flex shrink-0 items-center justify-center rounded-full border border-line bg-surface-raised transition-colors hover:border-primary'
const roundButtonClass = `${roundButtonBase} size-[2.1875rem]`

interface NftMobileViewProps {
  nft: Nft
  purchase: PurchaseState
  activeImage: number
  onImageChange: (index: number) => void
}

/** Phone layout of the detail: artwork hero, details sheet and the fixed buy bar. */
export function NftMobileView({ nft, purchase, activeImage, onImageChange }: NftMobileViewProps) {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const loginSearch = useLoginRedirectSearch()
  const image = nft.gallery[activeImage] ?? nft.gallery[0]
  const soldOut = purchase.edition === undefined

  return (
    <div className="md:hidden">
      <section
        aria-label="Imagens do NFT"
        className="relative -mx-6 h-[31.625rem] bg-linear-137 from-surface from-12% to-surface-raised"
      >
        <div className="absolute inset-x-7 top-[1.4375rem] flex justify-between">
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => (canGoBack ? router.history.back() : router.navigate({ to: '/' }))}
            className={roundButtonClass}
          >
            <img src={backIcon} alt="" className="h-[0.4583rem] w-[0.8229rem] rotate-90" />
          </button>
          <Link
            to="/login"
            search={loginSearch}
            aria-label={`Favoritar ${nft.name} (entre na sua conta para salvar)`}
            className={roundButtonClass}
          >
            <img src={heartIcon} alt="" className="h-[0.8897rem] w-4" />
          </Link>
        </div>
        {image && (
          <img
            src={image.src}
            alt={image.alt}
            width={361}
            height={356}
            fetchPriority="high"
            className="absolute top-[4.125rem] left-7 h-[22.25rem] w-[calc(100%-3.3125rem)] rounded-3xl object-cover"
          />
        )}
        {nft.gallery.length > 1 && (
          <div
            role="group"
            aria-label="Escolher imagem"
            className="absolute top-[21.75rem] left-1/2 flex -translate-x-1/2"
          >
            {nft.gallery.map((galleryImage, index) => (
              <button
                key={`${galleryImage.src}-${index}`}
                type="button"
                aria-label={`Imagem ${index + 1} de ${nft.gallery.length}`}
                aria-pressed={index === activeImage}
                onClick={() => onImageChange(index)}
                className="group flex h-6 w-[1.0625rem] items-center justify-center"
              >
                <span
                  aria-hidden="true"
                  className="size-[0.4375rem] rounded-full bg-primary/45 group-aria-pressed:bg-primary"
                />
              </button>
            ))}
          </div>
        )}
      </section>

      <section
        aria-labelledby="mobile-nft-title"
        className="relative -mx-6 -mt-[7.125rem] flex flex-col gap-3 rounded-t-[31px] bg-surface px-6 pt-8 pb-6"
      >
        <div className="flex items-center justify-between gap-3">
          <h1 id="mobile-nft-title" className="truncate text-xl leading-6 font-bold text-fg">
            {nft.name}
          </h1>
          <p className="flex h-[1.6875rem] shrink-0 items-center gap-1 rounded-full border border-primary px-1.5 text-sm leading-4">
            <span className="flex size-3.5 items-center justify-center">
              <img src={starIcon} alt="" className="h-[0.6928rem] w-[0.7293rem]" />
            </span>
            <span className="font-medium text-fg">
              {nft.rating.average.toFixed(1)}
              <span className="sr-only"> de 5</span>
            </span>
            <span className="text-fg-muted">
              ({nft.rating.count}
              <span className="sr-only"> avaliações</span>)
            </span>
          </p>
        </div>
        <p className="text-sm leading-6 text-fg-muted">{nft.description}</p>
        <EditionPicker
          name="edition-mobile"
          editions={nft.editions}
          selectedId={purchase.edition?.id}
          onSelect={purchase.onEditionChange}
        />
        <TokenInfo nft={nft} />
      </section>

      <div
        role="region"
        aria-label="Compra"
        className="fixed inset-x-0 bottom-0 z-40 flex h-[10.25rem] flex-col gap-5 rounded-t-[40px] bg-surface px-6 pt-5 shadow-[0_0_10px_color-mix(in_srgb,var(--color-bg)_45%,transparent)]"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[0.9375rem] leading-4 font-medium text-fg-muted">Qtd.</span>
            <QuantityStepper
              idPrefix="mobile"
              size="sm"
              value={purchase.quantity}
              max={purchase.edition?.available ?? 1}
              onChange={purchase.onQuantityChange}
              disabled={soldOut}
            />
          </div>
          <p className="text-xl leading-4 font-bold text-fg-accent">
            <span className="sr-only">Total: </span>
            {formatEth(multiplyEth(nft.price, purchase.quantity))}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BuyButton
            soldOut={soldOut}
            className="flex h-15 w-[12.25rem] items-center justify-center rounded-full bg-linear-100 from-primary from-4% to-primary/80 text-base leading-5 font-bold text-primary-fg"
          >
            Comprar NFT
          </BuyButton>
          <BuyButton
            soldOut={soldOut}
            ariaLabel="Adicionar ao carrinho"
            className={`${roundButtonBase} size-15`}
          >
            <img src={shopIcon} alt="" width={20} height={20} className="size-5" />
          </BuyButton>
        </div>
      </div>
    </div>
  )
}

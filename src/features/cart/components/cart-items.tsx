import { Link } from '@tanstack/react-router'
import deleteIcon from '@/assets/figma/cart/delete.svg'
import mobileDeleteIcon from '@/assets/figma/cart/m-delete.svg'
import { useRemoveCartItem, useUpdateCartItem } from '@/features/cart/hooks/use-cart'
import type { CartItem } from '@/features/cart/types/cart'
import { QuantityStepper } from '@/features/nft/components/quantity-stepper'
import { formatEth } from '@/lib/eth'

function issueText(item: CartItem): string | null {
  if (item.issue === 'sold_out') return 'Esta edição esgotou. Remova o item para continuar.'
  if (item.issue === 'insufficient_stock') {
    return `Só ${item.edition.available === 1 ? 'resta 1 unidade' : `restam ${item.edition.available} unidades`}. Ajuste a quantidade.`
  }
  return null
}

/** Quantity and removal are optimistic: the line changes at once and rolls back on failure. */
function useLineActions(item: CartItem) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  return {
    setQuantity: (quantity: number) => update.mutate({ itemId: item.id, quantity }),
    remove: () => remove.mutate(item.id),
    max: Math.max(1, item.edition.available),
  }
}

function NftLink({ item, className }: { item: CartItem; className: string }) {
  return (
    <Link
      to="/nft/$nftId"
      params={{ nftId: item.nft.id }}
      search={{ edicao: item.edition.id }}
      className={`${className} hover:text-fg-accent`}
    >
      {item.nft.name}
    </Link>
  )
}

function DesktopRow({ item }: { item: CartItem }) {
  const actions = useLineActions(item)
  const issue = issueText(item)

  return (
    <>
      <div role="row" className={`${columns} h-[4.375rem] bg-surface`}>
        <div role="rowheader" className="flex items-center gap-4">
          <img
            src={item.nft.image.src}
            alt=""
            width={70}
            height={70}
            className="block size-[4.375rem] shrink-0 rounded-[6px] object-cover"
          />
          <div className="min-w-0 space-y-1.5 leading-4">
            <NftLink item={item} className="block truncate text-base font-bold text-fg" />
            <p className="text-sm text-fg-subtle">ID do token: {item.nft.tokenId}</p>
            <p className="text-xs text-fg-muted">Edição: {item.edition.label}</p>
          </div>
        </div>
        <div role="cell" className="text-base leading-4 font-bold text-fg-muted">
          {formatEth(item.unitPrice)}
        </div>
        <div role="cell">
          <QuantityStepper
            idPrefix={`desktop-${item.id}`}
            size="sm"
            value={item.quantity}
            max={actions.max}
            onChange={actions.setQuantity}
            disabled={item.issue === 'sold_out'}
            showLimit={false}
            itemLabel={item.nft.name}
          />
        </div>
        <div role="cell" className="text-base leading-4 font-bold text-fg-accent">
          {formatEth(item.lineTotal)}
        </div>
        <div role="cell">
          <button
            type="button"
            aria-label={`Remover ${item.nft.name} do carrinho`}
            onClick={actions.remove}
            className="flex size-6 items-center justify-center rounded-sm transition-opacity hover:opacity-75"
          >
            <img src={deleteIcon} alt="" className="h-[1.249rem] w-[1.1032rem]" />
          </button>
        </div>
      </div>
      {issue && (
        <div role="row">
          <div role="cell" aria-colspan={5}>
            <p role="alert" className="text-xs text-required">
              {item.nft.name}: {issue}
            </p>
          </div>
        </div>
      )}
    </>
  )
}

/** Column widths of the design's 782px table (312 / 137 / 137 / 150 / 46). */
const columns = 'grid grid-cols-[39.9%_17.5%_17.5%_19.2%_5.9%] items-center'

/** Desktop table (ARIA grid of rows): NFT, price, editions (quantity), total and removal. */
export function CartTable({ items }: { items: CartItem[] }) {
  return (
    <div
      role="table"
      aria-label="Itens do carrinho"
      className="hidden w-full md:block lg:w-[48.875rem]"
    >
      <div role="rowgroup">
        <div
          role="row"
          className={`${columns} border-b border-line pb-3 text-base leading-4 text-fg`}
        >
          <span role="columnheader" className="font-bold">
            NFTs
          </span>
          <span role="columnheader" className="font-medium">
            Preço
          </span>
          <span role="columnheader" className="font-bold">
            Edições
          </span>
          <span role="columnheader" className="font-medium">
            Total
          </span>
          <span role="columnheader">
            <span className="sr-only">Remover</span>
          </span>
        </div>
      </div>
      <div role="rowgroup" className="mt-3 flex flex-col gap-3">
        {items.map((item) => (
          <DesktopRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function MobileCard({ item }: { item: CartItem }) {
  const actions = useLineActions(item)
  const issue = issueText(item)

  return (
    <li>
      <article className="relative flex h-[6.25rem] overflow-hidden rounded-[14px] bg-surface shadow-[0_6px_20px_color-mix(in_srgb,var(--color-bg)_45%,transparent)]">
        <img
          src={item.nft.image.src}
          alt=""
          width={100}
          height={100}
          className="size-[6.25rem] shrink-0 rounded-[14px] object-cover"
        />
        <div className="min-w-0 flex-1 pt-[0.8125rem] pl-[0.5625rem]">
          <h3 className="truncate pr-10 text-[0.9375rem] leading-4 font-bold text-fg">
            <NftLink item={item} className="" />
          </h3>
          <p className="mt-1.5 text-sm leading-4 text-fg-muted">Edição: {item.edition.label}</p>
          <p className="mt-[1.125rem] text-lg leading-4 font-bold text-fg-accent">
            {formatEth(item.lineTotal)}
          </p>
        </div>
        <button
          type="button"
          aria-label={`Remover ${item.nft.name} do carrinho`}
          onClick={actions.remove}
          className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full transition-opacity hover:opacity-75"
        >
          <img src={mobileDeleteIcon} alt="" className="h-[1.249rem] w-[1.1032rem]" />
        </button>
        <div className="absolute right-4 bottom-3">
          <QuantityStepper
            idPrefix={`mobile-${item.id}`}
            size="ring"
            value={item.quantity}
            max={actions.max}
            onChange={actions.setQuantity}
            disabled={item.issue === 'sold_out'}
            showLimit={false}
            itemLabel={item.nft.name}
          />
        </div>
      </article>
      {issue && (
        <p role="alert" className="mt-2 text-xs text-required">
          {issue}
        </p>
      )}
    </li>
  )
}

/** Phone list of cards; the totals live in the fixed panel below. */
export function CartMobileList({ items }: { items: CartItem[] }) {
  return (
    <ul aria-label="Itens do carrinho" className="flex flex-col gap-5 md:hidden">
      {items.map((item) => (
        <MobileCard key={item.id} item={item} />
      ))}
    </ul>
  )
}

import type { PurchaseLine } from '@/features/checkout/purchase-lines'
import { formatEth } from '@/lib/eth'

interface PurchaseLinesProps {
  lines: PurchaseLine[]
  /** `panel`: raised rows of "Seus NFTs". `receipt`: plain rows of the confirmation. */
  variant: 'panel' | 'receipt'
  label: string
}

/** NFTs being bought (or bought) with quantity and line total, as in the payment design. */
export function PurchaseLines({ lines, variant, label }: PurchaseLinesProps) {
  const panel = variant === 'panel'

  return (
    <div role="table" aria-label={label} className="text-fg">
      <div role="rowgroup">
        <div
          role="row"
          className={`grid border-b border-line pb-3 text-[0.9375rem] leading-4 font-bold ${
            panel ? 'grid-cols-[1fr_auto]' : 'grid-cols-[1fr_4.5rem_6.5rem]'
          }`}
        >
          <span role="columnheader">NFTs</span>
          {!panel && (
            <span role="columnheader" className="text-center">
              Edições
            </span>
          )}
          <span role="columnheader" className="text-right">
            Subtotal
          </span>
        </div>
      </div>
      <div role="rowgroup" className="mt-3 flex flex-col gap-3">
        {lines.map((line) => (
          <div
            key={line.key}
            role="row"
            className={`grid items-center gap-x-3 ${
              panel ? 'grid-cols-[1fr_auto_auto] bg-surface pr-4' : 'grid-cols-[1fr_4.5rem_6.5rem]'
            }`}
          >
            <div role="cell" className="flex min-w-0 items-center gap-3">
              <img
                src={line.image.src}
                alt=""
                width={70}
                height={70}
                loading="lazy"
                className="size-[4.375rem] shrink-0 rounded-[6px] object-cover"
              />
              <div className="min-w-0">
                <p
                  className={`truncate font-bold ${panel ? 'text-base leading-5' : 'text-[0.9375rem] leading-5'}`}
                >
                  {line.name}
                </p>
                <p className="truncate text-sm text-fg-subtle">
                  ID do token: {line.tokenId}
                  <span className="sr-only">, edição {line.editionLabel}</span>
                </p>
              </div>
            </div>
            <div
              role="cell"
              className={`text-sm whitespace-nowrap ${panel ? 'text-fg-muted' : 'text-center'}`}
            >
              <span aria-hidden="true">(x {line.quantity})</span>
              <span className="sr-only">
                {line.quantity} {line.quantity === 1 ? 'unidade' : 'unidades'}
              </span>
            </div>
            <div
              role="cell"
              className="text-right text-lg leading-5 font-bold whitespace-nowrap text-fg-accent"
            >
              {formatEth(line.lineTotal)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

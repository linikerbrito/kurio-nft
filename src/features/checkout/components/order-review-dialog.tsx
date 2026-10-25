import closeIcon from '@/assets/figma/auth/close.svg'
import { SummaryRows } from '@/features/cart/components/cart-summary'
import { PurchaseLines } from '@/features/checkout/components/purchase-lines'
import { linesFromCart } from '@/features/checkout/purchase-lines'
import { quoteChanges } from '@/features/checkout/quote-changes'
import type { Quote } from '@/features/checkout/types/checkout'
import { networkDescription, shortAddress } from '@/features/wallets/format'
import { walletProviderLabels, type WalletConnection } from '@/features/wallets/types/wallets'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'

export interface ReviewState {
  quote: Quote
  /** Set when the API refused the previous quote: the user must confirm the new values. */
  previousQuote: Quote | null
  connection: WalletConnection
  collector: { displayName: string; email: string }
}

interface OrderReviewDialogProps {
  review: ReviewState | null
  placing: boolean
  disconnecting: boolean
  /** Failure of the last attempt; `retry` keeps the same attempt (same idempotency key). */
  failure: { message: string; retry: boolean } | null
  onConfirm: () => void
  onDisconnect: () => void
  onClose: () => void
}

/**
 * Review before paying (not in the design, required by the flow): items and totals from the
 * API quote, the connected wallet and who is buying.
 */
export function OrderReviewDialog({
  review,
  placing,
  disconnecting,
  failure,
  onConfirm,
  onDisconnect,
  onClose,
}: OrderReviewDialogProps) {
  const changes = review?.previousQuote ? quoteChanges(review.previousQuote, review.quote) : []
  const blocked = review?.quote.items.some((item) => item.issue !== null) ?? true

  return (
    <Dialog open={review !== null} onOpenChange={(open) => !open && !placing && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="block max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[36rem] overflow-y-auto rounded-[8px] p-0 pb-6 after:h-2.5 sm:max-w-[36rem]"
      >
        {review && (
          <>
            <button
              type="button"
              aria-label="Fechar revisão"
              disabled={placing}
              onClick={onClose}
              className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-sm transition-opacity hover:opacity-75 disabled:opacity-40"
            >
              <img src={closeIcon} alt="" className="size-[1.125rem]" />
            </button>
            <div className="space-y-6 px-6 pt-10 md:px-11">
              <div className="space-y-2 text-center">
                <DialogTitle className="text-lg leading-6 font-bold text-fg">
                  Revise sua compra
                </DialogTitle>
                <DialogDescription className="text-sm text-fg-muted">
                  Confira os valores cotados agora pela Kurio antes de pagar.
                </DialogDescription>
              </div>

              {changes.length > 0 && (
                <div role="alert" className="space-y-2 rounded-[6px] border border-required/70 p-3">
                  <p className="text-sm font-bold text-fg">
                    Os valores mudaram desde a sua revisão. Confirme novamente para continuar.
                  </p>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-fg-muted">
                    {changes.map((change) => (
                      <li key={change}>{change}</li>
                    ))}
                  </ul>
                </div>
              )}

              <PurchaseLines
                lines={linesFromCart(review.quote.items)}
                variant="receipt"
                label="Itens da compra"
              />
              <SummaryRows
                summary={review.quote.summary}
                discountLabel={review.quote.coupon?.description}
                variant="desktop"
              />

              <dl className="grid gap-3 border-t border-line pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-bold text-fg">Pagamento</dt>
                  <dd className="text-fg-muted">
                    {review.connection.label} · {shortAddress(review.connection.address)}
                  </dd>
                  <dd className="text-fg-muted">
                    {networkDescription(review.connection.network)} ·{' '}
                    {walletProviderLabels[review.connection.provider]} conectada
                  </dd>
                  <dd className="mt-1">
                    <button
                      type="button"
                      disabled={placing || disconnecting}
                      onClick={onDisconnect}
                      className="text-sm font-bold text-fg-accent hover:underline disabled:opacity-50"
                    >
                      Desconectar carteira
                    </button>
                  </dd>
                </div>
                <div>
                  <dt className="font-bold text-fg">Colecionador</dt>
                  <dd className="text-fg-muted">{review.collector.displayName}</dd>
                  <dd className="break-all text-fg-muted">{review.collector.email}</dd>
                </div>
              </dl>

              {failure && (
                <p role="alert" className="text-sm text-required">
                  {failure.message}
                </p>
              )}

              <button
                type="button"
                disabled={placing || blocked}
                aria-busy={placing}
                onClick={onConfirm}
                className="flex h-[2.8125rem] w-full items-center justify-center rounded-[6px] bg-primary text-[0.9375rem] leading-4 font-bold text-primary-fg transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {placing
                  ? 'Enviando pagamento…'
                  : failure?.retry
                    ? 'Tentar novamente'
                    : changes.length > 0
                      ? 'Confirmar com os novos valores'
                      : 'Confirmar pagamento'}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

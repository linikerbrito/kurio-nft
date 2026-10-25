import Decimal from 'decimal.js'
import { useEffect, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import closeIcon from '@/assets/figma/auth/close.svg'
import thankYouIcon from '@/assets/icons/thank-you.svg'
import { PurchaseLines } from '@/features/checkout/components/purchase-lines'
import { linesFromOrder } from '@/features/checkout/purchase-lines'
import type { Network } from '@/features/catalog/types/catalog'
import { networkLabels } from '@/features/nft/network-labels'
import { useOrder } from '@/features/orders/hooks/use-order'
import type { Order } from '@/features/orders/types/orders'
import { shortAddress } from '@/features/wallets/format'
import { walletProviderLabels } from '@/features/wallets/types/wallets'
import { formatEth } from '@/lib/eth'
import { toApiError } from '@/lib/http'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

const explorerNames: Record<Network, string> = {
  ethereum: 'Etherscan',
  polygon: 'Polygonscan',
  solana: 'Solscan',
}

const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

/** "29 Jul, 2026", as in the receipt design. */
function formatReceiptDate(iso: string): string {
  const date = new Date(iso)
  return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`
}

/**
 * Order state and receipt. Only a confirmed order shows the receipt; a pending one keeps
 * checking until the network settles it, and a refused one says so with the cart intact.
 */
export function OrderConfirmationPage() {
  const { orderId } = useParams({ from: '/_authenticated/pedidos/$orderId' })
  const order = useOrder(orderId)

  useEffect(() => {
    document.title = 'Pedido · Kurio'
    return () => {
      document.title = 'Kurio'
    }
  }, [])

  let content: ReactNode
  if (order.isPending) {
    content = <ReceiptSkeleton />
  } else if (order.isError) {
    const error = toApiError(order.error)
    content = (
      <StateMessage
        title={
          error.code === 'not_found'
            ? 'Pedido não encontrado.'
            : 'Não foi possível carregar o pedido.'
        }
      >
        {error.code === 'not_found' ? (
          <Link to="/" className="font-bold text-fg-accent hover:underline">
            Voltar ao início
          </Link>
        ) : (
          <Button type="button" disabled={order.isFetching} onClick={() => void order.refetch()}>
            {order.isFetching ? 'Tentando…' : 'Tentar novamente'}
          </Button>
        )}
      </StateMessage>
    )
  } else {
    content = <OrderState order={order.data} />
  }

  return <div className="flex justify-center py-8 md:pt-[10.375rem] md:pb-20">{content}</div>
}

function OrderState({ order }: { order: Order }) {
  const statusText = {
    pending: 'Pagamento enviado. Aguardando a confirmação da rede.',
    confirmed: 'Pagamento confirmado.',
    rejected: 'Pagamento recusado.',
  }[order.status]

  return (
    <ReceiptCard>
      <p role="status" aria-live="polite" className="sr-only">
        {statusText}
      </p>
      {order.status === 'confirmed' ? (
        <ConfirmedReceipt order={order} />
      ) : order.status === 'pending' ? (
        <PendingOrder order={order} />
      ) : (
        <RejectedOrder order={order} />
      )}
    </ReceiptCard>
  )
}

function ReceiptCard({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  return (
    <article className="relative w-full max-w-[36.125rem] overflow-hidden rounded-[8px] bg-surface pb-12 after:absolute after:inset-x-0 after:bottom-0 after:h-2.5 after:bg-primary md:rounded-none">
      <button
        type="button"
        aria-label="Fechar e voltar ao início"
        onClick={() => void navigate({ to: '/' })}
        className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-sm transition-opacity hover:opacity-75"
      >
        <img src={closeIcon} alt="" className="size-[1.125rem]" />
      </button>
      {children}
    </article>
  )
}

function ConfirmedReceipt({ order }: { order: Order }) {
  const network = networkLabels[order.wallet.network]
  const explorer = explorerNames[order.wallet.network]

  return (
    <>
      <header className="flex flex-col items-center gap-6 px-6 pt-[1.375rem] pb-5 text-center">
        <img src={thankYouIcon} alt="" width={66} height={80} />
        <h1 className="text-base leading-5 font-bold text-fg-muted">
          Seus NFTs agora estão na sua carteira
        </h1>
      </header>

      <dl className="grid grid-cols-2 gap-y-3 border-y border-primary px-6 py-3.5 text-sm leading-4 text-fg-muted sm:flex sm:justify-center sm:gap-0 sm:px-4">
        {[
          {
            label: 'ID da transação',
            value: order.transaction ? shortAddress(order.transaction.hash) : '—',
            strong: true,
          },
          { label: 'Data', value: formatReceiptDate(order.settledAt ?? order.createdAt) },
          { label: 'Total', value: formatEth(order.summary.total) },
          { label: 'Carteira', value: walletProviderLabels[order.wallet.provider], strong: true },
        ].map((entry) => (
          <div
            key={entry.label}
            className="space-y-1 sm:border-l sm:border-primary sm:px-4 sm:first:border-l-0"
          >
            <dt className={entry.strong ? 'font-bold' : ''}>{entry.label}</dt>
            <dd className="whitespace-nowrap">{entry.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="receipt-details" className="space-y-4 px-6 pt-7 md:px-11">
        <h2 id="receipt-details" className="text-[0.9375rem] leading-4 font-bold text-fg">
          Detalhes da transação
        </h2>
        <PurchaseLines
          lines={linesFromOrder(order.items)}
          variant="receipt"
          label="NFTs comprados"
        />
        <ReceiptTotals order={order} />
        <p className="px-2 text-center text-sm leading-[1.375rem] text-fg-muted">
          Transação confirmada na {network}. A propriedade foi transferida para sua carteira
          conectada ({order.wallet.label} · {shortAddress(order.wallet.address)}) e registrada na
          rede.
        </p>
        {order.transaction && (
          <div className="flex justify-center pt-1">
            <a
              href={order.transaction.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center rounded-[3px] bg-primary px-4 text-[0.9375rem] font-bold text-primary-fg transition-colors hover:bg-primary/90"
            >
              Ver no {explorer}
              <span className="sr-only"> (transação simulada, abre em nova aba)</span>
            </a>
          </div>
        )}
      </section>
    </>
  )
}

function ReceiptTotals({ order }: { order: Order }) {
  const hasDiscount = new Decimal(order.summary.discount).greaterThan(0)
  return (
    <dl className="ml-auto w-full max-w-[20rem] space-y-2 border-b border-line pb-3 text-[0.9375rem] text-fg">
      {hasDiscount && (
        <div className="flex justify-between gap-4">
          <dt>{order.coupon?.description ?? 'Desconto'}</dt>
          <dd>(-) {formatEth(order.summary.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <dt>Taxa de rede</dt>
        <dd className="text-lg leading-5">{formatEth(order.summary.networkFee)}</dd>
      </div>
      <div className="flex justify-between gap-4 font-bold">
        <dt>Total</dt>
        <dd className="text-lg leading-5 text-fg-accent">{formatEth(order.summary.total)}</dd>
      </div>
    </dl>
  )
}

function PendingOrder({ order }: { order: Order }) {
  return (
    <div className="space-y-6 px-6 pt-12 md:px-11">
      <div className="flex flex-col items-center gap-4 text-center">
        <span
          aria-hidden="true"
          className="size-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary motion-reduce:animate-none"
        />
        <h1 className="text-lg font-bold text-fg">Aguardando confirmação da rede</h1>
        <p className="text-sm text-fg-muted">
          Seu pagamento com {walletProviderLabels[order.wallet.provider]} foi enviado. Isso leva
          alguns segundos; você pode recarregar a página sem criar outra compra.
        </p>
      </div>
      <PurchaseLines lines={linesFromOrder(order.items)} variant="receipt" label="NFTs do pedido" />
      <ReceiptTotals order={order} />
    </div>
  )
}

function RejectedOrder({ order }: { order: Order }) {
  return (
    <div className="space-y-6 px-6 pt-12 text-center md:px-11">
      <h1 className="text-lg font-bold text-fg">Pagamento recusado</h1>
      <p className="text-sm text-fg-muted">
        {order.failureReason ?? 'A carteira recusou o pagamento.'} Nada foi cobrado e seus itens
        continuam no carrinho.
      </p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          to="/pagamento"
          className="inline-flex h-12 items-center justify-center rounded-[3px] bg-primary px-5 text-[0.9375rem] font-bold text-primary-fg hover:bg-primary/90"
        >
          Voltar ao pagamento
        </Link>
        <Link
          to="/carrinho"
          className="inline-flex h-12 items-center justify-center rounded-[3px] border border-primary px-5 text-[0.9375rem] font-bold text-fg-accent hover:bg-primary/10"
        >
          Ver carrinho
        </Link>
      </div>
    </div>
  )
}

function StateMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ReceiptCard>
      <div className="flex min-h-60 flex-col items-center justify-center gap-4 px-6 pt-12 text-center">
        <h1 className="text-lg font-bold text-fg">{title}</h1>
        {children}
      </div>
    </ReceiptCard>
  )
}

function ReceiptSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando pedido"
      className="w-full max-w-[36.125rem] space-y-6 bg-surface px-6 pt-6 pb-12 md:px-11"
    >
      <Skeleton className="mx-auto h-20 w-16" />
      <Skeleton className="h-16 w-full" />
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton key={index} className="h-[4.375rem] w-full" />
      ))}
    </div>
  )
}

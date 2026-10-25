import { Link } from '@tanstack/react-router'
import { CouponForm } from '@/features/cart/components/coupon-form'
import type { Cart } from '@/features/cart/types/cart'
import { formatEth } from '@/lib/eth'

interface CartSummaryProps {
  cart: Cart
  variant: 'desktop' | 'mobile'
}

/** Totals, coupon and the way to checkout; values always come from the API. */
export function CartSummary({ cart, variant }: CartSummaryProps) {
  const mobile = variant === 'mobile'
  const { summary } = cart
  const blocked = cart.items.length === 0 || cart.items.some((item) => item.issue !== null)
  const valueClass = mobile ? 'text-base leading-4' : 'text-lg leading-4'

  const rows = (
    <dl className="space-y-3 text-[0.9375rem] leading-5 text-fg">
      <div className="flex items-start justify-between gap-3">
        <dt>Subtotal</dt>
        <dd className={valueClass}>{formatEth(summary.subtotal)}</dd>
      </div>
      <div className="flex items-start justify-between gap-3">
        <dt>{cart.coupon?.description ?? 'Desconto do lançamento'}</dt>
        <dd>(-) {formatEth(summary.discount)}</dd>
      </div>
      <div className="flex items-start justify-between gap-3">
        <dt>Taxa de rede</dt>
        <dd className="text-right">
          <span className={`block ${valueClass}`}>{formatEth(summary.networkFee)}</span>
          <span className={`block text-xs leading-4 text-fg-accent ${mobile ? '' : 'mt-3'}`}>
            Taxa estimada
          </span>
        </dd>
      </div>
      <div className="flex items-start justify-between gap-3 leading-4 font-bold">
        <dt className="text-base">Total</dt>
        <dd className="text-lg text-fg-accent">{formatEth(summary.total)}</dd>
      </div>
    </dl>
  )

  const checkoutClass = mobile
    ? 'flex h-15 w-full items-center justify-center rounded-full bg-linear-109 from-primary from-4% to-primary/80 text-base leading-4 font-bold text-primary-fg'
    : 'flex h-10 w-full items-center justify-center rounded-[3px] bg-primary text-[0.9375rem] leading-4 font-bold text-primary-fg transition-colors hover:bg-primary/90'

  const checkout = blocked ? (
    <div className="w-full space-y-2">
      <button type="button" disabled className={`${checkoutClass} cursor-not-allowed opacity-50`}>
        Conectar e finalizar
      </button>
      {cart.items.length > 0 && (
        <p className="text-center text-xs text-fg-muted">
          Ajuste os itens indisponíveis para continuar.
        </p>
      )}
    </div>
  ) : (
    <Link to="/pagamento" className={checkoutClass}>
      Conectar e finalizar
    </Link>
  )

  if (mobile) {
    return (
      <section
        aria-label="Resumo do pedido"
        className="fixed inset-x-0 bottom-0 z-40 flex flex-col gap-8 rounded-t-[40px] bg-surface px-6 pt-6 pb-9 shadow-[0_0_10px_color-mix(in_srgb,var(--color-bg)_45%,transparent)] md:hidden"
      >
        <div className="space-y-3">
          <CouponForm coupon={cart.coupon} variant="mobile" />
          {rows}
        </div>
        {checkout}
      </section>
    )
  }

  return (
    <aside
      aria-labelledby="cart-summary-title"
      className="hidden w-full flex-col gap-6 md:flex lg:w-[20.75rem] lg:shrink-0"
    >
      <h2
        id="cart-summary-title"
        className="border-b border-line pb-3 text-lg leading-4 font-bold text-fg"
      >
        Resumo da carteira
      </h2>
      <CouponForm coupon={cart.coupon} variant="desktop" />
      {rows}
      <div className="flex flex-col items-center gap-3">
        {checkout}
        <Link to="/" hash="catalogo" className="text-[0.9375rem] text-fg-accent hover:underline">
          Continuar explorando
        </Link>
      </div>
    </aside>
  )
}

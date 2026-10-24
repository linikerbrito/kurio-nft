import { Link, useRouterState } from '@tanstack/react-router'
import { LogIn, Search, ShoppingCart } from 'lucide-react'
import { useCartCount } from '@/features/cart/hooks/use-cart-count'
import { isMarketPath } from '@/shared/layout/navigation-state'
import { UnavailableAction } from '@/shared/components/unavailable-action'

const linkClass =
  'relative inline-flex h-full items-center px-5 text-base text-fg transition-colors hover:text-primary'
const activeLinkClass =
  'font-semibold text-primary after:absolute after:right-5 after:-bottom-px after:left-5 after:h-0.5 after:bg-primary'
const actionClass =
  'relative inline-flex size-10 items-center justify-center rounded-sm text-fg transition-colors hover:bg-surface hover:text-primary'

export function Header() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const cartCount = useCartCount()
  const marketActive = isMarketPath(pathname)
  const homeActive = !marketActive

  return (
    <header className="page-container hidden md:block">
      <div className="flex h-17 items-center justify-between border-b border-border-default">
        <Link
          to="/"
          className="text-sm font-bold tracking-[0.08em] text-fg"
          aria-label="Kurio, início"
        >
          KURIO
        </Link>

        <nav aria-label="Principal" className="flex h-full items-center">
          <Link
            to="/"
            aria-current={homeActive ? 'page' : undefined}
            className={`${linkClass} ${homeActive ? activeLinkClass : ''}`}
          >
            Início
          </Link>
          <Link
            to="/"
            hash="catalogo"
            aria-current={marketActive ? 'page' : undefined}
            className={`${linkClass} ${marketActive ? activeLinkClass : ''}`}
          >
            Mercado
          </Link>
          <UnavailableAction variant="link" className={linkClass}>
            Criadores
          </UnavailableAction>
          <UnavailableAction variant="link" className={linkClass}>
            Aprenda
          </UnavailableAction>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/" hash="catalogo" aria-label="Buscar" className={actionClass}>
            <Search aria-hidden="true" size={22} />
          </Link>
          <Link
            to="/carrinho"
            aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
            className={actionClass}
          >
            <ShoppingCart aria-hidden="true" size={22} />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-0.5 right-0 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-bold text-primary-fg"
              >
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            to="/login"
            className="ml-3 inline-flex h-[2.125rem] items-center gap-1.5 rounded-sm bg-primary px-2.5 text-base font-medium text-primary-fg transition-colors hover:bg-primary/90"
          >
            <LogIn aria-hidden="true" size={18} />
            Entrar
          </Link>
        </div>
      </div>
    </header>
  )
}

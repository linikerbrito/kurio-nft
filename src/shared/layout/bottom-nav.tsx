import { Link, useRouterState } from '@tanstack/react-router'
import { Heart, Home, ScanLine, ShoppingCart, User } from 'lucide-react'
import { useCartCount } from '@/features/cart/hooks/use-cart-count'
import { UnavailableAction } from '@/shared/components/unavailable-action'

const itemClass =
  'flex min-w-0 flex-col items-center justify-center gap-1 text-[0.65rem] text-fg-muted transition-colors'
const iconClass = 'size-5'

export function BottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const cartCount = useCartCount()
  const homeActive = pathname === '/'
  const profileActive = pathname.startsWith('/perfil')
  const cartActive = pathname === '/carrinho'

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 rounded-t-[2rem] border-t border-border-default bg-surface px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-8px_28px_color-mix(in_srgb,var(--color-bg)_35%,transparent)] md:hidden"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end">
        <Link
          to="/"
          aria-label="Início"
          aria-current={homeActive ? 'page' : undefined}
          className={`${itemClass} ${homeActive ? 'text-primary' : ''}`}
        >
          <Home aria-hidden="true" className={`${iconClass} fill-current`} />
          <span className="sr-only">Início</span>
        </Link>

        <UnavailableAction variant="button" aria-label="Favoritos" className={itemClass}>
          <Heart aria-hidden="true" className={`${iconClass} fill-current`} />
          <span className="sr-only">Favoritos</span>
        </UnavailableAction>

        <UnavailableAction
          variant="button"
          aria-label="Scanner indisponível"
          className="relative -top-5 mx-auto flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-fg shadow-lg"
        >
          <ScanLine aria-hidden="true" className="size-7" />
        </UnavailableAction>

        <Link
          to="/carrinho"
          aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
          aria-current={cartActive ? 'page' : undefined}
          className={`${itemClass} ${cartActive ? 'text-primary' : ''}`}
        >
          <span className="relative">
            <ShoppingCart aria-hidden="true" className={iconClass} />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-primary text-[0.6rem] font-bold text-primary-fg"
              >
                {cartCount}
              </span>
            )}
          </span>
          <span className="sr-only">Carrinho</span>
        </Link>

        <Link
          to="/perfil"
          aria-label="Perfil"
          aria-current={profileActive ? 'page' : undefined}
          className={`${itemClass} ${profileActive ? 'text-primary' : ''}`}
        >
          <User aria-hidden="true" className={iconClass} />
          <span className="sr-only">Perfil</span>
        </Link>
      </div>
    </nav>
  )
}

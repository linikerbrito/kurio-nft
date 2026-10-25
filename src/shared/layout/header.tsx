import { lazy, Suspense } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import cartIcon from '@/assets/figma/cart.svg'
import logoutIcon from '@/assets/figma/logout.svg'
import { useLoginRedirectSearch } from '@/features/auth/hooks/use-login-redirect-search'
import { useSession } from '@/features/auth/hooks/use-session'
import { SearchDialog } from '@/features/catalog/components/search-dialog'
import { useCartCount } from '@/features/cart/hooks/use-cart'
import { isMarketPath } from '@/shared/layout/navigation-state'
import { MaskIcon } from '@/shared/components/mask-icon'
import { UnavailableAction } from '@/shared/components/unavailable-action'

/** Only signed-in users get the account menu: its dropdown code stays out of the first load. */
const UserMenu = lazy(() =>
  import('@/features/auth/components/user-menu').then((module) => ({ default: module.UserMenu })),
)

const linkClass =
  'relative inline-flex h-full items-start px-5 text-base text-fg transition-colors hover:text-fg-accent'
const activeLinkClass =
  'font-bold text-fg-accent after:absolute after:right-5 after:-bottom-px after:left-5 after:h-0.5 after:bg-primary'
const actionClass =
  'relative inline-flex size-10 items-center justify-center rounded-sm text-fg transition-colors hover:bg-surface hover:text-fg-accent'

export function Header() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const cartCount = useCartCount()
  const { data: session } = useSession()
  const loginSearch = useLoginRedirectSearch()
  const onAuthScreen = pathname === '/login' || pathname === '/cadastro'
  const marketActive = isMarketPath(pathname)
  const homeActive = !marketActive

  return (
    <header className="page-container hidden md:block">
      <div className="flex h-[4.3125rem] items-start justify-between border-b border-border-default pt-6">
        <Link
          to="/"
          className="mt-2 text-sm font-bold tracking-[0.1em] text-fg"
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

        <div className="-mt-0.5 flex h-10 items-center gap-2.5">
          <SearchDialog triggerClassName={actionClass} />
          <Link
            to="/carrinho"
            aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
            className={actionClass}
          >
            <MaskIcon src={cartIcon} className="size-6" />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-2 right-px flex size-4 items-center justify-center rounded-full bg-primary text-[0.625rem] font-medium text-primary-fg"
              >
                {cartCount}
              </span>
            )}
          </Link>
          {session ? (
            <Suspense
              fallback={
                <span
                  aria-hidden="true"
                  className="ml-2.5 size-[2.1875rem] rounded-full bg-primary"
                />
              }
            >
              <UserMenu user={session.user} />
            </Suspense>
          ) : (
            <Link
              to="/login"
              search={onAuthScreen ? {} : loginSearch}
              className="ml-2.5 inline-flex h-[2.1875rem] w-[6.25rem] items-center justify-center gap-1 rounded-[6px] bg-primary text-base font-medium text-primary-fg transition-colors hover:bg-primary/90"
            >
              <span className="flex size-5 items-center justify-center">
                <MaskIcon src={logoutIcon} className="h-[1.0573rem] w-[1.1111rem]" />
              </span>
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

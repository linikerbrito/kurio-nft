import { useEffect, useRef, type ReactNode } from 'react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import {
  ArrowDownToLine,
  Heart,
  LogOut,
  MapPin,
  ShoppingCart,
  TrendingUp,
  TriangleAlert,
  User,
  type LucideIcon,
} from 'lucide-react'
import { useLogout } from '@/features/auth/hooks/use-session'
import { UnavailableAction } from '@/shared/components/unavailable-action'

const itemClass =
  'relative flex h-[2.8125rem] shrink-0 items-center gap-3.5 rounded-full px-4 text-[0.9375rem] whitespace-nowrap text-fg-accent transition-colors hover:bg-surface-raised lg:rounded-none lg:px-4'
const activeClass =
  'bg-surface-raised font-bold lg:bg-transparent lg:before:absolute lg:before:inset-y-0 lg:before:left-0 lg:before:w-1.5 lg:before:bg-primary'

function ItemContent({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <>
      <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
      {children}
    </>
  )
}

/** Sections without a screen in this delivery: present, announced as unavailable. */
const unavailableItems: { label: string; icon: LucideIcon }[] = [
  { label: 'Atividade', icon: ShoppingCart },
  { label: 'Ofertas', icon: TrendingUp },
  { label: 'Arquivos baixados', icon: ArrowDownToLine },
  { label: 'Suporte', icon: TriangleAlert },
]

/**
 * "Meu perfil": side menu of the profile frames on wide screens; on phones (no frame) the
 * same items become a horizontal strip above the content.
 */
export function ProfileLayout() {
  const logout = useLogout()
  const menuRef = useRef<HTMLUListElement>(null)
  const pathname = useRouterState({ select: (state) => state.location.pathname })

  // On phones the menu scrolls sideways: keep the current section in view.
  useEffect(() => {
    menuRef.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [pathname])

  return (
    <div className="mt-6 flex flex-col gap-7 lg:mt-8 lg:flex-row lg:items-start">
      <nav
        aria-labelledby="profile-menu-title"
        className="-mx-6 bg-surface px-6 py-4 md:mx-0 md:px-2.5 lg:w-[19.375rem] lg:shrink-0 lg:px-0 lg:pt-4 lg:pb-0"
      >
        <h2
          id="profile-menu-title"
          className="mb-2 text-lg leading-6 font-bold text-fg lg:mb-1 lg:px-2.5"
        >
          Meu perfil
        </h2>
        <ul
          ref={menuRef}
          className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0"
        >
          <li>
            <Link
              to="/perfil"
              activeOptions={{ exact: true }}
              className={itemClass}
              activeProps={{ className: activeClass, 'aria-current': 'page' }}
            >
              <ItemContent icon={User}>Dados do perfil</ItemContent>
            </Link>
          </li>
          <li>
            <Link
              to="/perfil/carteiras"
              className={itemClass}
              activeProps={{ className: activeClass, 'aria-current': 'page' }}
            >
              <ItemContent icon={MapPin}>Carteiras</ItemContent>
            </Link>
          </li>
          <li>
            <Link
              to="/perfil/favoritos"
              className={itemClass}
              activeProps={{ className: activeClass, 'aria-current': 'page' }}
            >
              <ItemContent icon={Heart}>Lista de interesse</ItemContent>
            </Link>
          </li>
          {unavailableItems.map((item) => (
            <li key={item.label}>
              <UnavailableAction
                variant="link"
                aria-label={`${item.label} (indisponível na demonstração)`}
                className={`${itemClass} cursor-not-allowed`}
              >
                <ItemContent icon={item.icon}>{item.label}</ItemContent>
              </UnavailableAction>
            </li>
          ))}
          <li className="lg:mt-0 lg:border-t lg:border-line">
            <button
              type="button"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
              className={`${itemClass} w-full font-bold disabled:opacity-60 lg:h-12`}
            >
              <ItemContent icon={LogOut}>Sair</ItemContent>
            </button>
          </li>
        </ul>
      </nav>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}

import { Link, useRouterState } from '@tanstack/react-router'
import barShape from '@/assets/figma/mobile/nav-bar.svg'
import centerCircle from '@/assets/figma/mobile/nav-center.svg'
import heartIcon from '@/assets/figma/mobile/nav-heart.svg'
import homeIcon from '@/assets/figma/mobile/nav-home.svg'
import shopIcon from '@/assets/figma/mobile/nav-shop.svg'
import userIcon from '@/assets/figma/mobile/nav-user.svg'
import scanLine from '@/assets/figma/mobile/scan-part-1.svg'
import scanBottomLeft from '@/assets/figma/mobile/scan-part-2.svg'
import scanTopRight from '@/assets/figma/mobile/scan-part-3.svg'
import scanBottomRight from '@/assets/figma/mobile/scan-part-4.svg'
import scanTopLeft from '@/assets/figma/mobile/scan-part-5.svg'
import { useCartCount } from '@/features/cart/hooks/use-cart'
import { MaskIcon } from '@/shared/components/mask-icon'
import { UnavailableAction } from '@/shared/components/unavailable-action'

/** Icon slots share the design's top offset (71 of 126px) and horizontal percentages. */
const slotClass =
  'absolute top-[3.6875rem] flex size-11 items-center justify-center text-fg-muted transition-colors hover:text-fg-accent aria-[current=page]:text-fg-accent'

/** The five vector parts of the scanner glyph, placed as in the design (offsets in px). */
const scanParts = [
  { src: scanLine, left: 0, top: 11.08, width: 26.82, height: 1.79 },
  { src: scanBottomLeft, left: 1.33, top: 13.7, width: 10.35, height: 10.31 },
  { src: scanTopRight, left: 15.11, top: 0.08, width: 10.39, height: 10.3 },
  { src: scanBottomRight, left: 15.11, top: 13.7, width: 10.32, height: 10.25 },
  { src: scanTopLeft, left: 1.33, top: 0, width: 10.39, height: 10.31 },
]

export function BottomNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const cartCount = useCartCount()
  const homeActive = pathname === '/'
  const favoritesActive = pathname === '/perfil/favoritos'
  const profileActive = pathname.startsWith('/perfil') && !favoritesActive
  const cartActive = pathname === '/carrinho'

  return (
    <nav
      aria-label="Principal"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-[7.875rem] md:hidden"
    >
      <div className="absolute inset-x-0 top-[24.6%] bottom-0">
        <img
          src={barShape}
          alt=""
          width={474}
          height={155}
          className="absolute top-[-42.13%] right-[-7.25%] bottom-[-21.06%] left-[-7.25%] size-auto max-w-none"
          style={{ width: '114.5%', height: '163.19%' }}
        />
      </div>

      <div className="pointer-events-auto">
        <Link
          to="/"
          aria-label="Início"
          aria-current={homeActive ? 'page' : undefined}
          className={`${slotClass} left-[calc(8.7%-0.75rem)]`}
        >
          <MaskIcon src={homeIcon} className="h-[1.0417rem] w-[0.9896rem]" />
        </Link>

        <Link
          to="/perfil/favoritos"
          aria-label="Favoritos"
          aria-current={favoritesActive ? 'page' : undefined}
          className={`${slotClass} left-[calc(26.09%-0.75rem)]`}
        >
          <MaskIcon src={heartIcon} className="h-[1.1121rem] w-5" />
        </Link>

        <UnavailableAction
          variant="button"
          aria-label="Escanear NFT"
          className="absolute top-0 left-1/2 size-[4.0625rem] -translate-x-1/2 rounded-full"
        >
          <img src={centerCircle} alt="" width={65} height={65} className="absolute inset-0" />
          <span className="absolute top-[1.3125rem] left-[1.1875rem] h-6 w-[1.6764rem]">
            {scanParts.map((part) => (
              <img
                key={part.src}
                src={part.src}
                alt=""
                className="absolute max-w-none"
                style={{
                  left: part.left,
                  top: part.top,
                  width: part.width,
                  height: part.height,
                }}
              />
            ))}
          </span>
        </UnavailableAction>

        <Link
          to="/carrinho"
          aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`}
          aria-current={cartActive ? 'page' : undefined}
          className={`${slotClass} left-[calc(70.53%-0.75rem)]`}
        >
          <span className="relative">
            <MaskIcon src={shopIcon} className="size-5" />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1.5 -right-2 flex size-4 items-center justify-center rounded-full bg-primary text-[0.625rem] font-medium text-primary-fg"
              >
                {cartCount}
              </span>
            )}
          </span>
        </Link>

        <Link
          to="/perfil"
          aria-label="Perfil"
          aria-current={profileActive ? 'page' : undefined}
          className={`${slotClass} left-[calc(85.51%-0.75rem)]`}
        >
          <MaskIcon src={userIcon} className="size-5" />
        </Link>
      </div>
    </nav>
  )
}

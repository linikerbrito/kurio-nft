import { Link } from '@tanstack/react-router'
import heartOutline from '@/assets/figma/detail/m-heart.svg'
import heartFilled from '@/assets/figma/favorites/heart-filled.svg'
import { useLoginRedirectSearch } from '@/features/auth/hooks/use-login-redirect-search'
import { useSession } from '@/features/auth/hooks/use-session'
import { useIsFavorite, useToggleFavorite } from '@/features/favorites/hooks/use-favorites'
import { MaskIcon } from '@/shared/components/mask-icon'
import { roundButtonBase } from '@/shared/components/round-button'

type Variant = 'card' | 'detail' | 'detail-mobile'

/** Sizes of each place a heart appears in the design. */
const styles: Record<Variant, { control: string; icon: string }> = {
  card: {
    control: `${roundButtonBase} absolute top-2 right-2 z-10 size-7 text-primary md:hidden`,
    icon: 'h-[0.834rem] w-[0.9375rem]',
  },
  detail: {
    control:
      'inline-flex h-10 w-[8.125rem] items-center justify-center gap-2 rounded-[6px] border border-primary text-sm leading-5 font-medium text-fg-accent transition-colors hover:bg-primary/10 aria-pressed:bg-primary/10',
    icon: 'h-[1.1124rem] w-5 text-primary',
  },
  'detail-mobile': {
    control: `${roundButtonBase} size-[2.1875rem] text-fg-accent`,
    icon: 'h-[0.8897rem] w-4',
  },
}

interface FavoriteButtonProps {
  nftId: string
  nftName: string
  variant: Variant
}

/**
 * Heart of cards and the detail page. Signed in, it toggles the favorite (optimistic, with
 * rollback); visitors go to login and come back to the same page.
 */
export function FavoriteButton({ nftId, nftName, variant }: FavoriteButtonProps) {
  const { data: session } = useSession()
  const loginSearch = useLoginRedirectSearch()
  const isFavorite = useIsFavorite(nftId)
  const toggle = useToggleFavorite()
  const style = styles[variant]
  const label = variant === 'detail' ? 'Favoritar' : null

  if (session === null) {
    return (
      <Link
        to="/login"
        search={loginSearch}
        aria-label={`Favoritar ${nftName} (entre na sua conta para salvar)`}
        className={style.control}
      >
        <MaskIcon src={heartOutline} className={style.icon} />
        {label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      aria-label={`Favoritar ${nftName}`}
      aria-pressed={isFavorite}
      onClick={() => toggle.mutate({ nftId, favorite: !isFavorite })}
      className={style.control}
    >
      <MaskIcon src={isFavorite ? heartFilled : heartOutline} className={style.icon} />
      {label}
    </button>
  )
}

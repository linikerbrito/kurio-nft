import type { ReactNode } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import heartIcon from '@/assets/figma/detail/heart.svg'
import linkedinIcon from '@/assets/figma/detail/share-linkedin.svg'
import mailIcon from '@/assets/figma/detail/share-mail.svg'
import twitterIcon from '@/assets/figma/detail/share-twitter.svg'
import { useLoginRedirectSearch } from '@/features/auth/hooks/use-login-redirect-search'
import { useAddToCart } from '@/features/cart/hooks/use-cart'
import type { PurchaseState } from '@/features/nft/components/nft-purchase-panel'
import { toApiError } from '@/lib/http'

/** Favorites need an account: until the session exists, favoriting leads to login and back. */
export function FavoriteLink({ nftName }: { nftName: string }) {
  const search = useLoginRedirectSearch()
  return (
    <Link
      to="/login"
      search={search}
      aria-label={`Favoritar ${nftName} (entre na sua conta para salvar)`}
      className="inline-flex h-10 w-[8.125rem] items-center justify-center gap-2 rounded-[6px] border border-primary text-sm leading-5 font-medium text-fg-accent transition-colors hover:bg-primary/10"
    >
      <img src={heartIcon} alt="" width={20} height={20} className="size-5" />
      Favoritar
    </Link>
  )
}

interface BuyButtonProps {
  nftId: string
  purchase: PurchaseState
  /** `buy` adds and opens the cart; `add` adds and stays on the page. */
  mode: 'buy' | 'add'
  className: string
  children: ReactNode
  /** Needed when the content is only an icon. */
  ariaLabel?: string
}

/** Adds the chosen edition and quantity to the cart; the API checks the stock again. */
export function BuyButton({
  nftId,
  purchase,
  mode,
  className,
  children,
  ariaLabel,
}: BuyButtonProps) {
  const addToCart = useAddToCart()
  const navigate = useNavigate()
  const { edition, quantity } = purchase

  if (!edition) {
    return (
      <button
        type="button"
        disabled
        aria-label={ariaLabel ? `${ariaLabel} (esgotado)` : undefined}
        className={`${className} cursor-not-allowed opacity-50`}
      >
        {ariaLabel ? children : 'Esgotado'}
      </button>
    )
  }

  function handleClick() {
    if (!edition) return
    addToCart.mutate(
      { nftId, editionId: edition.id, quantity },
      {
        onSuccess: () => {
          if (mode === 'buy') {
            void navigate({ to: '/carrinho' })
            return
          }
          toast.success('Adicionado ao carrinho.', {
            action: { label: 'Ver carrinho', onClick: () => void navigate({ to: '/carrinho' }) },
          })
        },
        onError: (error) => toast.error(toApiError(error).message),
      },
    )
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-busy={addToCart.isPending}
      disabled={addToCart.isPending}
      onClick={handleClick}
      className={`${className} disabled:opacity-70`}
    >
      {children}
    </button>
  )
}

export function ShareLinks({ nftName }: { nftName: string }) {
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent(`${nftName} na Kurio`)
  const links = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      icon: linkedinIcon,
      size: 'h-[0.8984rem] w-[0.9375rem]',
      external: true,
    },
    {
      label: 'e-mail',
      href: `mailto:?subject=${text}&body=${url}`,
      icon: mailIcon,
      size: 'size-[1.125rem]',
      external: false,
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      icon: twitterIcon,
      size: 'h-[0.7619rem] w-[0.9979rem]',
      external: true,
    },
  ]

  return (
    <div className="flex items-center gap-2">
      <p className="text-[0.9375rem] leading-4 font-bold text-fg">Compartilhar este NFT:</p>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target={link.external ? '_blank' : undefined}
          rel={link.external ? 'noopener noreferrer' : undefined}
          aria-label={`Compartilhar por ${link.label}${link.external ? ' (abre em nova aba)' : ''}`}
          className="flex size-5 items-center justify-center rounded-sm transition-opacity hover:opacity-75"
        >
          <img src={link.icon} alt="" className={link.size} />
        </a>
      ))}
    </div>
  )
}

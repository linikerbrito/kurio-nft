import { useEffect, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { NftShowcase } from '@/features/catalog/components/nft-showcase'
import { useNftList } from '@/features/catalog/hooks/use-catalog'
import { CartMobileList, CartTable } from '@/features/cart/components/cart-items'
import { CartSummary } from '@/features/cart/components/cart-summary'
import { useCart } from '@/features/cart/hooks/use-cart'
import type { Cart } from '@/features/cart/types/cart'
import { BackButton } from '@/shared/components/back-button'
import { PageTrail } from '@/shared/components/page-trail'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

export function CartPage() {
  const { data, isPending, isError, isFetching, refetch } = useCart()

  useEffect(() => {
    document.title = 'Carrinho · Kurio'
    return () => {
      document.title = 'Kurio'
    }
  }, [])

  let content: ReactNode
  if (isPending) {
    content = <CartSkeleton />
  } else if (isError) {
    content = (
      <CartMessage title="Não foi possível carregar o carrinho.">
        <p className="text-sm text-fg-muted">Verifique sua conexão e tente novamente.</p>
        <Button type="button" disabled={isFetching} onClick={() => void refetch()}>
          {isFetching ? 'Tentando…' : 'Tentar novamente'}
        </Button>
      </CartMessage>
    )
  } else if (data.items.length === 0) {
    content = (
      <CartMessage title="Seu carrinho está vazio.">
        <p className="text-sm text-fg-muted">Escolha um NFT no catálogo para começar.</p>
        <Link
          to="/"
          hash="catalogo"
          className="inline-flex h-10 items-center rounded-[6px] bg-primary px-5 text-sm font-bold text-primary-fg hover:bg-primary/90"
        >
          Explorar NFTs
        </Link>
      </CartMessage>
    )
  } else {
    content = <CartContent cart={data} />
  }

  return (
    <div className={`max-md:px-1 ${data && data.items.length > 0 ? 'pb-[23rem] md:pb-0' : ''}`}>
      <div className="mt-8 grid grid-cols-[2.1875rem_1fr_2.1875rem] items-center md:hidden">
        <BackButton />
        <h1 className="text-center text-xl leading-4 font-bold text-fg">Carrinho de NFTs</h1>
      </div>

      <PageTrail current="Carrinho" />
      <h1 className="sr-only hidden md:block">Carrinho</h1>

      {content}
      <AlsoViewed cart={data} />
    </div>
  )
}

function CartContent({ cart }: { cart: Cart }) {
  return (
    <>
      <div className="mt-3 flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
        <CartTable items={cart.items} />
        <CartSummary cart={cart} variant="desktop" />
      </div>
      <div className="mt-3">
        <CartMobileList items={cart.items} />
      </div>
      <CartSummary cart={cart} variant="mobile" />
    </>
  )
}

/** "Colecionadores também viram": first catalog page without what is already in the cart. */
function AlsoViewed({ cart }: { cart: Cart | undefined }) {
  const { data, isPending, isError } = useNftList({})
  if (isError) return null
  const inCart = new Set(cart?.items.map((item) => item.nft.id))

  return (
    <NftShowcase
      title="Colecionadores também viram"
      listLabel="NFTs sugeridos"
      items={(data?.items ?? []).filter((nft) => !inCart.has(nft.id))}
      isPending={isPending}
    />
  )
}

function CartMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-6 flex min-h-72 flex-col items-center justify-center gap-4 rounded-[8px] bg-surface px-6 text-center md:mt-3">
      <h2 className="text-lg font-bold text-fg">{title}</h2>
      {children}
    </div>
  )
}

function CartSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando carrinho" className="mt-3">
      <div className="flex flex-col gap-5 md:hidden">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-[6.25rem] rounded-[14px]" />
        ))}
      </div>
      <div className="hidden gap-10 md:flex lg:justify-between">
        <div className="flex-1 space-y-3 lg:max-w-[48.875rem]">
          <Skeleton className="h-7 w-full" />
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-[4.375rem] rounded-none" />
          ))}
        </div>
        <Skeleton className="hidden h-96 w-[20.75rem] lg:block" />
      </div>
    </div>
  )
}

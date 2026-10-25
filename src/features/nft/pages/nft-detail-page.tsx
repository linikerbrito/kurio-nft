import { useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { catalogKeys, useNft } from '@/features/catalog/hooks/use-catalog'
import type { Nft } from '@/features/catalog/types/catalog'
import { NftDescription } from '@/features/nft/components/nft-description'
import { NftGallery } from '@/features/nft/components/nft-gallery'
import { NftMobileView } from '@/features/nft/components/nft-mobile-view'
import { NftPurchasePanel, type PurchaseState } from '@/features/nft/components/nft-purchase-panel'
import { RelatedNfts } from '@/features/nft/components/related-nfts'
import { ApiError } from '@/lib/http'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

const detailRoute = getRouteApi('/nft/$nftId')

export function NftDetailPage() {
  const { nftId } = detailRoute.useParams()
  const { data, isPending, isError, error, isFetching } = useNft(nftId)
  const queryClient = useQueryClient()

  if (isPending) return <NftDetailSkeleton />

  if (isError) {
    if (error instanceof ApiError && error.code === 'not_found') {
      return (
        <DetailMessage title="NFT não encontrado.">
          <p className="text-sm text-fg-muted">
            O endereço pode estar incorreto ou o NFT saiu do catálogo.
          </p>
          <Link
            to="/"
            hash="catalogo"
            className="text-sm font-semibold text-fg-accent hover:underline"
          >
            Voltar ao catálogo
          </Link>
        </DetailMessage>
      )
    }
    return (
      <DetailMessage title="Não foi possível carregar este NFT.">
        <p className="text-sm text-fg-muted">Verifique sua conexão e tente novamente.</p>
        <Button
          type="button"
          disabled={isFetching}
          onClick={() => void queryClient.refetchQueries({ queryKey: catalogKeys.detail(nftId) })}
        >
          {isFetching ? 'Tentando…' : 'Tentar novamente'}
        </Button>
      </DetailMessage>
    )
  }

  return <NftDetail key={data.id} nft={data} />
}

function NftDetail({ nft }: { nft: Nft }) {
  const search = detailRoute.useSearch()
  const navigate = detailRoute.useNavigate()
  const [requestedQuantity, setRequestedQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  /** The edition comes from the URL when it exists and is available, else the first available. */
  const edition =
    nft.editions.find((item) => item.id === search.edicao && item.available > 0) ??
    nft.editions.find((item) => item.available > 0)
  const quantity = Math.max(1, Math.min(requestedQuantity, edition?.available ?? 1))

  useEffect(() => {
    document.title = `${nft.name} · Kurio`
    return () => {
      document.title = 'Kurio'
    }
  }, [nft.name])

  const purchase: PurchaseState = {
    edition,
    onEditionChange: (editionId) =>
      void navigate({ search: { edicao: editionId }, replace: true, resetScroll: false }),
    quantity,
    onQuantityChange: setRequestedQuantity,
  }

  return (
    <div className="pb-[11.5rem] md:pb-0">
      <NftMobileView
        nft={nft}
        purchase={purchase}
        activeImage={activeImage}
        onImageChange={setActiveImage}
      />

      <div className="hidden md:block">
        <nav aria-label="Trilha" className="mt-8 text-[0.9375rem] leading-4 font-bold text-fg">
          <Link to="/" className="hover:text-fg-accent">
            Início
          </Link>
          <span aria-hidden="true"> / </span>
          <Link to="/" hash="catalogo" className="hover:text-fg-accent">
            Mercado
          </Link>
        </nav>
        <div className="mt-3 flex flex-col gap-8 lg:flex-row">
          <NftGallery
            images={nft.gallery}
            activeIndex={activeImage}
            onSelect={setActiveImage}
            nftName={nft.name}
          />
          <NftPurchasePanel nft={nft} purchase={purchase} />
        </div>
      </div>

      <NftDescription nft={nft} />
      <RelatedNfts collectionId={nft.collection.id} currentId={nft.id} />
    </div>
  )
}

function DetailMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      role="alert"
      className="mt-10 flex min-h-80 flex-col items-center justify-center gap-4 rounded-[8px] bg-surface px-6 text-center md:mt-8"
    >
      <h1 className="text-lg font-bold text-fg">{title}</h1>
      {children}
    </div>
  )
}

function NftDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando NFT">
      <div className="md:hidden">
        <Skeleton className="-mx-6 h-[31.625rem] rounded-none" />
        <Skeleton className="-mx-6 -mt-[7.125rem] h-60 rounded-t-[31px] rounded-b-none" />
      </div>
      {/* Reserves the height of the loaded page, so the footer does not jump when it arrives. */}
      <div className="hidden md:block md:min-h-[93rem]">
        <Skeleton className="mt-8 h-4 w-36" />
        <div className="mt-3 flex gap-8">
          <div className="flex gap-7">
            <div className="flex flex-col gap-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="size-[6.25rem] rounded-[8px]" />
              ))}
            </div>
            <Skeleton className="size-[27.75rem] rounded-[6px]" />
          </div>
          <div className="hidden flex-1 flex-col gap-6 lg:flex">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  )
}

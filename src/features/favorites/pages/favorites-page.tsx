import { useEffect, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { useFavorites, useToggleFavorite } from '@/features/favorites/hooks/use-favorites'
import { Button } from '@/shared/ui/button'

const gridClass = 'mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 md:gap-y-12'

/** "Lista de interesse": the NFTs the collector saved, newest first. */
export function FavoritesPage() {
  const favorites = useFavorites()
  const toggle = useToggleFavorite()

  useEffect(() => {
    document.title = 'Lista de interesse · Kurio'
    return () => {
      document.title = 'Kurio'
    }
  }, [])

  let content: ReactNode
  if (favorites.isPending) {
    content = (
      <div aria-busy="true" aria-label="Carregando favoritos" className={gridClass}>
        {Array.from({ length: 3 }, (_, index) => (
          <NftCardSkeleton key={index} />
        ))}
      </div>
    )
  } else if (favorites.isError) {
    content = (
      <StateMessage title="Não foi possível carregar seus favoritos.">
        <Button
          type="button"
          disabled={favorites.isFetching}
          onClick={() => void favorites.refetch()}
        >
          {favorites.isFetching ? 'Tentando…' : 'Tentar novamente'}
        </Button>
      </StateMessage>
    )
  } else if (favorites.data.items.length === 0) {
    content = (
      <StateMessage title="Você ainda não favoritou nenhum NFT.">
        <p className="text-sm text-fg-muted">Toque no coração de um NFT para guardá-lo aqui.</p>
        <Link
          to="/"
          hash="catalogo"
          className="inline-flex h-10 items-center rounded-[6px] bg-primary px-5 text-sm font-bold text-primary-fg hover:bg-primary/90"
        >
          Explorar NFTs
        </Link>
      </StateMessage>
    )
  } else {
    content = (
      <ul aria-label="NFTs favoritos" className={gridClass}>
        {favorites.data.items.map((nft) => (
          <li key={nft.id} className="flex flex-col gap-3">
            <NftCard nft={nft} />
            <button
              type="button"
              aria-label={`Remover ${nft.name} dos favoritos`}
              onClick={() => toggle.mutate({ nftId: nft.id, favorite: false })}
              className="self-start pl-2 text-sm font-bold text-fg-accent hover:underline md:pl-0"
            >
              Remover
            </button>
          </li>
        ))}
      </ul>
    )
  }

  return (
    <section aria-labelledby="favorites-title">
      <h1 id="favorites-title" className="text-[0.9375rem] leading-4 font-bold text-fg">
        Lista de interesse
      </h1>
      {favorites.data && favorites.data.items.length > 0 && (
        <p className="mt-2 text-sm text-fg-muted" aria-live="polite">
          {favorites.data.items.length}{' '}
          {favorites.data.items.length === 1 ? 'NFT salvo' : 'NFTs salvos'}
        </p>
      )}
      {content}
    </section>
  )
}

function StateMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-8 flex min-h-60 flex-col items-center justify-center gap-4 rounded-[8px] bg-surface px-6 text-center">
      <h2 className="text-lg font-bold text-fg">{title}</h2>
      {children}
    </div>
  )
}

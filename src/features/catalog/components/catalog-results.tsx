import type { ReactNode } from 'react'
import { useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CatalogPagination } from '@/features/catalog/components/catalog-pagination'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/nft-card'
import { catalogKeys, NFT_PAGE_SIZE } from '@/features/catalog/hooks/use-catalog'
import { useCatalogSearch } from '@/features/catalog/hooks/use-catalog-search'
import type { NftListResponse } from '@/features/catalog/types/catalog'
import { Button } from '@/shared/ui/button'

/**
 * Phones: two staggered columns (the right one sits 32px lower, as in the mobile design).
 * Tablet and desktop: the regular three-column grid.
 */
const gridClass =
  'mt-4 grid grid-cols-2 gap-x-4 gap-y-6 pb-8 *:even:translate-y-8 md:mt-8 md:grid-cols-3 md:gap-x-6 md:gap-y-14 md:pb-0 md:*:even:translate-y-0 lg:gap-x-[2.125rem] lg:gap-y-[4.5rem]'

interface CatalogResultsProps {
  query: UseQueryResult<NftListResponse>
}

function StatusMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mt-6 flex min-h-80 flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
      <p className="text-base font-semibold text-fg">{title}</p>
      {children}
    </div>
  )
}

export function CatalogResults({ query }: CatalogResultsProps) {
  const queryClient = useQueryClient()
  const { clearFilters } = useCatalogSearch()
  const { data, isPending, isError, isPlaceholderData, isFetching } = query

  /** Retries every catalog query on screen, so the hero and spotlight recover too. */
  function retry() {
    void queryClient.refetchQueries({ queryKey: catalogKeys.all, type: 'active' })
  }

  let announcement = ''
  if (isFetching) announcement = 'Carregando NFTs…'
  else if (data)
    announcement = `${data.total} ${data.total === 1 ? 'NFT encontrado' : 'NFTs encontrados'}`

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {isPending && (
        <div aria-hidden="true" className={gridClass}>
          {Array.from({ length: NFT_PAGE_SIZE }, (_, index) => (
            <NftCardSkeleton key={index} />
          ))}
        </div>
      )}

      {isError && !data && (
        <StatusMessage title="Não foi possível carregar os NFTs.">
          <p className="text-sm text-fg-muted">Verifique sua conexão e tente novamente.</p>
          <Button type="button" onClick={retry} disabled={isFetching}>
            {isFetching ? 'Tentando…' : 'Tentar novamente'}
          </Button>
        </StatusMessage>
      )}

      {data && data.total === 0 && (
        <StatusMessage title="Nenhum NFT encontrado com esses filtros.">
          <Button type="button" variant="outline" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </StatusMessage>
      )}

      {data && data.total > 0 && data.items.length === 0 && (
        <StatusMessage title="Esta página não existe.">
          <Link
            from="/"
            to="/"
            search={(prev) => ({ ...prev, page: undefined })}
            hash="catalogo"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Voltar para a primeira página
          </Link>
        </StatusMessage>
      )}

      {data && data.items.length > 0 && (
        <>
          <ul
            aria-busy={isPlaceholderData}
            className={`${gridClass} transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}
          >
            {data.items.map((nft, index) => (
              <li key={nft.id}>
                <NftCard nft={nft} eager={index < 3} />
              </li>
            ))}
          </ul>
          <CatalogPagination page={data.page} totalPages={data.totalPages} />
        </>
      )}
    </>
  )
}

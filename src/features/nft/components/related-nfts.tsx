import { NftShowcase } from '@/features/catalog/components/nft-showcase'
import { useCollectionNfts } from '@/features/catalog/hooks/use-catalog'

interface RelatedNftsProps {
  collectionId: string
  currentId: string
}

/** "Mais desta coleção": other NFTs of the same collection, without the current one. */
export function RelatedNfts({ collectionId, currentId }: RelatedNftsProps) {
  const { data, isPending, isError } = useCollectionNfts(collectionId)
  if (isError) return null

  return (
    <NftShowcase
      title="Mais desta coleção"
      listLabel="NFTs da mesma coleção"
      items={(data?.items ?? []).filter((nft) => nft.id !== currentId)}
      isPending={isPending}
    />
  )
}

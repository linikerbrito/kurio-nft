import { Tabs } from 'radix-ui'
import { networkLabels } from '@/features/nft/network-labels'
import type { Nft } from '@/features/catalog/types/catalog'

const triggerClass =
  'relative pb-3 text-[1.0625rem] leading-4 text-fg transition-colors hover:text-fg-accent data-[state=active]:font-bold data-[state=active]:text-fg-accent data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:-bottom-px data-[state=active]:after:h-[3px] data-[state=active]:after:bg-primary'

const labelClass = 'text-sm leading-6 font-bold text-fg'
const textClass = 'text-sm leading-6 text-fg-muted'

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/** "Detalhes do NFT" and "Avaliações" tabs below the purchase area. */
export function NftDescription({ nft }: { nft: Nft }) {
  const network = networkLabels[nft.network]

  return (
    <Tabs.Root defaultValue="details" className="mt-12 md:mt-24">
      <Tabs.List
        aria-label="Informações do NFT"
        className="flex flex-wrap gap-x-8 gap-y-3 border-b border-line"
      >
        <Tabs.Trigger value="details" className={`${triggerClass} shrink-0`}>
          Detalhes do NFT
        </Tabs.Trigger>
        <Tabs.Trigger value="reviews" className={`${triggerClass} shrink-0`}>
          Avaliações de colecionadores ({nft.rating.count})
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="details" className="mt-3 space-y-3 outline-none">
        <div className={textClass}>
          {nft.story.map((paragraph, index) => (
            <p key={index} className={index > 0 ? 'mt-6' : undefined}>
              {paragraph}
            </p>
          ))}
        </div>
        <div>
          <h2 className={labelClass}>Rede:</h2>
          <p className={textClass}>
            Cunhado na {network} com procedência imutável e metadados armazenados no IPFS.
          </p>
        </div>
        <div>
          <h2 className={labelClass}>Contrato:</h2>
          <p className={textClass}>
            {shortAddress(nft.contract.address)} • Contrato inteligente {nft.contract.standard}{' '}
            verificado.
          </p>
        </div>
        <div>
          <h2 className={labelClass}>Direitos autorais:</h2>
          <p className={textClass}>
            Direitos autorais do criador: {nft.royaltyPercent}% nas vendas secundárias, pagos
            automaticamente pelos mercados compatíveis.
          </p>
        </div>
      </Tabs.Content>

      <Tabs.Content value="reviews" className="mt-3 outline-none">
        <p className={textClass}>
          Nota média {nft.rating.average.toFixed(1).replace('.', ',')} de 5, com base em{' '}
          {nft.rating.count} avaliações de colecionadores.
        </p>
        <p className={`${textClass} mt-2`}>
          Os comentários individuais não fazem parte desta demonstração.
        </p>
      </Tabs.Content>
    </Tabs.Root>
  )
}

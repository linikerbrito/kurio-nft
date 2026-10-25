import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useProfile } from '@/features/profile/hooks/use-profile'
import { WalletForm } from '@/features/wallets/components/wallet-form'
import { useWallets } from '@/features/wallets/hooks/use-wallets'
import type { Wallet, WalletFormValues } from '@/features/wallets/types/wallets'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

const addButtonClass = 'text-[0.9375rem] leading-4 font-bold text-fg-accent hover:underline'

/** Owner data copied by "Igual à carteira principal" (the address stays the user's choice). */
function ownerValues(wallet: Wallet): Partial<WalletFormValues> {
  const { displayName, profileName, email, referralCode, ensHandle, network, provider } = wallet
  return { displayName, profileName, email, referralCode, ensHandle, network, provider }
}

export function WalletsPage() {
  const wallets = useWallets()

  useEffect(() => {
    document.title = 'Carteiras · Kurio'
    return () => {
      document.title = 'Kurio'
    }
  }, [])

  if (wallets.isPending) return <WalletsSkeleton />
  if (wallets.isError) {
    return (
      <div className="flex min-h-60 flex-col items-center justify-center gap-4 rounded-[8px] bg-surface text-center">
        <h1 className="font-bold text-fg">Não foi possível carregar suas carteiras.</h1>
        <Button type="button" disabled={wallets.isFetching} onClick={() => void wallets.refetch()}>
          {wallets.isFetching ? 'Tentando…' : 'Tentar novamente'}
        </Button>
      </div>
    )
  }

  const primary = wallets.data.find((wallet) => wallet.kind === 'primary')
  const secondary = wallets.data.find((wallet) => wallet.kind === 'secondary')

  return (
    <div className="space-y-12">
      <h1 className="sr-only">Carteiras</h1>
      <PrimaryWallet wallet={primary} />
      <SecondaryWallet wallet={secondary} primary={primary} />
    </div>
  )
}

function SectionHeader({
  id,
  title,
  description,
  actions,
}: {
  id: string
  title: string
  description: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div>
        <h2 id={id} className="text-lg leading-5 font-bold text-fg">
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-fg-muted">{description}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

function PrimaryWallet({ wallet }: { wallet: Wallet | undefined }) {
  const profile = useProfile()
  const [adding, setAdding] = useState(false)
  const open = wallet !== undefined || adding

  return (
    <section aria-labelledby="primary-wallet-title">
      <SectionHeader
        id="primary-wallet-title"
        title="Carteira principal"
        description="Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados."
        actions={
          !open && (
            <button type="button" className={addButtonClass} onClick={() => setAdding(true)}>
              Adicionar
            </button>
          )
        }
      />
      {open ? (
        <WalletForm
          kind="primary"
          wallet={wallet}
          defaults={
            profile.data && {
              displayName: profile.data.displayName,
              email: profile.data.email,
              ensHandle: profile.data.ensName,
              label: profile.data.walletNickname,
            }
          }
        />
      ) : (
        <p className="mt-6 text-sm text-fg-muted">
          Você ainda não adicionou uma carteira principal.
        </p>
      )}
    </section>
  )
}

function SecondaryWallet({
  wallet,
  primary,
}: {
  wallet: Wallet | undefined
  primary: Wallet | undefined
}) {
  const [adding, setAdding] = useState(false)
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const open = wallet !== undefined || adding
  const copyFrom = useMemo(
    () => (sameAsPrimary && primary ? ownerValues(primary) : undefined),
    [sameAsPrimary, primary],
  )

  return (
    <section aria-labelledby="secondary-wallet-title">
      <SectionHeader
        id="secondary-wallet-title"
        title="Carteira secundária"
        description={
          open
            ? 'Use outra carteira para separar coleções ou pagar em outra rede.'
            : 'Você ainda não adicionou uma carteira secundária.'
        }
        actions={
          !wallet && (
            <>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-fg has-disabled:cursor-not-allowed has-disabled:opacity-50">
                <input
                  type="checkbox"
                  checked={sameAsPrimary}
                  disabled={!primary}
                  onChange={(event) => {
                    setSameAsPrimary(event.target.checked)
                    if (event.target.checked) setAdding(true)
                  }}
                  className="size-[0.9375rem] shrink-0 cursor-pointer appearance-none rounded-full border border-primary checked:bg-primary checked:shadow-[inset_0_0_0_3px_var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
                Igual à carteira principal
              </label>
              {!open && (
                <button type="button" className={addButtonClass} onClick={() => setAdding(true)}>
                  Adicionar
                </button>
              )}
            </>
          )
        }
      />
      {open && <WalletForm kind="secondary" wallet={wallet} copyFrom={copyFrom} />}
    </section>
  )
}

function WalletsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando carteiras">
      <Skeleton className="h-10 w-72" />
      <div className="mt-10 grid gap-x-7 gap-y-[1.6875rem] md:grid-cols-2">
        {Array.from({ length: 10 }, (_, index) => (
          <Skeleton key={index} className="h-[4.25rem]" />
        ))}
      </div>
    </div>
  )
}

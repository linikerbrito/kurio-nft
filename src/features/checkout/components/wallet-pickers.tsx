import type { ComponentProps } from 'react'
import { Link } from '@tanstack/react-router'
import { networkDescription, shortAddress } from '@/features/wallets/format'
import {
  walletProviderIds,
  walletProviderLabels,
  type Wallet,
  type WalletProvider,
} from '@/features/wallets/types/wallets'

/** Radio drawn as in the design: orange ring, filled dot when checked. */
export const radioClass =
  'size-[0.9375rem] shrink-0 cursor-pointer appearance-none rounded-full border border-primary checked:bg-primary checked:shadow-[inset_0_0_0_3px_var(--color-surface)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

const providerInitials: Record<WalletProvider, string> = {
  walletconnect: 'W',
  metamask: 'M',
  coinbase: 'C',
}

interface ProviderPickerProps {
  value: string
  onChange: (provider: WalletProvider) => void
  error?: string
  variant: 'desktop' | 'mobile'
  inputProps?: Omit<ComponentProps<'input'>, 'type' | 'value' | 'checked' | 'onChange'>
}

/** "Carteira e rede": the wallet app that signs the payment. */
export function ProviderPicker({
  value,
  onChange,
  error,
  variant,
  inputProps,
}: ProviderPickerProps) {
  const mobile = variant === 'mobile'
  const errorId = 'checkout-provider-error'

  return (
    <fieldset aria-describedby={error ? errorId : undefined} className="min-w-0">
      <legend
        className={`text-base leading-4 font-bold text-fg ${mobile ? 'mb-4' : 'mb-7 w-full text-center'}`}
      >
        Carteira e rede
      </legend>
      <div className={`flex flex-col ${mobile ? 'gap-5' : 'gap-4'}`}>
        {walletProviderIds.map((provider) => {
          const checked = value === provider
          const input = (
            <input
              type="radio"
              name="provider"
              value={provider}
              checked={checked}
              onChange={() => onChange(provider)}
              className={radioClass}
              {...inputProps}
            />
          )
          return mobile ? (
            <label
              key={provider}
              className="flex h-16 cursor-pointer items-center gap-3 rounded-[14px] bg-surface px-4"
            >
              <span
                aria-hidden="true"
                className="flex size-10 items-center justify-center rounded-full border border-line bg-surface-raised text-sm font-bold text-fg-accent"
              >
                {providerInitials[provider]}
              </span>
              <span className="flex-1 text-sm text-fg">{walletProviderLabels[provider]}</span>
              {input}
            </label>
          ) : (
            <label
              key={provider}
              className={`flex h-[2.8125rem] cursor-pointer items-center gap-4 border px-5 text-[0.9375rem] text-fg transition-colors ${
                checked ? 'border-fg' : 'border-line hover:border-primary/60'
              }`}
            >
              {input}
              {walletProviderLabels[provider]}
              {provider === 'walletconnect' && (
                <span
                  aria-hidden="true"
                  className="ml-auto rounded-[6px] border border-line-soft bg-surface-warm px-1.5 py-1 text-[0.5rem] leading-none font-bold whitespace-pre text-fg-accent"
                >
                  {'METAMASK  •  WALLETCONNECT  •  COINBASE'}
                </span>
              )}
            </label>
          )
        })}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-3 text-sm text-required">
          {error}
        </p>
      )}
    </fieldset>
  )
}

interface SavedWalletPickerProps {
  wallets: Wallet[]
  value: string
  onChange: (walletId: string) => void
  error?: string
}

/** Mobile "Carteira conectada": the wallets saved in the account. */
export function SavedWalletPicker({ wallets, value, onChange, error }: SavedWalletPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-labelledby="checkout-wallets-title"
      aria-describedby={error ? 'checkout-wallet-error' : undefined}
      className="min-w-0"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="checkout-wallets-title" className="text-base leading-4 font-bold text-fg">
          Carteira conectada
        </h2>
        <Link
          to="/perfil/carteiras"
          className="text-sm leading-4 font-bold text-fg-accent hover:underline"
        >
          Trocar carteira
        </Link>
      </div>
      <div className="flex flex-col gap-5">
        {wallets.map((wallet) => (
          <div key={wallet.id} className="relative">
            <label className="grid cursor-pointer grid-cols-[0.9375rem_1fr] items-center gap-x-5 gap-y-1.5 rounded-[14px] bg-surface py-5 pr-12 pl-5 text-base leading-4 font-bold text-fg">
              <input
                type="radio"
                name="walletId"
                value={wallet.id}
                checked={value === wallet.id}
                onChange={() => onChange(wallet.id)}
                className={`${radioClass} row-span-3`}
              />
              {wallet.label}
              <span className="col-start-2 truncate text-sm leading-4 font-normal text-fg-muted">
                {wallet.ensName ?? shortAddress(wallet.address)}
              </span>
              <span className="col-start-2 text-sm leading-4 font-normal text-fg-muted">
                {networkDescription(wallet.network)}
              </span>
            </label>
            <Link
              to="/perfil/carteiras"
              aria-label={`Gerenciar a carteira ${wallet.label}`}
              className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 flex-col items-center justify-center gap-[3px] rounded-full hover:bg-surface-raised"
            >
              {[0, 1, 2].map((dot) => (
                <span
                  key={dot}
                  aria-hidden="true"
                  className="size-[3px] rounded-full bg-fg-muted"
                />
              ))}
            </Link>
          </div>
        ))}
      </div>
      {error && (
        <p id="checkout-wallet-error" role="alert" className="mt-3 text-sm text-required">
          {error}
        </p>
      )}
    </div>
  )
}

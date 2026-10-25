import type { UseFormReturn } from 'react-hook-form'
import { networkIds, type Network } from '@/features/catalog/types/catalog'
import { SelectField, TextField } from '@/shared/components/form-fields'
import { selectSavedWallet } from '@/features/checkout/select-saved-wallet'
import type { CheckoutFormValues } from '@/features/checkout/types/checkout'
import { networkLabels } from '@/features/nft/network-labels'
import { shortAddress } from '@/features/wallets/format'
import type { Wallet } from '@/features/wallets/types/wallets'

interface WalletFieldProps {
  form: UseFormReturn<CheckoutFormValues>
  variant: 'desktop' | 'mobile'
}

export function NetworkField({ form, variant }: WalletFieldProps) {
  return (
    <SelectField
      variant={variant}
      label="Rede"
      required
      error={form.formState.errors.network?.message}
      {...form.register('network')}
    >
      <option value="" disabled className="bg-surface text-fg">
        Selecione uma rede
      </option>
      {networkIds.map((network: Network) => (
        <option key={network} value={network} className="bg-surface text-fg">
          {networkLabels[network]}
        </option>
      ))}
    </SelectField>
  )
}

/** Shows the saved wallet's address, or takes a typed one when "Usar outra carteira?" is on. */
export function AddressField({ form, variant, wallets }: WalletFieldProps & { wallets: Wallet[] }) {
  const useOther = form.watch('useOtherWallet')
  const walletId = form.watch('walletId')
  const saved = wallets.find((wallet) => wallet.id === walletId)

  if (!useOther) {
    return (
      <TextField
        key="saved-address"
        variant={variant}
        label="Endereço da carteira"
        required
        readOnly
        placeholder="Endereço 0x da carteira"
        value={saved?.address ?? ''}
        title={saved?.address}
      />
    )
  }
  return (
    <TextField
      key="other-address"
      variant={variant}
      label="Endereço da carteira"
      required
      placeholder="Endereço 0x da carteira"
      autoCapitalize="none"
      spellCheck={false}
      error={form.formState.errors.address?.message}
      {...form.register('address')}
    />
  )
}

export function SavedWalletField({
  form,
  variant,
  wallets,
}: WalletFieldProps & { wallets: Wallet[] }) {
  const useOther = form.watch('useOtherWallet')
  const field = form.register('walletId')
  return (
    <SelectField
      variant={variant}
      label="Tipo de carteira"
      required={!useOther}
      disabled={useOther}
      error={form.formState.errors.walletId?.message}
      {...field}
      onChange={(event) => selectSavedWallet(form, wallets, event.target.value)}
    >
      <option value="" disabled className="bg-surface text-fg">
        Selecione uma carteira
      </option>
      {wallets.map((wallet) => (
        <option key={wallet.id} value={wallet.id} className="bg-surface text-fg">
          {wallet.label} · {wallet.ensName ?? shortAddress(wallet.address)}
        </option>
      ))}
    </SelectField>
  )
}

/** "Usar outra carteira?": a toggle drawn as the round control of the design. */
export function OtherWalletToggle({ form }: Pick<WalletFieldProps, 'form'>) {
  return (
    <label className="flex w-fit cursor-pointer items-center gap-2 text-[0.9375rem] text-fg">
      <input
        type="checkbox"
        className="size-[0.9375rem] shrink-0 cursor-pointer appearance-none rounded-full border border-primary checked:bg-primary checked:shadow-[inset_0_0_0_3px_var(--color-bg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        {...form.register('useOtherWallet')}
      />
      Usar outra carteira?
    </label>
  )
}

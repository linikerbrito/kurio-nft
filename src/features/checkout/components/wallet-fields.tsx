import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
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

/** Loading state of the saved wallets, so the fields can explain an empty list. */
export type WalletsState = 'pending' | 'error' | 'ready'

/**
 * Starts with the selected saved wallet's address and stays editable: typing another address
 * switches to "Usar outra carteira?" on its own.
 */
export function AddressField({ form, variant, wallets }: WalletFieldProps & { wallets: Wallet[] }) {
  const registration = form.register('address')
  const useOther = form.watch('useOtherWallet')
  const walletId = form.watch('walletId')
  const saved = wallets.find((wallet) => wallet.id === walletId)

  return (
    <TextField
      variant={variant}
      label="Endereço da carteira"
      required
      placeholder="Endereço 0x da carteira"
      autoCapitalize="none"
      spellCheck={false}
      {...registration}
      onChange={(event) => {
        if (!useOther) form.setValue('useOtherWallet', true)
        void registration.onChange(event)
      }}
      hint={!useOther && saved ? 'Da carteira salva; digite outro para trocar.' : undefined}
      error={form.formState.errors.address?.message}
    />
  )
}

export function SavedWalletField({
  form,
  variant,
  wallets,
  state,
}: WalletFieldProps & { wallets: Wallet[]; state: WalletsState }) {
  const useOther = form.watch('useOtherWallet')
  const field = form.register('walletId')
  const empty = state === 'ready' && wallets.length === 0

  let placeholder = 'Selecione uma carteira'
  if (state === 'pending') placeholder = 'Carregando carteiras…'
  else if (state === 'error') placeholder = 'Carteiras indisponíveis'
  else if (empty) placeholder = 'Nenhuma carteira cadastrada'

  let hint: ReactNode
  if (state === 'error') {
    hint = 'Não foi possível carregar suas carteiras. Informe o endereço em "Usar outra carteira?".'
  } else if (empty) {
    hint = (
      <>
        Você ainda não tem carteiras salvas.{' '}
        <Link to="/perfil/carteiras" className="font-bold text-fg-accent hover:underline">
          Cadastrar carteira
        </Link>{' '}
        ou informe o endereço acima.
      </>
    )
  }

  return (
    <SelectField
      variant={variant}
      label="Tipo de carteira"
      required={!useOther}
      disabled={useOther || state !== 'ready' || empty}
      hint={hint}
      error={form.formState.errors.walletId?.message}
      {...field}
      onChange={(event) => selectSavedWallet(form, wallets, event.target.value)}
    >
      <option value="" disabled className="bg-surface text-fg">
        {placeholder}
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

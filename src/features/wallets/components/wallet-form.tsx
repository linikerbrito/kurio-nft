import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { networkIds } from '@/features/catalog/types/catalog'
import { networkLabels } from '@/features/nft/network-labels'
import { useSaveWallet } from '@/features/wallets/hooks/use-wallets'
import {
  walletFormSchema,
  walletProviderIds,
  walletProviderLabels,
  type Wallet,
  type WalletFormValues,
  type WalletKind,
} from '@/features/wallets/types/wallets'
import { applyApiError } from '@/lib/form-errors'
import { EnsField, SelectField, TextField } from '@/shared/components/form-fields'

const emptyValues: WalletFormValues = {
  label: '',
  displayName: '',
  profileName: '',
  network: '',
  address: '',
  ensName: '',
  provider: '',
  referralCode: '',
  email: '',
  ensHandle: '',
}

function walletToValues(wallet: Wallet): WalletFormValues {
  const { label, displayName, profileName, network, address, provider, referralCode, email } =
    wallet
  return {
    label,
    displayName,
    profileName,
    network,
    address,
    ensName: wallet.ensName ?? '',
    provider,
    referralCode,
    email,
    ensHandle: wallet.ensHandle,
  }
}

interface WalletFormProps {
  kind: WalletKind
  wallet?: Wallet
  /** Values a new wallet starts with (from the profile). */
  defaults?: Partial<WalletFormValues>
  /** Values copied into a new wallet when they change ("Igual à carteira principal"). */
  copyFrom?: Partial<WalletFormValues>
}

const kindNames: Record<WalletKind, string> = {
  primary: 'principal',
  secondary: 'secundária',
}

/** Form of one wallet, with the fields of the "Carteiras" frame. */
export function WalletForm({ kind, wallet, defaults, copyFrom }: WalletFormProps) {
  const save = useSaveWallet()
  const form = useForm<WalletFormValues>({
    resolver: zodResolver(walletFormSchema),
    defaultValues: wallet ? walletToValues(wallet) : { ...emptyValues, ...defaults },
  })
  const { errors } = form.formState

  // "Igual à carteira principal" fills a wallet that is still being created.
  useEffect(() => {
    if (wallet || !copyFrom) return
    for (const [field, value] of Object.entries(copyFrom)) {
      const key = field as keyof WalletFormValues
      if (value !== undefined) form.setValue(key, value, { shouldDirty: true })
    }
  }, [wallet, copyFrom, form])

  const onSubmit = form.handleSubmit((values) => {
    const { network, provider, ensName, ...rest } = values
    if (!network || !provider) return
    save.mutate(
      { wallet, kind, input: { ...rest, network, provider, ensName: ensName || null } },
      {
        onSuccess: (saved) => {
          form.reset(walletToValues(saved))
          toast.success(`Carteira ${kindNames[kind]} salva.`)
        },
        onError: (error) => applyApiError(form, error),
      },
    )
  })

  return (
    <form
      noValidate
      aria-label={`Dados da carteira ${kindNames[kind]}`}
      onSubmit={(event) => void onSubmit(event)}
      className="mt-10"
    >
      <div className="grid gap-x-7 gap-y-[1.6875rem] md:grid-cols-2">
        <TextField
          variant="desktop"
          label="Nome de exibição"
          required
          error={errors.displayName?.message}
          {...form.register('displayName')}
        />
        <TextField
          variant="desktop"
          label="Apelido da carteira"
          required
          error={errors.label?.message}
          {...form.register('label')}
        />
        <SelectField
          variant="desktop"
          label="Rede"
          required
          error={errors.network?.message}
          {...form.register('network')}
        >
          <option value="" disabled className="bg-surface text-fg">
            Selecione uma rede
          </option>
          {networkIds.map((network) => (
            <option key={network} value={network} className="bg-surface text-fg">
              {networkLabels[network]}
            </option>
          ))}
        </SelectField>
        <TextField
          variant="desktop"
          label="Nome do perfil"
          required
          error={errors.profileName?.message}
          {...form.register('profileName')}
        />
        <TextField
          variant="desktop"
          label="Endereço da carteira"
          required
          placeholder="Endereço 0x da carteira"
          autoCapitalize="none"
          spellCheck={false}
          error={errors.address?.message}
          {...form.register('address')}
        />
        <div className="self-end">
          <TextField
            variant="desktop"
            label="ENS ou carteira secundária (opcional)"
            hiddenLabel
            placeholder="ENS ou carteira secundária (opcional)"
            autoCapitalize="none"
            spellCheck={false}
            error={errors.ensName?.message}
            {...form.register('ensName')}
          />
        </div>
        <SelectField
          variant="desktop"
          label="Tipo de carteira"
          required
          error={errors.provider?.message}
          {...form.register('provider')}
        >
          <option value="" disabled className="bg-surface text-fg">
            Selecione uma carteira
          </option>
          {walletProviderIds.map((provider) => (
            <option key={provider} value={provider} className="bg-surface text-fg">
              {walletProviderLabels[provider]}
            </option>
          ))}
        </SelectField>
        <TextField
          variant="desktop"
          label="Código de indicação"
          required
          autoCapitalize="characters"
          error={errors.referralCode?.message}
          {...form.register('referralCode')}
        />
        <TextField
          variant="desktop"
          label="E-mail"
          required
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <EnsField
          variant="desktop"
          label="Nome ENS"
          required
          error={errors.ensHandle?.message}
          {...form.register('ensHandle')}
        />
      </div>
      {errors.root?.message && (
        <p role="alert" className="mt-6 text-sm text-required">
          {errors.root.message}
        </p>
      )}
      <button
        type="submit"
        disabled={save.isPending}
        aria-busy={save.isPending}
        className="mt-8 h-10 rounded-[3px] bg-primary px-3 text-sm font-bold text-primary-fg transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {save.isPending ? 'Salvando…' : 'Salvar carteira'}
      </button>
    </form>
  )
}

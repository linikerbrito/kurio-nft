import type { UseFormReturn } from 'react-hook-form'
import { TextAreaField, TextField } from '@/features/checkout/components/checkout-fields'
import type { CheckoutFormValues } from '@/features/checkout/types/checkout'

interface FieldProps {
  form: UseFormReturn<CheckoutFormValues>
  variant: 'desktop' | 'mobile'
}

export function DisplayNameField({ form, variant }: FieldProps) {
  return (
    <TextField
      variant={variant}
      label="Nome de exibição"
      required
      autoComplete="name"
      error={form.formState.errors.displayName?.message}
      {...form.register('displayName')}
    />
  )
}

export function UsernameField({ form, variant }: FieldProps) {
  return (
    <TextField
      variant={variant}
      label="Nome de usuário"
      required
      autoComplete="username"
      autoCapitalize="none"
      error={form.formState.errors.username?.message}
      {...form.register('username')}
    />
  )
}

export function ProfileNameField({ form, variant }: FieldProps) {
  return (
    <TextField
      variant={variant}
      label="Nome do perfil"
      required
      error={form.formState.errors.profileName?.message}
      {...form.register('profileName')}
    />
  )
}

export function EmailField({ form, variant }: FieldProps) {
  return (
    <TextField
      variant={variant}
      label="E-mail"
      required
      type="email"
      autoComplete="email"
      error={form.formState.errors.email?.message}
      {...form.register('email')}
    />
  )
}

export function ReferralCodeField({ form, variant }: FieldProps) {
  return (
    <TextField
      variant={variant}
      label="Código de indicação"
      required
      autoCapitalize="characters"
      error={form.formState.errors.referralCode?.message}
      {...form.register('referralCode')}
    />
  )
}

/** The design shows the ".eth" suffix next to the name; only `.eth` names are supported. */
export function EnsNameField({ form, variant }: FieldProps) {
  const error = form.formState.errors.ensName?.message
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="checkout-ens" className="text-[0.9375rem] leading-4 text-fg">
        Nome ENS
        <span aria-hidden="true" className="ml-0.5 text-required">
          *
        </span>
      </label>
      <div
        className={`flex items-center border transition-colors focus-within:border-primary ${
          error ? 'border-required' : variant === 'desktop' ? 'border-primary/40' : 'border-line'
        } ${variant === 'desktop' ? 'h-10 rounded-[2px]' : 'h-[3.125rem] rounded-[10px]'}`}
      >
        <input
          id="checkout-ens"
          aria-required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'checkout-ens-error' : undefined}
          autoCapitalize="none"
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-fg outline-none placeholder:text-fg-subtle"
          placeholder="seunome"
          {...form.register('ensName')}
        />
        <span className="border-l border-primary/40 px-3 text-base text-fg">.eth</span>
      </div>
      {error && (
        <p id="checkout-ens-error" className="text-xs text-required">
          {error}
        </p>
      )}
    </div>
  )
}

export function SecondaryWalletField({
  form,
  variant,
  hiddenLabel = false,
}: FieldProps & { hiddenLabel?: boolean }) {
  return (
    <TextField
      variant={variant}
      label="ENS ou carteira secundária (opcional)"
      hiddenLabel={hiddenLabel}
      placeholder={hiddenLabel ? 'ENS ou carteira secundária (opcional)' : undefined}
      autoCapitalize="none"
      error={form.formState.errors.secondaryWallet?.message}
      {...form.register('secondaryWallet')}
    />
  )
}

export function NoteField({ form, variant }: FieldProps) {
  return (
    <TextAreaField
      variant={variant}
      label="Observação do colecionador (opcional)"
      className={variant === 'desktop' ? 'max-w-[21.875rem]' : ''}
      error={form.formState.errors.note?.message}
      {...form.register('note')}
    />
  )
}

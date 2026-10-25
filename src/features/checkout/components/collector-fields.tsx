import type { UseFormReturn } from 'react-hook-form'
import { EnsField, TextAreaField, TextField } from '@/shared/components/form-fields'
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

export function EnsNameField({ form, variant }: FieldProps) {
  return (
    <EnsField
      variant={variant}
      label="Nome ENS"
      required
      placeholder="seunome"
      error={form.formState.errors.ensName?.message}
      {...form.register('ensName')}
    />
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

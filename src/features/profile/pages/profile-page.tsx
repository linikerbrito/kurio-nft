import { useEffect, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AvatarField } from '@/features/profile/components/avatar-field'
import {
  useChangePassword,
  useProfile,
  useUpdateProfile,
} from '@/features/profile/hooks/use-profile'
import {
  profileFormSchema,
  type Profile,
  type ProfileFormValues,
} from '@/features/profile/types/profile'
import { applyApiError } from '@/lib/form-errors'
import { EnsField, TextField } from '@/shared/components/form-fields'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

export function ProfilePage() {
  const profile = useProfile()

  useEffect(() => {
    document.title = 'Meu perfil · Kurio'
    return () => {
      document.title = 'Kurio'
    }
  }, [])

  let content: ReactNode
  if (profile.isPending) {
    content = <ProfileSkeleton />
  } else if (profile.isError) {
    content = (
      <div className="flex min-h-60 flex-col items-center justify-center gap-4 rounded-[8px] bg-surface text-center">
        <p className="font-bold text-fg">Não foi possível carregar seu perfil.</p>
        <Button type="button" disabled={profile.isFetching} onClick={() => void profile.refetch()}>
          {profile.isFetching ? 'Tentando…' : 'Tentar novamente'}
        </Button>
      </div>
    )
  } else {
    content = <ProfileForm profile={profile.data} />
  }

  return (
    <section aria-labelledby="profile-title">
      <h1 id="profile-title" className="text-[0.9375rem] leading-4 font-bold text-fg">
        Perfil do colecionador
      </h1>
      {content}
    </section>
  )
}

const emptyPasswords = { currentPassword: '', newPassword: '', confirmPassword: '' }

function ProfileForm({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { ...profile, ...emptyPasswords },
  })
  const { errors } = form.formState
  const saving = updateProfile.isPending || changePassword.isPending

  const onSubmit = form.handleSubmit(async (values) => {
    const { currentPassword, newPassword, displayName, username, email, ensName, walletNickname } =
      values
    try {
      const saved = await updateProfile.mutateAsync({
        displayName,
        username,
        email,
        ensName,
        walletNickname,
      })
      if (currentPassword) await changePassword.mutateAsync({ currentPassword, newPassword })
      form.reset({ ...saved, ...emptyPasswords })
      toast.success(currentPassword ? 'Perfil e senha atualizados.' : 'Perfil atualizado.')
    } catch (error) {
      applyApiError(form, error)
    }
  })

  return (
    <form noValidate onSubmit={(event) => void onSubmit(event)} className="mt-[2.375rem]">
      <div className="grid gap-x-7 gap-y-[2.375rem] md:grid-cols-2">
        <TextField
          variant="desktop"
          label="Nome de exibição"
          required
          autoComplete="name"
          error={errors.displayName?.message}
          {...form.register('displayName')}
        />
        <TextField
          variant="desktop"
          label="Nome de usuário"
          required
          autoComplete="username"
          autoCapitalize="none"
          error={errors.username?.message}
          {...form.register('username')}
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
          error={errors.ensName?.message}
          {...form.register('ensName')}
        />
        <TextField
          variant="desktop"
          label="Apelido da carteira"
          required
          error={errors.walletNickname?.message}
          {...form.register('walletNickname')}
        />
        <AvatarField avatarUrl={profile.avatarUrl} />
      </div>

      <fieldset className="mt-10 md:max-w-[26.0625rem]">
        <legend className="text-[0.9375rem] leading-4 font-bold text-fg">Alterar senha</legend>
        <p className="mt-2 text-xs text-fg-muted">
          Preencha só se quiser trocar a senha. Use 8 ou mais caracteres, com letra e número.
        </p>
        <div className="mt-5 flex flex-col gap-6">
          <TextField
            variant="desktop"
            label="Senha atual"
            type="password"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...form.register('currentPassword')}
          />
          <TextField
            variant="desktop"
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...form.register('newPassword')}
          />
          <TextField
            variant="desktop"
            label="Confirmar nova senha"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...form.register('confirmPassword')}
          />
        </div>
      </fieldset>

      {errors.root?.message && (
        <p role="alert" className="mt-6 text-sm text-required">
          {errors.root.message}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        aria-busy={saving}
        className="mt-8 h-10 w-[8.1875rem] rounded-[3px] bg-primary text-sm font-bold text-primary-fg transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {saving ? 'Salvando…' : 'Salvar'}
      </button>
    </form>
  )
}

function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando perfil" className="mt-[2.375rem]">
      <div className="grid gap-x-7 gap-y-[2.375rem] md:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-[3.875rem]" />
        ))}
      </div>
      <Skeleton className="mt-10 h-56 md:max-w-[26.0625rem]" />
    </div>
  )
}

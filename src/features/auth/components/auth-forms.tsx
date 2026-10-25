import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { AuthField } from '@/features/auth/components/auth-field'
import { useLogin, useRegister } from '@/features/auth/hooks/use-session'
import {
  loginFormSchema,
  registerFormSchema,
  type LoginFormValues,
  type RegisterFormValues,
  type User,
} from '@/features/auth/types/auth'
import { applyApiError } from '@/lib/form-errors'
import { UnavailableAction } from '@/shared/components/unavailable-action'

type Variant = 'desktop' | 'mobile'

function FormError({ message }: { message: string | undefined }) {
  if (!message) return null
  return (
    <p role="alert" className="text-sm text-required">
      {message}
    </p>
  )
}

function SubmitButton({
  variant,
  pending,
  children,
}: {
  variant: Variant
  pending: boolean
  children: string
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`flex w-full items-center justify-center bg-primary text-base leading-4 font-bold text-primary-fg transition-colors hover:bg-primary/90 disabled:opacity-70 ${
        variant === 'mobile' ? 'h-15 rounded-[10px]' : 'h-[2.8125rem] rounded-[5px]'
      }`}
    >
      {pending ? 'Aguarde…' : children}
    </button>
  )
}

interface FormProps {
  variant: Variant
  onSuccess: (user: User) => void
}

export function LoginForm({ variant, onSuccess }: FormProps) {
  const login = useLogin()
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors } = form.formState
  const mobile = variant === 'mobile'

  const onSubmit = form.handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: ({ user }) => onSuccess(user),
      onError: (error) => applyApiError(form, error),
    }),
  )

  return (
    <form onSubmit={onSubmit} noValidate className={mobile ? 'space-y-10' : ''}>
      <div className={mobile ? 'space-y-3' : 'space-y-3 px-20 pt-6'}>
        <AuthField
          variant={variant}
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="contato@email.com"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <AuthField
          variant={variant}
          label="Senha"
          type="password"
          autoComplete="current-password"
          placeholder="Senha"
          error={errors.password?.message}
          {...form.register('password')}
        />
        <div className="flex justify-end">
          <UnavailableAction
            variant="link"
            className="text-sm leading-4 text-fg-accent hover:underline"
          >
            Esqueceu a senha?
          </UnavailableAction>
        </div>
        <FormError message={errors.root?.message} />
      </div>
      <div className={mobile ? '' : 'px-20 pt-6'}>
        <SubmitButton variant={variant} pending={login.isPending}>
          Entrar
        </SubmitButton>
      </div>
    </form>
  )
}

export function RegisterForm({ variant, onSuccess }: FormProps) {
  const register = useRegister()
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })
  const { errors } = form.formState
  const mobile = variant === 'mobile'

  const onSubmit = form.handleSubmit(({ name, email, password }) =>
    register.mutate(
      { name, email, password },
      {
        onSuccess: ({ user }) => onSuccess(user),
        onError: (error) => applyApiError(form, error),
      },
    ),
  )

  return (
    <form onSubmit={onSubmit} noValidate className={mobile ? 'space-y-10' : ''}>
      <div className={mobile ? 'space-y-3' : 'space-y-3 px-20 pt-6'}>
        <AuthField
          variant={variant}
          label="Nome de usuário"
          autoComplete="username"
          placeholder="Nome de usuário"
          error={errors.name?.message}
          {...form.register('name')}
        />
        <AuthField
          variant={variant}
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <AuthField
          variant={variant}
          label="Senha"
          type="password"
          autoComplete="new-password"
          placeholder="Senha"
          error={errors.password?.message}
          {...form.register('password')}
        />
        <AuthField
          variant={variant}
          label="Confirmar senha"
          type="password"
          autoComplete="new-password"
          placeholder="Confirmar senha"
          error={errors.confirmPassword?.message}
          {...form.register('confirmPassword')}
        />
        <FormError message={errors.root?.message} />
      </div>
      <div className={mobile ? '' : 'px-20 pt-6'}>
        <SubmitButton variant={variant} pending={register.isPending}>
          {mobile ? 'Criar perfil' : 'Criar conta'}
        </SubmitButton>
      </div>
    </form>
  )
}

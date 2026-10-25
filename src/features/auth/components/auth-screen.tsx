import { Link, useCanGoBack, useRouter, useSearch } from '@tanstack/react-router'
import { toast } from 'sonner'
import closeIcon from '@/assets/figma/auth/close.svg'
import { LoginForm, RegisterForm } from '@/features/auth/components/auth-forms'
import { SocialSignIn } from '@/features/auth/components/social-sign-in'
import type { User } from '@/features/auth/types/auth'
import { HomePage } from '@/features/catalog/pages/home-page'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'

type Mode = 'login' | 'register'

const copy = {
  login: {
    title: 'Entrar',
    description: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
    mobileTitle: 'Entrar',
    switchPrompt: 'Novo na Kurio?',
    switchLabel: 'Crie uma conta',
  },
  register: {
    title: 'Criar conta',
    description: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
    mobileTitle: 'Criar perfil de colecionador',
    switchPrompt: 'Já tem uma conta?',
    switchLabel: 'Entre',
  },
} as const

function ExpiredNotice({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <p role="status" className="rounded-[5px] border border-primary/60 px-3 py-2 text-sm text-fg">
      Sua sessão expirou. Entre novamente para continuar de onde parou.
    </p>
  )
}

/**
 * Login and sign-up: a dialog over the home page on wide screens (as in the desktop frames),
 * a full page on phones. After success the user returns to where they were heading.
 */
export function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  /** `/login` and `/cadastro` share the same search params (`authSearchSchema`). */
  const search = useSearch({ strict: false })
  const text = copy[mode]
  const otherMode: Mode = mode === 'login' ? 'register' : 'login'
  const switchSearch = { redirect: search.redirect }

  function handleSuccess(user: User) {
    toast.success(`Você entrou como ${user.name}.`)
    void router.navigate({ href: search.redirect ?? '/', replace: true })
  }

  function handleClose() {
    if (canGoBack) router.history.back()
    else void router.navigate({ to: '/' })
  }

  const form =
    mode === 'login' ? (
      <LoginForm variant={isDesktop ? 'desktop' : 'mobile'} onSuccess={handleSuccess} />
    ) : (
      <RegisterForm variant={isDesktop ? 'desktop' : 'mobile'} onSuccess={handleSuccess} />
    )

  const switchLink = (className: string) => (
    <Link
      to={otherMode === 'login' ? '/login' : '/cadastro'}
      search={switchSearch}
      replace
      className={className}
    >
      {copy[otherMode].title}
    </Link>
  )

  if (!isDesktop) {
    return (
      <div className="flex flex-col gap-10 px-1 pt-20 pb-6">
        <Link
          to="/"
          aria-label="Kurio, início"
          className="flex h-[8.5rem] items-center justify-center text-[2rem] font-bold tracking-[0.1em] text-fg"
        >
          KURIO
        </Link>
        <h1 className="text-center text-xl leading-4 font-bold text-fg">{text.mobileTitle}</h1>
        <ExpiredNotice show={search.sessao === 'expirada'} />
        {form}
        <SocialSignIn variant="mobile" />
        <p className="text-center text-[0.9375rem] text-fg-muted">
          {text.switchPrompt}{' '}
          <Link
            to={otherMode === 'login' ? '/login' : '/cadastro'}
            search={switchSearch}
            replace
            className="text-fg-muted underline-offset-4 hover:text-fg-accent hover:underline"
          >
            {text.switchLabel}
          </Link>
        </p>
      </div>
    )
  }

  return (
    <>
      <HomePage />
      <Dialog open onOpenChange={(open) => !open && handleClose()}>
        <DialogContent
          showCloseButton={false}
          onOpenAutoFocus={(event) => {
            // Start on the first field instead of the close button.
            event.preventDefault()
            if (event.currentTarget instanceof HTMLElement) {
              event.currentTarget.querySelector('input')?.focus()
            }
          }}
          className={`block max-w-[31.25rem] gap-0 rounded-[8px] p-0 pb-6 after:h-2.5 sm:max-w-[31.25rem] ${
            mode === 'login' ? 'min-h-[37.5rem]' : 'min-h-[41rem]'
          }`}
        >
          <button
            type="button"
            aria-label="Fechar"
            onClick={handleClose}
            className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-sm transition-opacity hover:opacity-75"
          >
            <img src={closeIcon} alt="" className="size-[1.125rem]" />
          </button>

          <header className="flex flex-col items-center gap-10 px-12 pt-12">
            <nav
              aria-label="Acesso"
              className="flex items-stretch gap-2 text-xl leading-4 font-medium"
            >
              <span aria-current="page" className="text-fg-accent">
                {text.title}
              </span>
              <span aria-hidden="true" className="w-px bg-required" />
              {switchLink('text-fg transition-colors hover:text-fg-accent')}
            </nav>
            <DialogTitle className="sr-only">{text.title} na Kurio</DialogTitle>
            <DialogDescription className="text-center text-[0.8125rem] leading-4 text-fg">
              {text.description}
            </DialogDescription>
          </header>

          {search.sessao === 'expirada' && (
            <div className="px-20 pt-6">
              <ExpiredNotice show />
            </div>
          )}
          {form}
          <SocialSignIn variant="desktop" />
        </DialogContent>
      </Dialog>
    </>
  )
}

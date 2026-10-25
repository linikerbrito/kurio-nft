import { useLogout, useSession } from '@/features/auth/hooks/use-session'
import { Button } from '@/shared/ui/button'

/** Minimal account screen until the collector profile is built; it is also where phones sign out. */
export function ProfilePage() {
  const { data: session } = useSession()
  const logout = useLogout()

  return (
    <section className="mt-10 space-y-6 md:mt-8">
      <h1 className="text-xl leading-6 font-bold text-fg">Perfil do colecionador</h1>
      {session && (
        <div className="space-y-1 text-sm">
          <p className="text-base font-bold text-fg">{session.user.name}</p>
          <p className="text-fg-muted">{session.user.email}</p>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
      >
        Sair da conta
      </Button>
    </section>
  )
}

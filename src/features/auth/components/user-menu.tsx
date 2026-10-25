import { Link } from '@tanstack/react-router'
import { useLogout } from '@/features/auth/hooks/use-session'
import type { User } from '@/features/auth/types/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : ''}`.toUpperCase()
}

/** Signed-in header: avatar with "Meu perfil" and "Sair", in place of the sign-in button. */
export function UserMenu({ user }: { user: User }) {
  const logout = useLogout()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Conta de ${user.name}`}
        className="ml-2.5 flex size-[2.1875rem] items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-primary-fg transition-opacity hover:opacity-90"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <span aria-hidden="true">{initials(user.name)}</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuLabel className="text-fg">
          {user.name}
          <span className="block text-xs font-normal text-fg-muted">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/perfil">Meu perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={logout.isPending} onSelect={() => logout.mutate()}>
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

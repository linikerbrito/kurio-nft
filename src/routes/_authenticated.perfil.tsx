import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/perfil')({
  component: ProfileLayout,
})

function ProfileLayout() {
  return <Outlet />
}

import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/perfil')({
  staticData: {
    layout: {
      header: true,
      footer: false,
      bottomNav: true,
    },
  },
  component: ProfileLayout,
})

function ProfileLayout() {
  return <Outlet />
}

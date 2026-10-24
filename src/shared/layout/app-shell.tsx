import { useMatches, Outlet } from '@tanstack/react-router'
import { Footer } from '@/shared/layout/footer'
import { Header } from '@/shared/layout/header'
import { BottomNav } from '@/shared/layout/bottom-nav'
import { Toaster } from '@/shared/ui/sonner'

export function AppShell() {
  const matches = useMatches()
  const activeMatch = matches[matches.length - 1]
  const layout = activeMatch?.staticData.layout
  const showHeader = layout?.header ?? true
  const showFooter = layout?.footer ?? true
  const showBottomNav = layout?.bottomNav ?? false

  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 bg-primary px-4 py-2 text-primary-fg focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Pular para o conteúdo
      </a>
      {showHeader && <Header />}
      <main
        id="main"
        tabIndex={-1}
        className={`page-container min-h-[50vh] ${showBottomNav ? 'pb-28 md:pb-0' : ''}`}
      >
        <Outlet />
      </main>
      {showFooter && <Footer />}
      {showBottomNav && <BottomNav />}
      <Toaster />
    </>
  )
}

import { Link } from '@tanstack/react-router'

/** "Início / Mercado / <página>" above the desktop screens of the purchase flow. */
export function PageTrail({ current }: { current: string }) {
  return (
    <nav
      aria-label="Trilha"
      className="mt-8 hidden text-[0.9375rem] leading-4 font-bold text-fg md:block"
    >
      <Link to="/" className="hover:text-fg-accent">
        Início
      </Link>
      <span aria-hidden="true"> / </span>
      <Link to="/" hash="catalogo" className="hover:text-fg-accent">
        Mercado
      </Link>
      <span aria-hidden="true"> / </span>
      <span aria-current="page">{current}</span>
    </nav>
  )
}

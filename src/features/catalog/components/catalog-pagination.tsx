import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import arrowIcon from '@/assets/figma/arrow-right2.svg'
import { MaskIcon } from '@/shared/components/mask-icon'

/** The Figma chevron points down; it is rotated to point sideways. */
function PageArrow({ direction }: { direction: 'previous' | 'next' }) {
  return (
    <MaskIcon
      src={arrowIcon}
      className={`h-[0.4219rem] w-3 ${direction === 'next' ? '-rotate-90' : 'rotate-90'}`}
    />
  )
}

const itemClass =
  'flex size-[2.1875rem] items-center justify-center rounded-[4px] border border-line text-lg leading-4 text-fg transition-colors hover:border-primary hover:text-fg-accent'
const currentClass = 'border-primary bg-primary font-bold text-primary-fg hover:text-primary-fg'

/** Up to five page numbers around the current page, with gaps marked by null. */
function pageWindow(page: number, totalPages: number): (number | null)[] {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1)
  const start = Math.max(1, Math.min(page - 2, totalPages - 4))
  const pages: (number | null)[] = Array.from({ length: 5 }, (_, index) => start + index)
  if (start > 1) pages.unshift(1, null)
  if (start + 4 < totalPages) pages.push(null, totalPages)
  return pages
}

interface CatalogPaginationProps {
  page: number
  totalPages: number
}

export function CatalogPagination({ page, totalPages }: CatalogPaginationProps) {
  if (totalPages <= 1) return null

  function pageLink(target: number, label: string, children: ReactNode, current = false) {
    return (
      <Link
        from="/"
        to="/"
        search={(prev) => ({ ...prev, page: target === 1 ? undefined : target })}
        hash="catalogo"
        aria-label={label}
        aria-current={current ? 'page' : undefined}
        className={`${itemClass} ${current ? currentClass : ''}`}
      >
        {children}
      </Link>
    )
  }

  return (
    <nav aria-label="Paginação do catálogo" className="mt-[5.5rem] flex justify-end">
      <ul className="flex flex-wrap gap-2">
        {page > 1 && (
          <li>{pageLink(page - 1, 'Página anterior', <PageArrow direction="previous" />)}</li>
        )}
        {pageWindow(page, totalPages).map((item, index) =>
          item === null ? (
            <li
              key={`gap-${index}`}
              aria-hidden="true"
              className="flex w-6 items-end justify-center text-fg-muted"
            >
              …
            </li>
          ) : (
            <li key={item}>{pageLink(item, `Página ${item}`, item, item === page)}</li>
          ),
        )}
        {page < totalPages && (
          <li>{pageLink(page + 1, 'Próxima página', <PageArrow direction="next" />)}</li>
        )}
      </ul>
    </nav>
  )
}

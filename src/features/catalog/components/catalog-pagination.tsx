import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const itemClass =
  'flex size-9 items-center justify-center rounded-sm border border-border-default text-base text-fg transition-colors hover:border-primary hover:text-primary'
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
    <nav aria-label="Paginação do catálogo" className="mt-14 flex justify-end">
      <ul className="flex flex-wrap gap-2">
        {page > 1 && (
          <li>
            {pageLink(page - 1, 'Página anterior', <ChevronLeft aria-hidden="true" size={18} />)}
          </li>
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
          <li>
            {pageLink(page + 1, 'Próxima página', <ChevronRight aria-hidden="true" size={18} />)}
          </li>
        )}
      </ul>
    </nav>
  )
}

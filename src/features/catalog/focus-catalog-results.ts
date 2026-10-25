/** Id of the home page section that holds the catalog grid (also the `#catalogo` links). */
export const CATALOG_SECTION_ID = 'catalogo'

/**
 * Brings the catalog into view and moves focus to it, so a search lands on its results.
 * Runs after the navigation settled: coming from another page the section only exists then.
 */
export function focusCatalogResults(): void {
  requestAnimationFrame(() => {
    const section = document.getElementById(CATALOG_SECTION_ID)
    if (!section) return
    section.focus({ preventScroll: true })
    section.scrollIntoView({ block: 'start' })
  })
}

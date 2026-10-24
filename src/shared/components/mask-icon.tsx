import type { CSSProperties } from 'react'

interface MaskIconProps {
  /** URL of a single-color SVG asset; it is painted with the current text color. */
  src: string
  className?: string
}

/** Renders an SVG asset as a mask so the original drawing follows `currentColor`. */
export function MaskIcon({ src, className = '' }: MaskIconProps) {
  const style: CSSProperties = {
    maskImage: `url("${src}")`,
    WebkitMaskImage: `url("${src}")`,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={style}
    />
  )
}

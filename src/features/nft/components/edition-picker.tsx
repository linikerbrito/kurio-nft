import chipIcon from '@/assets/figma/detail/chip.svg'
import chipSelectedIcon from '@/assets/figma/detail/chip-selected.svg'
import type { NftEdition } from '@/features/catalog/types/catalog'

interface EditionPickerProps {
  editions: NftEdition[]
  selectedId: string | undefined
  onSelect: (editionId: string) => void
  /** Unique radio group name; desktop and mobile layouts render their own picker. */
  name: string
  className?: string
}

/** Native radios styled as the oval chips of the design; sold-out editions are disabled. */
export function EditionPicker({
  editions,
  selectedId,
  onSelect,
  name,
  className = '',
}: EditionPickerProps) {
  return (
    <fieldset className={className}>
      <legend className="text-[0.9375rem] leading-4 font-bold text-fg">Edição:</legend>
      <div className="mt-2 flex flex-wrap gap-3 md:mt-3 md:gap-1.5">
        {editions.map((edition) => {
          const checked = edition.id === selectedId
          const soldOut = edition.available === 0
          return (
            <label
              key={edition.id}
              className={`relative flex h-7 min-w-9 items-center justify-center rounded-full px-1.5 text-sm leading-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                checked ? 'font-medium text-fg-accent' : 'text-fg-muted'
              } ${soldOut ? 'cursor-not-allowed line-through opacity-50' : 'cursor-pointer hover:text-fg-accent'}`}
            >
              <input
                type="radio"
                name={name}
                value={edition.id}
                checked={checked}
                disabled={soldOut}
                onChange={() => onSelect(edition.id)}
                className="sr-only"
              />
              <img
                src={checked ? chipSelectedIcon : chipIcon}
                alt=""
                className="pointer-events-none absolute inset-0 size-full"
              />
              <span className="relative">{edition.label}</span>
              {soldOut && <span className="sr-only"> (esgotada)</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

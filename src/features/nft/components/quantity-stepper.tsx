import minusRingIcon from '@/assets/figma/cart/m-minus-ring-active.svg'
import minusRingDisabledIcon from '@/assets/figma/cart/m-minus-ring.svg'
import minusIcon from '@/assets/figma/detail/minus.svg'
import plusIcon from '@/assets/figma/detail/plus.svg'
import mobileMinusIcon from '@/assets/figma/detail/m-minus.svg'
import mobilePlusIcon from '@/assets/figma/detail/m-plus.svg'
import { MaskIcon } from '@/shared/components/mask-icon'

interface QuantityStepperProps {
  value: number
  max: number
  onChange: (value: number) => void
  /**
   * `lg`: desktop detail (33×49px pills). `sm`: mobile buy bar and desktop cart (20×30px).
   * `ring`: mobile cart (24px raised circles).
   */
  size: 'lg' | 'sm' | 'ring'
  /** Distinguishes the ids of steppers rendered on the same page. */
  idPrefix: string
  disabled?: boolean
  /** Shows the "Limite de N" note under the stepper when the maximum is reached. */
  showLimit?: boolean
  /** Names what is being counted, for screen readers (e.g. the NFT in a cart line). */
  itemLabel?: string
}

const pillSizes = {
  lg: {
    button:
      'h-[3.09375rem] w-[2.0625rem] shadow-[0_6.6px_9.9px_color-mix(in_srgb,var(--color-bg)_15%,transparent)]',
    icon: 'size-[1.65rem]',
    value: 'min-w-6 text-xl leading-7',
    minus: minusIcon,
    plus: plusIcon,
  },
  sm: {
    button:
      'h-[1.875rem] w-5 shadow-[0_4px_6px_color-mix(in_srgb,var(--color-bg)_15%,transparent)]',
    icon: 'size-4',
    value: 'min-w-5 text-lg leading-[1.5625rem] font-medium',
    minus: mobileMinusIcon,
    plus: mobilePlusIcon,
  },
} as const

export function QuantityStepper({
  value,
  max,
  onChange,
  size,
  idPrefix,
  disabled = false,
  showLimit = true,
  itemLabel,
}: QuantityStepperProps) {
  const atLimit = !disabled && value >= max
  const cannotDecrease = disabled || value <= 1
  const limitId = `${idPrefix}-quantity-limit`
  const suffix = itemLabel ? ` de ${itemLabel}` : ''

  const valueClass =
    size === 'ring' ? 'min-w-4 text-base leading-[1.375rem]' : pillSizes[size].value
  const pillButtonClass =
    size === 'ring'
      ? ''
      : `flex shrink-0 items-center justify-center rounded-full border border-bg bg-primary text-primary-fg transition-opacity disabled:opacity-40 ${pillSizes[size].button}`

  return (
    <div className="relative flex items-center gap-3">
      <button
        type="button"
        aria-label={`Diminuir quantidade${suffix}`}
        disabled={cannotDecrease}
        onClick={() => onChange(value - 1)}
        className={size === 'ring' ? 'size-6 shrink-0 rounded-full' : pillButtonClass}
      >
        {size === 'ring' ? (
          <img
            src={cannotDecrease ? minusRingDisabledIcon : minusRingIcon}
            alt=""
            width={24}
            height={24}
            className="size-6"
          />
        ) : (
          <MaskIcon src={pillSizes[size].minus} className={pillSizes[size].icon} />
        )}
      </button>
      <output
        aria-live="polite"
        aria-label={`Quantidade${suffix}`}
        className={`text-center text-fg ${valueClass}`}
      >
        {value}
      </output>
      <button
        type="button"
        aria-label={`Aumentar quantidade${suffix}`}
        aria-describedby={atLimit && showLimit ? limitId : undefined}
        disabled={disabled || atLimit}
        onClick={() => onChange(value + 1)}
        className={
          size === 'ring'
            ? 'flex size-6 shrink-0 items-center justify-center rounded-full border border-line bg-surface-raised text-[1.3125rem] leading-4 text-fg transition-opacity disabled:opacity-40'
            : pillButtonClass
        }
      >
        {size === 'ring' ? (
          <span aria-hidden="true">+</span>
        ) : (
          <MaskIcon src={pillSizes[size].plus} className={pillSizes[size].icon} />
        )}
      </button>
      {atLimit && showLimit && (
        <p
          id={limitId}
          role="status"
          className="absolute top-full left-0 mt-1 text-xs whitespace-nowrap text-fg-muted"
        >
          Limite de {max} {max === 1 ? 'unidade' : 'unidades'} nesta edição
        </p>
      )}
    </div>
  )
}

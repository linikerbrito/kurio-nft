import minusIcon from '@/assets/figma/detail/minus.svg'
import plusIcon from '@/assets/figma/detail/plus.svg'
import mobileMinusIcon from '@/assets/figma/detail/m-minus.svg'
import mobilePlusIcon from '@/assets/figma/detail/m-plus.svg'
import { MaskIcon } from '@/shared/components/mask-icon'

interface QuantityStepperProps {
  value: number
  max: number
  onChange: (value: number) => void
  /** `lg` is the desktop stepper (33×49px pills), `sm` the one in the mobile buy bar. */
  size: 'lg' | 'sm'
  /** Distinguishes the ids of the desktop and mobile steppers rendered on the same page. */
  idPrefix: string
  disabled?: boolean
}

const sizes = {
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
}: QuantityStepperProps) {
  const style = sizes[size]
  const buttonClass = `flex shrink-0 items-center justify-center rounded-full border border-bg bg-primary text-primary-fg transition-opacity disabled:opacity-40 ${style.button}`
  const atLimit = !disabled && value >= max
  const limitId = `${idPrefix}-quantity-limit`

  return (
    <div className="relative flex items-center gap-3">
      <button
        type="button"
        aria-label="Diminuir quantidade"
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
        className={buttonClass}
      >
        <MaskIcon src={style.minus} className={style.icon} />
      </button>
      <output
        aria-live="polite"
        aria-label="Quantidade"
        className={`text-center text-fg ${style.value}`}
      >
        {value}
      </output>
      <button
        type="button"
        aria-label="Aumentar quantidade"
        aria-describedby={atLimit ? limitId : undefined}
        disabled={disabled || atLimit}
        onClick={() => onChange(value + 1)}
        className={buttonClass}
      >
        <MaskIcon src={style.plus} className={style.icon} />
      </button>
      {atLimit && (
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

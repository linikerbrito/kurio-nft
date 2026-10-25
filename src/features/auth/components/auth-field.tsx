import { useId, useState, type ComponentProps } from 'react'
import hideIcon from '@/assets/figma/auth/hide.svg'

interface AuthFieldProps extends Omit<ComponentProps<'input'>, 'id' | 'className'> {
  label: string
  error?: string
  /** `desktop`: 40px fields of the modal. `mobile`: 50px fields of the full page. */
  variant: 'desktop' | 'mobile'
}

/**
 * Field of the auth forms. The design shows only placeholders; the label stays available to
 * assistive technology, and errors are tied to the field.
 */
export function AuthField({ label, error, variant, type = 'text', ...inputProps }: AuthFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'
  const mobile = variant === 'mobile'

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div
        className={`flex items-center border px-4 transition-colors focus-within:border-primary ${
          error ? 'border-required' : 'border-line'
        } ${mobile ? 'h-[3.125rem] rounded-[10px]' : 'h-10 rounded-[5px]'}`}
      >
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent text-sm leading-4 text-fg outline-none placeholder:text-fg-subtle"
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            aria-label={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={revealed}
            onClick={() => setRevealed((value) => !value)}
            className="ml-2 flex size-6 shrink-0 items-center justify-center rounded-sm opacity-80 transition-opacity hover:opacity-100 aria-pressed:opacity-100"
          >
            <img src={hideIcon} alt="" className="h-[0.9153rem] w-[1.1863rem]" />
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-required">
          {error}
        </p>
      )}
    </div>
  )
}

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import arrowDown from '@/assets/figma/arrow-down.svg'
import hideIcon from '@/assets/figma/auth/hide.svg'
import { MaskIcon } from '@/shared/components/mask-icon'

const controlClass =
  'w-full border bg-transparent px-3 text-sm leading-4 text-fg outline-none transition-colors placeholder:text-fg-subtle focus-visible:border-primary aria-invalid:border-required disabled:cursor-not-allowed disabled:opacity-60 read-only:text-fg-muted'

const sizeClass = {
  desktop: 'h-10 rounded-[2px] border-primary/40',
  mobile: 'h-[3.125rem] rounded-[10px] border-line',
} as const

type Variant = keyof typeof sizeClass

interface FieldShellProps {
  label: string
  /** Shows the coral asterisk of the design and marks the control as required. */
  required?: boolean
  /** Label only for assistive technology (the design shows a placeholder instead). */
  hiddenLabel?: boolean
  error?: string
  /** Short help below the control, announced with it. */
  hint?: ReactNode
  className?: string
  children: (control: { id: string; describedBy: string | undefined }) => ReactNode
}

function FieldShell({
  label,
  required = false,
  hiddenLabel = false,
  error,
  hint,
  className = '',
  children,
}: FieldShellProps) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className={hiddenLabel ? 'sr-only' : 'flex text-[0.9375rem] leading-4 text-fg'}>
        <label htmlFor={id}>{label}</label>
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-required">
            *
          </span>
        )}
      </div>
      {children({ id, describedBy: describedBy || undefined })}
      {hint && (
        <p id={hintId} className="text-xs text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-required">
          {error}
        </p>
      )}
    </div>
  )
}

type FieldProps<T> = Omit<T, 'id' | 'className' | 'children'> &
  Omit<FieldShellProps, 'children'> & { variant: Variant }

export function TextField({
  label,
  required,
  hiddenLabel,
  error,
  hint,
  className,
  variant,
  type = 'text',
  ...inputProps
}: FieldProps<ComponentProps<'input'>>) {
  const [revealed, setRevealed] = useState(false)
  const password = type === 'password'

  return (
    <FieldShell {...{ label, required, hiddenLabel, error, hint, className }}>
      {({ id, describedBy }) => {
        const input = (
          <input
            id={id}
            type={password && revealed ? 'text' : type}
            aria-required={required || undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`${controlClass} ${sizeClass[variant]} ${password ? 'pr-12' : ''}`}
            {...inputProps}
          />
        )
        if (!password) return input
        return (
          <div className="relative">
            {input}
            <button
              type="button"
              aria-label={
                revealed ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`
              }
              aria-pressed={revealed}
              onClick={() => setRevealed((value) => !value)}
              className="absolute top-1/2 right-4 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm opacity-80 transition-opacity hover:opacity-100 aria-pressed:opacity-100"
            >
              <img src={hideIcon} alt="" className="h-[0.9153rem] w-[1.1863rem]" />
            </button>
          </div>
        )
      }}
    </FieldShell>
  )
}

/** "Nome ENS": the `.eth` suffix of the design next to the name. */
export function EnsField({
  label,
  required,
  error,
  className,
  variant,
  ...inputProps
}: FieldProps<ComponentProps<'input'>>) {
  return (
    <FieldShell {...{ label, required, error, className }}>
      {({ id, describedBy }) => (
        <div className="flex gap-2.5">
          <span
            aria-hidden="true"
            className={`flex shrink-0 items-center border px-3 text-base text-fg ${sizeClass[variant]}`}
          >
            .eth
          </span>
          <input
            id={id}
            aria-required={required || undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            autoCapitalize="none"
            className={`${controlClass} ${sizeClass[variant]}`}
            {...inputProps}
          />
        </div>
      )}
    </FieldShell>
  )
}

/** Native select (the Radix one let clicks reach the content underneath). */
export function SelectField({
  label,
  required,
  hiddenLabel,
  error,
  hint,
  className,
  variant,
  children,
  ...selectProps
}: FieldProps<ComponentProps<'select'>> & { children: ReactNode }) {
  return (
    <FieldShell {...{ label, required, hiddenLabel, error, hint, className }}>
      {({ id, describedBy }) => (
        <div className="relative">
          <select
            id={id}
            aria-required={required || undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`${controlClass} ${sizeClass[variant]} cursor-pointer appearance-none pr-10 has-[option[value='']:checked]:text-fg-subtle`}
            {...selectProps}
          >
            {children}
          </select>
          <MaskIcon
            src={arrowDown}
            className="pointer-events-none absolute top-1/2 right-7 h-[0.3854rem] w-[0.6771rem] -translate-y-1/2 text-fg"
          />
        </div>
      )}
    </FieldShell>
  )
}

export function TextAreaField({
  label,
  required,
  hiddenLabel,
  error,
  className,
  variant,
  ...textareaProps
}: FieldProps<ComponentProps<'textarea'>>) {
  return (
    <FieldShell {...{ label, required, hiddenLabel, error, className }}>
      {({ id, describedBy }) => (
        <textarea
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${controlClass} ${
            variant === 'desktop'
              ? 'h-[9.5rem] rounded-[2px] border-primary/40'
              : 'h-28 rounded-[10px] border-line'
          } resize-none py-3`}
          {...textareaProps}
        />
      )}
    </FieldShell>
  )
}

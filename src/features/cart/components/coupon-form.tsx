import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { useApplyCoupon, useRemoveCoupon } from '@/features/cart/hooks/use-cart'
import type { CartCoupon } from '@/features/cart/types/cart'
import { toApiError } from '@/lib/http'

interface CouponFormProps {
  coupon: CartCoupon | null
  /** `desktop`: bordered field with a square button. `mobile`: pill with a gradient button. */
  variant: 'desktop' | 'mobile'
}

export function CouponForm({ coupon, variant }: CouponFormProps) {
  const inputId = useId()
  const errorId = useId()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) {
      setError('Informe um código.')
      return
    }
    apply.mutate(trimmed, {
      onSuccess: () => {
        setCode('')
        setError(null)
        toast.success('Cupom aplicado.')
      },
      onError: (failure) => {
        const apiError = toApiError(failure)
        setError(apiError.fieldErrors.code ?? apiError.message)
      },
    })
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[6px] border border-line px-3 py-2 text-sm text-fg">
        <p>
          Cupom <strong className="text-fg-accent">{coupon.code}</strong> aplicado
        </p>
        <button
          type="button"
          disabled={remove.isPending}
          onClick={() =>
            remove.mutate(undefined, {
              onError: (failure) => toast.error(toApiError(failure).message),
            })
          }
          className="text-sm font-bold text-fg-accent hover:underline disabled:opacity-50"
        >
          Remover cupom
        </button>
      </div>
    )
  }

  const mobile = variant === 'mobile'

  return (
    <form onSubmit={handleSubmit} noValidate className={mobile ? '' : 'space-y-2'}>
      <label
        htmlFor={inputId}
        className={mobile ? 'sr-only' : 'block text-sm leading-4 font-bold text-fg'}
      >
        Código promocional
      </label>
      <div
        className={
          mobile
            ? 'flex h-[3.125rem] items-center rounded-full border border-line bg-surface pl-4 shadow-[0_6px_10px_color-mix(in_srgb,var(--color-bg)_45%,transparent)] focus-within:border-primary'
            : 'flex h-10 items-center rounded-[3px] border border-primary pl-2 focus-within:ring-2 focus-within:ring-primary/30'
        }
      >
        <input
          id={inputId}
          value={code}
          onChange={(event) => {
            setCode(event.target.value)
            if (error) setError(null)
          }}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          maxLength={40}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`min-w-0 flex-1 bg-transparent text-fg uppercase outline-none placeholder:normal-case placeholder:text-fg-subtle ${
            mobile ? 'text-[0.8125rem] leading-[1.375rem]' : 'text-xs leading-4'
          }`}
        />
        <button
          type="submit"
          disabled={apply.isPending}
          className={
            mobile
              ? 'flex h-[3.125rem] w-[6.0625rem] shrink-0 items-center justify-center rounded-full bg-linear-96 from-primary/55 from-1% to-primary text-[0.9375rem] leading-4 font-bold text-fg disabled:opacity-60'
              : 'flex h-10 w-[6.375rem] shrink-0 items-center justify-center rounded-r-[3px] bg-primary text-[0.9375rem] leading-4 font-bold text-primary-fg hover:bg-primary/90 disabled:opacity-60'
          }
        >
          {apply.isPending ? 'Aplicando…' : 'Aplicar'}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-xs text-required">
          {error}
        </p>
      )}
    </form>
  )
}

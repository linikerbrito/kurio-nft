import type { ReactNode, KeyboardEvent } from 'react'
import { toast } from 'sonner'

interface UnavailableActionProps {
  children: ReactNode
  className?: string
  variant: 'link' | 'button'
  type?: 'button' | 'submit'
  'aria-label'?: string
}

function notifyUnavailable() {
  toast.info('Indisponível nesta demonstração')
}

export function UnavailableAction({
  children,
  className,
  variant,
  type = 'button',
  'aria-label': ariaLabel,
}: UnavailableActionProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    const activatesAction =
      variant === 'link' ? event.key === 'Enter' || event.key === ' ' : event.key === ' '

    if (activatesAction && !event.repeat) {
      event.preventDefault()
      notifyUnavailable()
    }
  }

  if (variant === 'link') {
    return (
      <span
        role="link"
        tabIndex={0}
        aria-disabled="true"
        aria-label={ariaLabel}
        className={className}
        onClick={notifyUnavailable}
        onKeyDown={handleKeyDown}
      >
        {children}
      </span>
    )
  }

  return (
    <button
      type={type}
      aria-disabled="true"
      aria-label={ariaLabel}
      className={className}
      onClick={notifyUnavailable}
      onKeyDown={handleKeyDown}
    >
      {children}
    </button>
  )
}

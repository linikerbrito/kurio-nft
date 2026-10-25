import { useCanGoBack, useRouter } from '@tanstack/react-router'
import backIcon from '@/assets/figma/detail/m-back.svg'
import { roundButtonBase } from '@/shared/components/round-button'

/** Goes back in history, or to the home page when the screen was opened directly. */
export function BackButton({ className = '' }: { className?: string }) {
  const router = useRouter()
  const canGoBack = useCanGoBack()

  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={() => (canGoBack ? router.history.back() : router.navigate({ to: '/' }))}
      className={`${roundButtonBase} size-[2.1875rem] ${className}`}
    >
      <img src={backIcon} alt="" className="h-[0.4583rem] w-[0.8229rem] rotate-90" />
    </button>
  )
}

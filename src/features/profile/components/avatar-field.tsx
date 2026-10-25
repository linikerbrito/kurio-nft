import { useId, useRef, useState, type ChangeEvent } from 'react'
import { ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { AvatarError, prepareAvatar } from '@/features/profile/avatar'
import { useRemoveAvatar, useUploadAvatar } from '@/features/profile/hooks/use-profile'
import { avatarTypes } from '@/features/profile/types/profile'
import { toApiError } from '@/lib/http'

/** "Avatar" of the profile frame: picture, "Alterar" (file picker) and "Remover". */
export function AvatarField({ avatarUrl }: { avatarUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const labelId = useId()
  const errorId = useId()
  const [error, setError] = useState<string | null>(null)
  const upload = useUploadAvatar()
  const remove = useRemoveAvatar()
  const busy = upload.isPending || remove.isPending

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    try {
      const dataUrl = await prepareAvatar(file)
      await upload.mutateAsync(dataUrl)
      toast.success('Avatar atualizado.')
    } catch (failure) {
      setError(
        failure instanceof AvatarError
          ? failure.message
          : (toApiError(failure).fieldErrors.avatar ?? toApiError(failure).message),
      )
    }
  }

  return (
    <div role="group" aria-labelledby={labelId} aria-describedby={error ? errorId : undefined}>
      <p id={labelId} className="text-[0.9375rem] leading-4 text-fg">
        Avatar
      </p>
      <div className="mt-2 flex items-center gap-6">
        <span className="flex size-[3.125rem] shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-raised text-fg-accent">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Seu avatar" className="size-full object-cover" />
          ) : (
            <ImageIcon aria-label="Sem avatar" className="size-5" strokeWidth={1.75} />
          )}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={avatarTypes.join(',')}
          aria-label="Escolher imagem do avatar"
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => void handleFile(event)}
        />
        <button
          type="button"
          disabled={busy}
          aria-busy={upload.isPending}
          onClick={() => inputRef.current?.click()}
          className="h-10 w-[6.125rem] rounded-[3px] bg-primary text-sm font-bold text-primary-fg transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {upload.isPending ? 'Enviando…' : 'Alterar'}
        </button>
        <button
          type="button"
          disabled={busy || !avatarUrl}
          onClick={() =>
            remove.mutate(undefined, {
              onSuccess: () => toast.success('Avatar removido.'),
              onError: (failure) => setError(toApiError(failure).message),
            })
          }
          className="text-sm text-fg transition-colors hover:text-fg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          Remover
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-xs text-required">
          {error}
        </p>
      )}
    </div>
  )
}

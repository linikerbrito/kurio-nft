import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { toApiError } from '@/lib/http'

/** API field errors go to their fields; anything else becomes the form-level message. */
export function applyApiError<T extends FieldValues>(form: UseFormReturn<T>, error: unknown) {
  const apiError = toApiError(error)
  const fields = Object.entries(apiError.fieldErrors)
  if (fields.length === 0) {
    form.setError('root', { message: apiError.message })
    return
  }
  for (const [field, message] of fields) {
    form.setError(field as Path<T>, { message }, { shouldFocus: true })
  }
}

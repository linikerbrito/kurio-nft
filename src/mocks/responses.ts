import { HttpResponse } from 'msw'
import type { ApiErrorBody } from '@/lib/api-contract'

type ErrorCode = ApiErrorBody['error']['code']

const statusByCode: Record<ErrorCode, number> = {
  validation: 422,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  transient: 503,
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  fieldErrors?: Record<string, string>,
) {
  const body: ApiErrorBody = { error: { code, message, fieldErrors } }
  return HttpResponse.json(body, { status: statusByCode[code] })
}

export function transientFailure() {
  return errorResponse('transient', 'Serviço temporariamente indisponível. Tente novamente.')
}

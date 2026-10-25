import axios, { isAxiosError, isCancel } from 'axios'
import type { z } from 'zod'
import { apiErrorBodySchema } from '@/lib/api-contract'
import {
  clearSessionToken,
  getSessionToken,
  markSessionExpired,
  SESSION_EXPIRED_EVENT,
} from '@/lib/session-token'
import { whenNetworkReady } from '@/lib/network-ready'
import { getVisitorCartId } from '@/lib/visitor-cart'

export type ApiErrorCode =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'transient'
  | 'timeout'
  | 'network'
  | 'contract'
  | 'unknown'

const retryableCodes: ReadonlySet<ApiErrorCode> = new Set(['transient', 'timeout', 'network'])

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number | undefined
  readonly fieldErrors: Record<string, string>

  constructor(
    code: ApiErrorCode,
    message: string,
    options: { status?: number; fieldErrors?: Record<string, string>; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause })
    this.name = 'ApiError'
    this.code = code
    this.status = options.status
    this.fieldErrors = options.fieldErrors ?? {}
  }

  get retryable(): boolean {
    return retryableCodes.has(this.code)
  }
}

/** Requests without an answer by then fail as `timeout` (repeatable). */
export const REQUEST_TIMEOUT_MS = 10_000

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: true,
  paramsSerializer: { indexes: null },
})

/** Header the API uses to find the visitor's cart. */
export const CART_ID_HEADER = 'X-Cart-Id'

http.interceptors.request.use(async (config) => {
  await whenNetworkReady()
  config.headers.set(CART_ID_HEADER, getVisitorCartId())
  const token = getSessionToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

http.interceptors.response.use(undefined, (error: unknown) => {
  if (isCancel(error)) {
    return Promise.reject(error)
  }
  const apiError = toApiError(error)
  /** A 401 on a request that carried a token means the session ended on the server. */
  const sentToken = isAxiosError(error) && error.config?.headers?.has('Authorization')
  if (apiError.code === 'unauthorized' && sentToken) {
    clearSessionToken()
    markSessionExpired()
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
  }
  return Promise.reject(apiError)
})

function codeFromStatus(status: number): ApiErrorCode {
  if (status === 400 || status === 422) return 'validation'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status === 408 || status === 429 || status >= 500) return 'transient'
  return 'unknown'
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (!isAxiosError(error)) {
    return new ApiError('unknown', 'Erro inesperado.', { cause: error })
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError('timeout', 'O servidor demorou a responder.', { cause: error })
  }
  if (!error.response) {
    return new ApiError('network', 'Sem conexão com o servidor.', { cause: error })
  }

  const { status, data } = error.response
  const body = apiErrorBodySchema.safeParse(data)
  if (body.success) {
    return new ApiError(body.data.error.code, body.data.error.message, {
      status,
      fieldErrors: body.data.error.fieldErrors,
      cause: error,
    })
  }
  return new ApiError(codeFromStatus(status), 'Não foi possível concluir a solicitação.', {
    status,
    cause: error,
  })
}

export function parseResponse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ApiError('contract', 'Resposta do servidor em formato inesperado.', {
      cause: result.error,
    })
  }
  return result.data
}

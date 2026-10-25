import { http, parseResponse } from '@/lib/http'
import {
  authResponseSchema,
  sessionSchema,
  type AuthResponse,
  type RegisterInput,
  type Session,
} from '@/features/auth/types/auth'

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await http.post<unknown>('/auth/login', { email, password })
  return parseResponse(authResponseSchema, data)
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await http.post<unknown>('/auth/register', input)
  return parseResponse(authResponseSchema, data)
}

export async function fetchSession(signal?: AbortSignal): Promise<Session> {
  const { data } = await http.get<unknown>('/auth/session', { signal })
  return parseResponse(sessionSchema, data)
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout')
}

import {
  profileSchema,
  type ChangePasswordInput,
  type Profile,
  type ProfileData,
} from '@/features/profile/types/profile'
import { http, parseResponse } from '@/lib/http'

export const profileKeys = {
  all: ['profile'] as const,
}

export async function fetchProfile(signal?: AbortSignal): Promise<Profile> {
  const { data } = await http.get<unknown>('/profile', { signal })
  return parseResponse(profileSchema, data)
}

export async function updateProfile(input: ProfileData): Promise<Profile> {
  const { data } = await http.patch<unknown>('/profile', input)
  return parseResponse(profileSchema, data)
}

export async function uploadAvatar(dataUrl: string): Promise<Profile> {
  const { data } = await http.put<unknown>('/profile/avatar', { dataUrl })
  return parseResponse(profileSchema, data)
}

export async function removeAvatar(): Promise<Profile> {
  const { data } = await http.delete<unknown>('/profile/avatar')
  return parseResponse(profileSchema, data)
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await http.post('/profile/password', input)
}

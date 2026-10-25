import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { sessionQueryOptions, useSession } from '@/features/auth/hooks/use-session'
import type { Session } from '@/features/auth/types/auth'
import {
  changePassword,
  fetchProfile,
  profileKeys,
  removeAvatar,
  updateProfile,
  uploadAvatar,
} from '@/features/profile/api/profile-api'
import type { ChangePasswordInput, Profile, ProfileData } from '@/features/profile/types/profile'

export function useProfile() {
  const { data: session } = useSession()
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: ({ signal }) => fetchProfile(signal),
    enabled: Boolean(session),
  })
}

/** Saved profile goes to the cache and to the session, so the header shows it at once. */
function useProfileMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<Profile>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.all, profile)
      queryClient.setQueryData<Session | null>(sessionQueryOptions().queryKey, (session) =>
        session
          ? {
              ...session,
              user: {
                ...session.user,
                name: profile.displayName,
                email: profile.email,
                avatarUrl: profile.avatarUrl,
              },
            }
          : session,
      )
    },
  })
}

export function useUpdateProfile() {
  return useProfileMutation((input: ProfileData) => updateProfile(input))
}

export function useUploadAvatar() {
  return useProfileMutation((dataUrl: string) => uploadAvatar(dataUrl))
}

export function useRemoveAvatar() {
  return useProfileMutation(() => removeAvatar())
}

export function useChangePassword() {
  return useMutation({ mutationFn: (input: ChangePasswordInput) => changePassword(input) })
}

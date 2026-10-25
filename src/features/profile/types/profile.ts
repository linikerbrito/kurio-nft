import { z } from 'zod'
import { emailField, newPasswordSchema } from '@/features/auth/types/auth'

/** `GET/PATCH /api/profile`: the collector profile of the signed-in user. */
export const profileSchema = z.object({
  displayName: z.string(),
  username: z.string(),
  email: z.string(),
  ensName: z.string(),
  walletNickname: z.string(),
  avatarUrl: z.string().nullable(),
})
export type Profile = z.infer<typeof profileSchema>

export const profileDataSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'O nome precisa de pelo menos 2 caracteres.')
    .max(40, 'Use até 40 caracteres.'),
  username: z
    .string()
    .trim()
    .min(1, 'Informe o nome de usuário.')
    .regex(/^[a-z0-9_.]{3,20}$/, 'Use de 3 a 20 letras minúsculas, números, ponto ou _.'),
  email: emailField,
  ensName: z
    .string()
    .trim()
    .min(1, 'Informe o nome ENS.')
    .regex(/^[a-z0-9-]{3,}$/, 'Use 3 ou mais letras minúsculas, números ou hífen.'),
  walletNickname: z
    .string()
    .trim()
    .min(2, 'Informe o apelido da carteira.')
    .max(30, 'Use até 30 caracteres.'),
})
export type ProfileData = z.infer<typeof profileDataSchema>

/**
 * The single "Salvar" of the design saves the data and, when any password field is filled,
 * changes the password too.
 */
export const profileFormSchema = profileDataSchema
  .extend({
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .superRefine((values, context) => {
    const changing = Boolean(values.currentPassword || values.newPassword || values.confirmPassword)
    if (!changing) return
    if (!values.currentPassword) {
      context.addIssue({
        code: 'custom',
        path: ['currentPassword'],
        message: 'Informe a senha atual.',
      })
    }
    const next = newPasswordSchema.safeParse(values.newPassword)
    if (!next.success) {
      context.addIssue({
        code: 'custom',
        path: ['newPassword'],
        message: next.error.issues[0]?.message ?? 'Senha inválida.',
      })
    }
    if (values.newPassword !== values.confirmPassword) {
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'As senhas não conferem.',
      })
    }
  })
export type ProfileFormValues = z.infer<typeof profileFormSchema>

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

/** Avatars travel as small data URLs (the browser resizes the picture first). */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024
export const avatarTypes = ['image/png', 'image/jpeg', 'image/webp'] as const

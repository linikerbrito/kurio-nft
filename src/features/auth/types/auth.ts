import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  createdAt: z.iso.datetime(),
})
export type User = z.infer<typeof userSchema>

/** Current session as the API reports it. */
export const sessionSchema = z.object({
  user: userSchema,
  expiresAt: z.iso.datetime(),
})
export type Session = z.infer<typeof sessionSchema>

/** Login and registration answer with the session and its bearer token. */
export const authResponseSchema = sessionSchema.extend({ token: z.string() })
export type AuthResponse = z.infer<typeof authResponseSchema>

export const emailField = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .pipe(z.email('Informe um e-mail válido.'))

export const loginFormSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Informe sua senha.'),
})
export type LoginFormValues = z.infer<typeof loginFormSchema>

/** Rules for a new password (sign-up and password change). */
export const newPasswordSchema = z
  .string()
  .min(8, 'A senha precisa de pelo menos 8 caracteres.')
  .regex(/[A-Za-z]/, 'Use pelo menos uma letra.')
  .regex(/\d/, 'Use pelo menos um número.')

export const registerFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'O nome precisa de pelo menos 2 caracteres.')
      .max(40, 'Use até 40 caracteres.'),
    email: emailField,
    password: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não conferem.',
  })
export type RegisterFormValues = z.infer<typeof registerFormSchema>

export interface RegisterInput {
  name: string
  email: string
  password: string
}

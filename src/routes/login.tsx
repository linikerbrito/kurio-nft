import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { LoginPage } from '@/features/auth/pages/login-page'

const redirectSearchSchema = z.object({
  redirect: z
    .string()
    .optional()
    .refine(
      (redirect) =>
        redirect === undefined ||
        (redirect.startsWith('/') && !redirect.startsWith('//') && !redirect.includes('\\')),
      'O redirecionamento deve ser um caminho interno.',
    ),
})

export const Route = createFileRoute('/login')({
  validateSearch: redirectSearchSchema,
  component: LoginPage,
})

import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { RegisterPage } from '@/features/auth/pages/register-page'

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

export const Route = createFileRoute('/cadastro')({
  validateSearch: redirectSearchSchema,
  component: RegisterPage,
})

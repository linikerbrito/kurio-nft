import { z } from 'zod'

/** Search params shared by `/login` and `/cadastro`: where to go back and why we are here. */
export const authSearchSchema = z.object({
  redirect: z
    .string()
    .refine(
      (redirect) =>
        redirect.startsWith('/') && !redirect.startsWith('//') && !redirect.includes('\\'),
      'O redirecionamento deve ser um caminho interno.',
    )
    .optional()
    .catch(undefined),
  sessao: z.enum(['expirada']).optional().catch(undefined),
})
export type AuthSearch = z.infer<typeof authSearchSchema>

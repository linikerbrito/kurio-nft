import { z } from 'zod'

export const apiErrorCodeSchema = z.enum([
  'validation',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'transient',
])

export const apiErrorBodySchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    fieldErrors: z.record(z.string(), z.string()).optional(),
  }),
})

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>

/** ETH amount as a non-negative decimal string, e.g. "1.19". */
export const ethAmountSchema = z.string().regex(/^\d+(\.\d+)?$/, 'Valor em ETH inválido.')

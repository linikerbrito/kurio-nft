import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { CheckoutPage } from '@/features/checkout/pages/checkout-page'

/** Phones split the payment in two steps: collector data, then `?etapa=carteira`. */
const checkoutSearchSchema = z.object({
  etapa: z.enum(['carteira']).optional().catch(undefined),
})

export const Route = createFileRoute('/_authenticated/pagamento')({
  validateSearch: checkoutSearchSchema,
  staticData: {
    layout: {
      header: true,
      footer: true,
      bottomNav: false,
    },
  },
  component: CheckoutPage,
})

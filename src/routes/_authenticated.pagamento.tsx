import { createFileRoute } from '@tanstack/react-router'
import { CheckoutPage } from '@/features/checkout/pages/checkout-page'

export const Route = createFileRoute('/_authenticated/pagamento')({
  staticData: {
    layout: {
      header: true,
      footer: true,
      bottomNav: false,
    },
  },
  component: CheckoutPage,
})

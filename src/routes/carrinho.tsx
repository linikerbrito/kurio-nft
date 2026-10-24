import { createFileRoute } from '@tanstack/react-router'
import { CartPage } from '@/features/cart/pages/cart-page'

export const Route = createFileRoute('/carrinho')({
  staticData: {
    layout: {
      header: true,
      footer: true,
      bottomNav: false,
    },
  },
  component: CartPage,
})

import { createFileRoute } from '@tanstack/react-router'
import { OrderConfirmationPage } from '@/features/orders/pages/order-confirmation-page'

export const Route = createFileRoute('/_authenticated/pedidos/$orderId')({
  component: OrderConfirmationPage,
})

import { z } from 'zod'
import { cartSchema } from '@/features/cart/types/cart'
import { networkSchema } from '@/features/catalog/types/catalog'
import {
  walletAddressSchema,
  walletProviderSchema,
  type WalletProvider,
} from '@/features/wallets/types/wallets'

/**
 * `POST /api/checkout/quote`: the cart priced and checked at this moment. The id changes
 * whenever price, stock, coupon or fees change, so an order can tell a stale review apart.
 */
export const quoteSchema = cartSchema.pick({ items: true, coupon: true, summary: true }).extend({
  id: z.string(),
  createdAt: z.string(),
})
export type Quote = z.infer<typeof quoteSchema>

const requiredText = (message: string) => z.string().trim().min(1, message)

/** Fields of the "Perfil do colecionador" form, as laid out in the design. */
export const collectorSchema = z.object({
  displayName: requiredText('Informe o nome de exibição.').max(40, 'Use até 40 caracteres.'),
  username: requiredText('Informe o nome de usuário.').regex(
    /^[a-z0-9_.]{3,20}$/,
    'Use de 3 a 20 letras minúsculas, números, ponto ou _.',
  ),
  profileName: requiredText('Informe o nome do perfil.').max(40, 'Use até 40 caracteres.'),
  email: requiredText('Informe seu e-mail.').pipe(z.email('Informe um e-mail válido.')),
  referralCode: requiredText('Informe o código de indicação.').regex(
    /^[A-Za-z0-9]{4,12}$/,
    'Use de 4 a 12 letras ou números.',
  ),
  ensName: requiredText('Informe o nome ENS.').regex(
    /^[a-z0-9-]{3,}$/,
    'Use 3 ou mais letras minúsculas, números ou hífen.',
  ),
  secondaryWallet: z.string().trim().max(80, 'Use até 80 caracteres.'),
  note: z.string().trim().max(280, 'Use até 280 caracteres.'),
})
export type Collector = z.infer<typeof collectorSchema>

/** Whole payment form: collector data plus the wallet that pays and the app that signs. */
export const checkoutFormSchema = collectorSchema
  .extend({
    walletId: z.string(),
    useOtherWallet: z.boolean(),
    address: z.string().trim(),
    network: networkSchema.or(z.literal('')),
    provider: walletProviderSchema.or(z.literal('')),
  })
  .superRefine((values, context) => {
    if (values.useOtherWallet) {
      const address = walletAddressSchema.safeParse(values.address)
      if (!address.success) {
        context.addIssue({
          code: 'custom',
          path: ['address'],
          message: address.error.issues[0]?.message ?? 'Endereço inválido.',
        })
      }
    } else if (!values.walletId) {
      context.addIssue({ code: 'custom', path: ['walletId'], message: 'Selecione uma carteira.' })
    }
    if (!values.network) {
      context.addIssue({ code: 'custom', path: ['network'], message: 'Selecione uma rede.' })
    }
    if (!values.provider) {
      context.addIssue({
        code: 'custom',
        path: ['provider'],
        message: 'Escolha a carteira que vai assinar o pagamento.',
      })
    }
  })
export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>

/** Fields of the collector itself (the wallet ones live next to the wallet choice). */
export const collectorFieldNames = [
  'displayName',
  'username',
  'profileName',
  'email',
  'referralCode',
  'ensName',
  'secondaryWallet',
  'note',
] as const satisfies readonly (keyof Collector)[]

/** `POST /api/orders` body; the `Idempotency-Key` header names the attempt. */
export interface CreateOrderInput {
  quoteId: string
  connectionId: string
  collector: Collector
}

export function isProvider(value: string): value is WalletProvider {
  return walletProviderSchema.safeParse(value).success
}

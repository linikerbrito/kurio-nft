import type { UseFormReturn } from 'react-hook-form'
import type { CheckoutFormValues } from '@/features/checkout/types/checkout'
import type { Wallet } from '@/features/wallets/types/wallets'

/** Picking a saved wallet also brings its network, which stays editable. */
export function selectSavedWallet(
  form: UseFormReturn<CheckoutFormValues>,
  wallets: Wallet[],
  walletId: string,
) {
  form.setValue('walletId', walletId, { shouldValidate: form.formState.isSubmitted })
  const wallet = wallets.find((item) => item.id === walletId)
  if (wallet)
    form.setValue('network', wallet.network, { shouldValidate: form.formState.isSubmitted })
}

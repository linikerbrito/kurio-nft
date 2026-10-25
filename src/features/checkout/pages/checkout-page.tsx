import { useEffect, useState, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import type { User } from '@/features/auth/types/auth'
import { useSession } from '@/features/auth/hooks/use-session'
import { CouponForm } from '@/features/cart/components/coupon-form'
import { SummaryRows } from '@/features/cart/components/cart-summary'
import { useCart } from '@/features/cart/hooks/use-cart'
import type { Cart } from '@/features/cart/types/cart'
import {
  DisplayNameField,
  EmailField,
  EnsNameField,
  NoteField,
  ProfileNameField,
  ReferralCodeField,
  SecondaryWalletField,
  UsernameField,
} from '@/features/checkout/components/collector-fields'
import {
  OrderReviewDialog,
  type ReviewState,
} from '@/features/checkout/components/order-review-dialog'
import { PurchaseLines } from '@/features/checkout/components/purchase-lines'
import { linesFromCart } from '@/features/checkout/purchase-lines'
import { quoteMatchesCart } from '@/features/checkout/quote-changes'
import { selectSavedWallet } from '@/features/checkout/select-saved-wallet'
import {
  AddressField,
  NetworkField,
  OtherWalletToggle,
  SavedWalletField,
} from '@/features/checkout/components/wallet-fields'
import { ProviderPicker, SavedWalletPicker } from '@/features/checkout/components/wallet-pickers'
import {
  CHECKOUT_STORAGE_PREFIX,
  readOrderAttempt,
  useCreateQuote,
  usePlaceOrder,
  type OrderAttempt,
} from '@/features/checkout/hooks/use-checkout'
import {
  checkoutFormSchema,
  collectorFieldNames,
  type CheckoutFormValues,
  type Collector,
} from '@/features/checkout/types/checkout'
import {
  useConnectWallet,
  useDisconnectWallet,
  useWallets,
} from '@/features/wallets/hooks/use-wallets'
import type { Wallet } from '@/features/wallets/types/wallets'
import { formatEth } from '@/lib/eth'
import { applyApiError } from '@/lib/form-errors'
import { toApiError } from '@/lib/http'
import { readSessionValue, writeSessionValue } from '@/lib/session-store'
import { BackButton } from '@/shared/components/back-button'
import { PageTrail } from '@/shared/components/page-trail'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

/** The form in progress survives a reload and an expired session (same user, same tab). */
const draftSchema = z.object({
  displayName: z.string(),
  username: z.string(),
  profileName: z.string(),
  email: z.string(),
  referralCode: z.string(),
  ensName: z.string(),
  secondaryWallet: z.string(),
  note: z.string(),
  walletId: z.string(),
  useOtherWallet: z.boolean(),
  address: z.string(),
  network: checkoutFormSchema.shape.network,
  provider: checkoutFormSchema.shape.provider,
})

function draftKey(userId: string) {
  return `${CHECKOUT_STORAGE_PREFIX}draft:${userId}`
}

function initialValues(user: User): CheckoutFormValues {
  const draft = readSessionValue(draftKey(user.id), draftSchema)
  if (draft) return draft
  return {
    displayName: user.name,
    username: (user.email.split('@')[0] ?? '').toLowerCase().replace(/[^a-z0-9_.]/g, ''),
    profileName: user.name,
    email: user.email,
    referralCode: '',
    ensName: '',
    secondaryWallet: '',
    note: '',
    walletId: '',
    useOtherWallet: false,
    address: '',
    network: '',
    provider: '',
  }
}

function pickCollector(values: CheckoutFormValues): Collector {
  const {
    displayName,
    username,
    profileName,
    email,
    referralCode,
    ensName,
    secondaryWallet,
    note,
  } = values
  return { displayName, username, profileName, email, referralCode, ensName, secondaryWallet, note }
}

const confirmButtonClass = {
  desktop:
    'flex h-[2.8125rem] w-full items-center justify-center rounded-[6px] bg-primary text-[0.9375rem] leading-4 font-bold text-primary-fg transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60',
  mobile:
    'flex h-15 w-full items-center justify-center rounded-full bg-linear-109 from-primary from-4% to-primary/80 text-base leading-4 font-bold text-primary-fg disabled:opacity-60',
}

export function CheckoutPage() {
  const { data: session } = useSession()
  const cart = useCart()
  // A purchase confirmed during the review empties the cart: the review stays on screen.
  const [reviewOpen, setReviewOpen] = useState(false)

  useEffect(() => {
    document.title = 'Pagamento · Kurio'
    return () => {
      document.title = 'Kurio'
    }
  }, [])

  let content: ReactNode
  if (!session || cart.isPending) {
    content = <CheckoutSkeleton />
  } else if (cart.isError) {
    content = (
      <CheckoutMessage title="Não foi possível carregar seu pedido.">
        <Button type="button" disabled={cart.isFetching} onClick={() => void cart.refetch()}>
          {cart.isFetching ? 'Tentando…' : 'Tentar novamente'}
        </Button>
      </CheckoutMessage>
    )
  } else if (cart.data.items.length === 0 && !reviewOpen) {
    content = (
      <CheckoutMessage title="Seu carrinho está vazio.">
        <PendingAttemptNotice userId={session.user.id} />
        <Link to="/" hash="catalogo" className="font-bold text-fg-accent hover:underline">
          Explorar NFTs
        </Link>
      </CheckoutMessage>
    )
  } else {
    content = <CheckoutForm user={session.user} cart={cart.data} onReviewChange={setReviewOpen} />
  }

  return <div className="pb-16">{content}</div>
}

interface CheckoutFormProps {
  user: User
  cart: Cart
  onReviewChange: (open: boolean) => void
}

function CheckoutForm({ user, cart, onReviewChange }: CheckoutFormProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const navigate = useNavigate()
  const search = useSearch({ from: '/_authenticated/pagamento' })
  const wallets = useWallets()
  const createQuote = useCreateQuote()
  const connect = useConnectWallet()
  const disconnect = useDisconnectWallet()
  const placeOrder = usePlaceOrder(user.id)
  const [review, setReview] = useState<ReviewState | null>(null)
  const reviewOpen = review !== null
  useEffect(() => onReviewChange(reviewOpen), [reviewOpen, onReviewChange])
  const [failure, setFailure] = useState<{ message: string; retry: boolean } | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: initialValues(user),
  })

  // Keep the draft while the user types.
  const draft = useWatch({ control: form.control })
  useEffect(() => writeSessionValue(draftKey(user.id), draft), [draft, user.id])

  // Start on the primary wallet once the saved wallets arrive.
  const savedWallets = wallets.data ?? []
  useEffect(() => {
    const first = wallets.data?.find((wallet) => wallet.kind === 'primary') ?? wallets.data?.[0]
    if (first && !form.getValues('walletId')) selectSavedWallet(form, wallets.data ?? [], first.id)
  }, [wallets.data, form])

  async function startReview(values: CheckoutFormValues) {
    setPageError(null)
    setFailure(null)
    if (!values.provider || !values.network) return
    let quote
    try {
      quote = await createQuote.mutateAsync()
    } catch (error) {
      setPageError(toApiError(error).message)
      return
    }
    try {
      const connection = await connect.mutateAsync({
        walletId: values.useOtherWallet ? null : values.walletId,
        address: values.useOtherWallet ? values.address : null,
        network: values.network,
        provider: values.provider,
      })
      setStatus(`${connection.label} conectada.`)
      setReview({
        quote,
        previousQuote: null,
        connection,
        collector: { displayName: values.displayName, email: values.email },
      })
    } catch (error) {
      const apiError = toApiError(error)
      form.setError('provider', { message: apiError.message })
    }
  }

  // A price or stock change arrived (`nft.updated` refetched the cart): the open review is
  // out of date, so it is quoted again and the user must confirm the new values.
  const requote = createQuote.mutateAsync
  // While an attempt waits to be retried (timeout), the order may already exist: retrying with
  // the same key recovers it, so the review is left as it was.
  const placing = placeOrder.isPending
  const awaitingRetry = failure?.retry ?? false
  useEffect(() => {
    if (!review || placing || awaitingRetry || quoteMatchesCart(review.quote, cart)) return
    let cancelled = false
    requote()
      .then((quote) => {
        if (cancelled) return
        setReview((current) => current && { ...current, quote, previousQuote: current.quote })
      })
      .catch((error: unknown) => {
        if (!cancelled) setFailure({ message: toApiError(error).message, retry: false })
      })
    return () => {
      cancelled = true
    }
  }, [cart, review, placing, awaitingRetry, requote])

  function closeReview() {
    setReview(null)
    setFailure(null)
  }

  function handleDisconnect() {
    if (!review) return
    disconnect.mutate(review.connection.id, {
      onSettled: () => {
        closeReview()
        setStatus('Carteira desconectada.')
        toast.info('Carteira desconectada.')
      },
    })
  }

  function handleConfirm() {
    if (!review) return
    setFailure(null)
    const input = {
      quoteId: review.quote.id,
      connectionId: review.connection.id,
      collector: pickCollector(form.getValues()),
    }
    placeOrder.mutate(input, {
      onSuccess: (order) =>
        void navigate({ to: '/pedidos/$orderId', params: { orderId: order.id } }),
      onError: async (error) => {
        const apiError = toApiError(error)
        if (apiError.code === 'conflict') {
          // Prices, stock or fees changed: show the new quote and ask again.
          try {
            const quote = await createQuote.mutateAsync()
            setReview({ ...review, quote, previousQuote: review.quote })
          } catch (quoteError) {
            setFailure({ message: toApiError(quoteError).message, retry: false })
          }
          return
        }
        if (Object.keys(apiError.fieldErrors).length > 0) {
          closeReview()
          applyApiError(form, error)
          return
        }
        setFailure({
          message: apiError.retryable
            ? 'Não recebemos a confirmação a tempo. Tente novamente: sua compra não será duplicada.'
            : apiError.message,
          retry: apiError.retryable,
        })
      },
    })
  }

  const reviewing = createQuote.isPending || connect.isPending
  const onSubmit = form.handleSubmit(startReview, (errors) => {
    // On phones the collector data is on the first step: go back to show what is missing.
    if (!isDesktop && collectorFieldNames.some((field) => errors[field])) {
      void navigate({ to: '/pagamento', search: {} })
    }
  })

  const shared = {
    form,
    cart,
    wallets: savedWallets,
    walletsPending: wallets.isPending,
    reviewing,
    pageError,
    onSubmit,
  }

  return (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
      <PendingAttemptNotice userId={user.id} />
      {isDesktop ? (
        <DesktopCheckout {...shared} />
      ) : search.etapa === 'carteira' ? (
        <MobileWalletStep {...shared} />
      ) : (
        <MobileCollectorStep
          form={form}
          onContinue={async () => {
            if (await form.trigger([...collectorFieldNames], { shouldFocus: true })) {
              void navigate({ to: '/pagamento', search: { etapa: 'carteira' } })
            }
          }}
        />
      )}
      <OrderReviewDialog
        review={review}
        placing={placeOrder.isPending || createQuote.isPending}
        disconnecting={disconnect.isPending}
        failure={failure}
        onConfirm={handleConfirm}
        onDisconnect={handleDisconnect}
        onClose={closeReview}
      />
    </>
  )
}

interface StepProps {
  form: UseFormReturn<CheckoutFormValues>
  cart: Cart
  wallets: Wallet[]
  walletsPending: boolean
  reviewing: boolean
  pageError: string | null
  onSubmit: () => void
}

function DesktopCheckout({ form, cart, wallets, reviewing, pageError, onSubmit }: StepProps) {
  const [couponOpen, setCouponOpen] = useState(cart.coupon !== null)
  const provider = form.watch('provider')

  return (
    <>
      <PageTrail current="Pagamento" />
      <h1 className="sr-only">Pagamento</h1>
      <div className="mt-[2.375rem] flex flex-col gap-12 lg:flex-row lg:justify-between">
        <form
          id="checkout-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit()
          }}
          aria-labelledby="collector-title"
          className="lg:w-[47.6875rem]"
        >
          <h2 id="collector-title" className="text-lg leading-4 font-bold text-fg">
            Perfil do colecionador
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
            <DisplayNameField form={form} variant="desktop" />
            <UsernameField form={form} variant="desktop" />
            <NetworkField form={form} variant="desktop" />
            <ProfileNameField form={form} variant="desktop" />
            <AddressField form={form} variant="desktop" wallets={wallets} />
            <div className="self-end">
              <SecondaryWalletField form={form} variant="desktop" hiddenLabel />
            </div>
            <SavedWalletField form={form} variant="desktop" wallets={wallets} />
            <ReferralCodeField form={form} variant="desktop" />
            <EmailField form={form} variant="desktop" />
            <EnsNameField form={form} variant="desktop" />
          </div>
          <div className="mt-6 space-y-6">
            <OtherWalletToggle form={form} />
            <NoteField form={form} variant="desktop" />
          </div>
        </form>

        <aside aria-labelledby="your-nfts-title" className="flex flex-col lg:w-[25.3125rem]">
          <h2 id="your-nfts-title" className="mb-3 text-lg leading-4 font-bold text-fg">
            Seus NFTs
          </h2>
          <PurchaseLines lines={linesFromCart(cart.items)} variant="panel" label="Seus NFTs" />
          <div className="mt-5 space-y-5">
            {couponOpen ? (
              <CouponForm coupon={cart.coupon} variant="desktop" />
            ) : (
              <p className="text-center text-sm text-fg">
                Tem um código promocional?{' '}
                <button
                  type="button"
                  onClick={() => setCouponOpen(true)}
                  className="text-fg hover:text-fg-accent hover:underline"
                >
                  Aplique aqui
                </button>
              </p>
            )}
            <SummaryRows
              summary={cart.summary}
              discountLabel={cart.coupon?.description}
              variant="desktop"
            />
          </div>
          <div className="mt-6">
            <ProviderPicker
              variant="desktop"
              value={provider}
              onChange={(value) =>
                form.setValue('provider', value, { shouldValidate: form.formState.isSubmitted })
              }
              error={form.formState.errors.provider?.message}
              inputProps={{ form: 'checkout-form' }}
            />
          </div>
          {pageError && <CheckoutAlert message={pageError} />}
          <button
            type="submit"
            form="checkout-form"
            disabled={reviewing}
            aria-busy={reviewing}
            className={`mt-6 ${confirmButtonClass.desktop}`}
          >
            {reviewing ? 'Conectando carteira…' : 'Confirmar compra'}
          </button>
        </aside>
      </div>
    </>
  )
}

function MobileHeader({ title }: { title: string }) {
  return (
    <div className="mt-8 grid grid-cols-[2.1875rem_1fr_2.1875rem] items-center gap-2">
      <BackButton />
      <h1 className="text-center text-[clamp(1.0625rem,5vw,1.25rem)] leading-6 font-bold whitespace-nowrap text-fg">
        {title}
      </h1>
    </div>
  )
}

function MobileCollectorStep({
  form,
  onContinue,
}: {
  form: UseFormReturn<CheckoutFormValues>
  onContinue: () => void
}) {
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onContinue()
      }}
      className="pb-28"
    >
      <MobileHeader title="Dados do colecionador" />
      <p className="mt-6 text-sm text-fg-muted">Etapa 1 de 2 · depois você escolhe a carteira.</p>
      <div className="mt-6 flex flex-col gap-5">
        <DisplayNameField form={form} variant="mobile" />
        <UsernameField form={form} variant="mobile" />
        <ProfileNameField form={form} variant="mobile" />
        <EmailField form={form} variant="mobile" />
        <ReferralCodeField form={form} variant="mobile" />
        <EnsNameField form={form} variant="mobile" />
        <SecondaryWalletField form={form} variant="mobile" />
        <NoteField form={form} variant="mobile" />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 bg-bg px-7 pt-3 pb-8">
        <button type="submit" className={confirmButtonClass.mobile}>
          Continuar para a carteira
        </button>
      </div>
    </form>
  )
}

function MobileWalletStep({
  form,
  cart,
  wallets,
  walletsPending,
  reviewing,
  pageError,
  onSubmit,
}: StepProps) {
  const walletId = form.watch('walletId')
  const provider = form.watch('provider')
  const useOther = form.watch('useOtherWallet')

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className="pb-32"
    >
      <MobileHeader title="Pagamento com carteira" />
      <div className="mt-8 flex flex-col gap-6">
        {walletsPending ? (
          <Skeleton className="h-48 rounded-[14px]" />
        ) : (
          <SavedWalletPicker
            wallets={useOther ? [] : wallets}
            value={walletId}
            onChange={(id) => selectSavedWallet(form, wallets, id)}
            error={form.formState.errors.walletId?.message}
          />
        )}
        <OtherWalletToggle form={form} />
        {useOther && (
          <div className="flex flex-col gap-5">
            <AddressField form={form} variant="mobile" wallets={wallets} />
            <NetworkField form={form} variant="mobile" />
          </div>
        )}
        <ProviderPicker
          variant="mobile"
          value={provider}
          onChange={(value) =>
            form.setValue('provider', value, { shouldValidate: form.formState.isSubmitted })
          }
          error={form.formState.errors.provider?.message}
        />
        <p className="flex items-baseline justify-end gap-7 leading-4 font-bold">
          <span className="text-base text-fg">Total:</span>
          <span className="text-lg text-fg-accent">{formatEth(cart.summary.total)}</span>
        </p>
        {pageError && <CheckoutAlert message={pageError} />}
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 bg-bg px-7 pt-3 pb-8">
        <button
          type="submit"
          disabled={reviewing}
          aria-busy={reviewing}
          className={confirmButtonClass.mobile}
        >
          {reviewing ? 'Conectando carteira…' : 'Confirmar compra'}
        </button>
      </div>
    </form>
  )
}

/**
 * An order sent earlier in this tab never got its answer (timeout, closed tab). Resuming
 * sends the same attempt again, so the API returns that order instead of creating another.
 */
function PendingAttemptNotice({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const placeOrder = usePlaceOrder(userId)
  const [attempt, setAttempt] = useState<OrderAttempt | null>(() => readOrderAttempt(userId))
  if (!attempt) return null

  return (
    <div
      role="status"
      className="mt-6 flex flex-col gap-3 rounded-[8px] border border-primary/60 p-4 text-sm text-fg md:flex-row md:items-center md:justify-between"
    >
      <p>
        Uma compra foi enviada e ainda não recebemos a confirmação. Retome para ver o resultado sem
        pagar duas vezes.
        {placeOrder.isError && (
          <span className="mt-1 block text-required">{toApiError(placeOrder.error).message}</span>
        )}
      </p>
      <button
        type="button"
        disabled={placeOrder.isPending}
        onClick={() =>
          placeOrder.mutate(attempt.input, {
            onSuccess: (order) => {
              setAttempt(null)
              void navigate({ to: '/pedidos/$orderId', params: { orderId: order.id } })
            },
          })
        }
        className="h-10 shrink-0 rounded-[6px] bg-primary px-4 font-bold text-primary-fg hover:bg-primary/90 disabled:opacity-60"
      >
        {placeOrder.isPending ? 'Retomando…' : 'Retomar compra'}
      </button>
    </div>
  )
}

function CheckoutAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="mt-4 space-y-1 text-sm text-required">
      <p>{message}</p>
      <Link to="/carrinho" className="font-bold text-fg-accent hover:underline">
        Revisar carrinho
      </Link>
    </div>
  )
}

function CheckoutMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-10 flex min-h-72 flex-col items-center justify-center gap-4 rounded-[8px] bg-surface px-6 text-center">
      <h1 className="text-lg font-bold text-fg">{title}</h1>
      {children}
    </div>
  )
}

function CheckoutSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando pagamento" className="mt-10">
      <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
        <div className="grid flex-1 grid-cols-1 gap-5 md:grid-cols-2 lg:max-w-[47.6875rem]">
          {Array.from({ length: 10 }, (_, index) => (
            <Skeleton key={index} className="h-[3.875rem]" />
          ))}
        </div>
        <div className="hidden space-y-3 md:block lg:w-[25.3125rem]">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-[4.375rem] rounded-none" />
          ))}
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  )
}

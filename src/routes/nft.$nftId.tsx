import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { NftDetailPage } from '@/features/nft/pages/nft-detail-page'

/** The chosen edition lives in the URL, so a shared link opens the same edition. */
const detailSearchSchema = z.object({
  edicao: z.string().max(80).optional().catch(undefined),
})

export const Route = createFileRoute('/nft/$nftId')({
  validateSearch: detailSearchSchema,
  staticData: {
    layout: {
      header: true,
      footer: true,
      bottomNav: false,
    },
  },
  component: NftDetailPage,
})

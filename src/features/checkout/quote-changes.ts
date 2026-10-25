import type { Quote } from '@/features/checkout/types/checkout'
import { formatEth } from '@/lib/eth'

/** What changed between the reviewed quote and the current one, in words. */
export function quoteChanges(previous: Quote, current: Quote): string[] {
  const changes: string[] = []
  for (const item of current.items) {
    const before = previous.items.find((candidate) => candidate.id === item.id)
    if (before && before.unitPrice !== item.unitPrice) {
      changes.push(
        `${item.nft.name}: ${formatEth(before.unitPrice)} → ${formatEth(item.unitPrice)}`,
      )
    }
    if (item.issue) changes.push(`${item.nft.name}: sem estoque suficiente`)
  }
  for (const item of previous.items) {
    if (!current.items.some((candidate) => candidate.id === item.id)) {
      changes.push(`${item.nft.name} saiu do carrinho`)
    }
  }
  if (previous.summary.total !== current.summary.total) {
    changes.push(
      `Total: ${formatEth(previous.summary.total)} → ${formatEth(current.summary.total)}`,
    )
  }
  return changes
}

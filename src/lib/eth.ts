import Decimal from 'decimal.js'

/**
 * Formats a decimal ETH string for display with at least two decimals, e.g. "1.19 ETH",
 * keeping up to four when a value needs them (network fees such as "0.016 ETH").
 */
export function formatEth(value: string): string {
  const amount = new Decimal(value)
  const places = Math.min(4, Math.max(2, amount.decimalPlaces()))
  return `${amount.toFixed(places)} ETH`
}

/** Amount with two decimals and a comma separator, as shown in the price filter. */
export function formatEthLocale(value: string): string {
  return new Decimal(value).toFixed(2).replace('.', ',')
}

/** ETH string to integer hundredths, for range inputs that need whole steps. */
export function ethToCents(value: string): number {
  return new Decimal(value).times(100).round().toNumber()
}

export function centsToEth(cents: number): string {
  return new Decimal(cents).dividedBy(100).toFixed(2)
}

/** Total for `quantity` units, kept as a decimal string. */
export function multiplyEth(value: string, quantity: number): string {
  return new Decimal(value).times(quantity).toFixed(2)
}

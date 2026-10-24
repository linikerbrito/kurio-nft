import Decimal from 'decimal.js'

/** Formats a decimal ETH string for display, e.g. "1.19 ETH". */
export function formatEth(value: string): string {
  return `${new Decimal(value).toFixed(2)} ETH`
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

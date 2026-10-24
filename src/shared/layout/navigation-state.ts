export function isMarketPath(pathname: string): boolean {
  return pathname.startsWith('/nft/') || pathname === '/carrinho' || pathname === '/pagamento'
}

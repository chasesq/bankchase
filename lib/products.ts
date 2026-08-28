export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  currency: string
}

export const PRODUCTS: Product[] = [
  { id: 'bankchase-pro', name: 'BankChase Pro', description: 'Advanced account and payment tools for growing businesses.', priceInCents: 2900, currency: 'usd' },
  { id: 'bankchase-business', name: 'BankChase Business', description: 'Full treasury, Connect, and automated reconciliation controls.', priceInCents: 9900, currency: 'usd' },
]

export function getProduct(id: unknown) {
  return PRODUCTS.find((product) => product.id === id)
}

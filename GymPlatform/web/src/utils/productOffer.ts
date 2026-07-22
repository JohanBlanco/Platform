export function applyOfferToPrice(base: number, product: { offerActive?: boolean; offerPercent?: number | null }) {
  if (!product.offerActive || !product.offerPercent || product.offerPercent <= 0) {
    return base
  }
  return Math.round(base * (100 - product.offerPercent) / 100)
}

export function productOfferBadge(product: {
  offerActive?: boolean
  offerPercent?: number | null
  offerBadge?: string | null
}) {
  if (!product.offerActive) return null
  if (product.offerBadge?.trim()) return product.offerBadge.trim()
  if (product.offerPercent) return `${product.offerPercent}% OFF`
  return null
}

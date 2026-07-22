/** Utilidades de precios con I.V.A. / valores agregados opcionales. */

export type PriceAddon = {
  name: string
  percent: number
}

export const DEFAULT_IVA_PERCENT = 13

export function priceWithIva(base: number, applyIva?: boolean, ivaPercent?: number | null): number {
  const safe = Number.isFinite(base) ? base : 0
  if (!applyIva) return Math.round(safe * 100) / 100
  const pct = Number.isFinite(Number(ivaPercent)) ? Number(ivaPercent) : DEFAULT_IVA_PERCENT
  if (pct <= 0) return Math.round(safe * 100) / 100
  return Math.round((safe + safe * (pct / 100)) * 100) / 100
}

/** Preferir applyIva del API; si no viene, usar priceAddons. */
export function resolveSalePrice(
  base: number,
  opts?: {
    applyIva?: boolean
    ivaPercent?: number | null
    priceAddons?: PriceAddon[] | null
    priceWithAddons?: number | null
  },
): number {
  if (opts?.priceWithAddons != null && Number.isFinite(opts.priceWithAddons)) {
    return opts.priceWithAddons
  }
  if (opts?.applyIva) {
    return priceWithIva(base, true, opts.ivaPercent)
  }
  if (opts?.priceAddons?.length) {
    return priceWithAddons(base, opts.priceAddons)
  }
  return Math.round((Number.isFinite(base) ? base : 0) * 100) / 100
}

export function priceWithAddons(base: number, addons?: PriceAddon[] | null): number {
  const safe = Number.isFinite(base) ? base : 0
  if (!addons?.length) return Math.round(safe * 100) / 100
  const extra = addons.reduce((sum, a) => {
    const pct = Number(a.percent) || 0
    return sum + safe * (pct / 100)
  }, 0)
  return Math.round((safe + extra) * 100) / 100
}

export function describeIva(applyIva?: boolean, ivaPercent?: number | null, addons?: PriceAddon[] | null): string {
  if (applyIva) {
    const pct = Number.isFinite(Number(ivaPercent)) ? Number(ivaPercent) : DEFAULT_IVA_PERCENT
    return `I.V.A. ${pct}%`
  }
  return describePriceAddons(addons)
}

export function describePriceAddons(addons?: PriceAddon[] | null): string {
  if (!addons?.length) return ''
  return addons.map((a) => `${a.name} ${Number(a.percent)}%`).join(', ')
}

export function ivaPayload(enabled: boolean, percentStr: string): {
  applyIva: boolean
  ivaPercent: number | null
  priceAddons: PriceAddon[]
} {
  if (!enabled) {
    return { applyIva: false, ivaPercent: null, priceAddons: [] }
  }
  const percent = parseFloat(percentStr)
  const safe = Number.isFinite(percent) && percent >= 0 ? percent : DEFAULT_IVA_PERCENT
  return {
    applyIva: true,
    ivaPercent: safe,
    priceAddons: [{ name: 'I.V.A.', percent: safe }],
  }
}

export function readIvaFromProduct(item: {
  applyIva?: boolean
  ivaPercent?: number | null
  priceAddons?: PriceAddon[] | null
}): { enabled: boolean; percent: string } {
  if (item.applyIva) {
    return {
      enabled: true,
      percent: String(item.ivaPercent ?? DEFAULT_IVA_PERCENT),
    }
  }
  const iva = item.priceAddons?.find(
    (a) => a.name.toUpperCase().includes('I.V.A') || a.name.toUpperCase() === 'IVA',
  )
  if (!iva) return { enabled: false, percent: String(DEFAULT_IVA_PERCENT) }
  return { enabled: true, percent: String(iva.percent ?? DEFAULT_IVA_PERCENT) }
}

export function formatMoney(value: number) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

/** Eje de gráficas: “₡240 mil” en vez de “240k”. */
export function formatMoneyAxis(value: number) {
  const n = Math.abs(Number(value) || 0)
  if (n >= 1_000_000) {
    const mills = n / 1_000_000
    const text = Number.isInteger(mills) ? String(mills) : mills.toFixed(1).replace(/\.0$/, '')
    return `₡${text} mill.`
  }
  if (n >= 1000) {
    return `₡${Math.round(n / 1000)} mil`
  }
  return formatMoney(n)
}

/**
 * Monto seguro para jsPDF (Helvetica no incluye ₡ ni espacios tipográficos de es-CR).
 */
export function formatMoneyPdf(value: number) {
  const n = new Intl.NumberFormat('es-CR', {
    maximumFractionDigits: 0,
    useGrouping: true,
  })
    .format(value || 0)
    .replace(/[\u00A0\u202F\u2009]/g, ' ')
  return `CRC ${n}`
}

/** Lee un archivo de imagen y lo convierte a data URL (máx. ~2 MB). */
export function readImageFileAsDataUrl(file: File, maxBytes = 2_000_000): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo debe ser una imagen'))
      return
    }
    if (file.size > maxBytes) {
      reject(new Error('La imagen es demasiado grande (máx. 2 MB)'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string' || !result.startsWith('data:image/')) {
        reject(new Error('No se pudo leer la imagen'))
        return
      }
      resolve(result)
    }
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'))
    reader.readAsDataURL(file)
  })
}

export function paymentMethodLabel(method?: string | null): string {
  if (method === 'CASH') return 'Efectivo'
  if (method === 'CARD') return 'Tarjeta'
  if (method === 'SINPE') return 'SINPE'
  return '—'
}

export function formatSalePaymentsSummary(
  payments?: Array<{ method: string; amount: number }> | null,
  fallbackMethod?: string | null,
  total?: number,
): string {
  if (payments && payments.length > 0) {
    return payments
      .map((p) => `${paymentMethodLabel(p.method)} ${formatPlain(p.amount)}`)
      .join(' + ')
  }
  if (fallbackMethod) {
    return paymentMethodLabel(fallbackMethod)
  }
  return '—'
}

function formatPlain(n: number) {
  return new Intl.NumberFormat('es-CR', { maximumFractionDigits: 0 }).format(n || 0)
}

export function saleHasSinpePayment(sale: {
  paymentMethod?: string | null
  payments?: Array<{ method: string }> | null
}): boolean {
  if (sale.payments?.some((p) => p.method === 'SINPE')) return true
  return sale.paymentMethod === 'SINPE'
}

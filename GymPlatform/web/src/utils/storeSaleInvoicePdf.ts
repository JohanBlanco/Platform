import type { jsPDF } from 'jspdf'
import type { StoreSale } from '../types'
import { formatMoney, formatMoneyPdf } from './money'
import {
  createBrandedPdfDoc,
  drawPdfClosingNote,
  drawPdfFooter,
  drawPdfMetaCard,
  drawPdfSectionTitle,
  formatPdfDateTime,
  readThemeAccentHex,
  type PdfBrandOptions,
} from './pdfBrand'

export type InvoicePdfOptions = PdfBrandOptions

export type ShareInvoiceWhatsAppResult =
  | { ok: true; mode: 'share' | 'download-and-chat' }
  | { ok: false; reason: 'no-phone' | 'cancelled' | 'error' }

function invoiceFilename(sale: StoreSale) {
  return `factura-venta-${sale.id}.pdf`
}

function normalizeOptions(options: InvoicePdfOptions | string = {}): InvoicePdfOptions {
  return typeof options === 'string' ? { gymName: options } : options
}

/**
 * Genera el PDF de factura (mismo documento para descarga y envío por WhatsApp).
 */
export function buildStoreSaleInvoicePdf(
  sale: StoreSale,
  options: InvoicePdfOptions | string = {},
): jsPDF {
  const opts = normalizeOptions(options)
  const gymName = opts.gymName?.trim() || 'GymPlatform'
  const accentHex = opts.accentHex || readThemeAccentHex()

  const ctx = createBrandedPdfDoc('Comprobante de venta', {
    gymName,
    accentHex,
    badge: `N.º ${sale.id}`,
  })
  const { doc, palette, margin, contentW, getY, setY, ensureSpace } = ctx

  const metaFields = [
    { label: 'Fecha', value: formatPdfDateTime(sale.createdAt) },
    { label: 'Cajero', value: sale.createdByName || '—' },
  ]
  if (sale.memberName) {
    metaFields.push(
      { label: 'Cliente', value: sale.memberName },
      { label: 'Tipo', value: 'Venta en tienda' },
    )
  }
  drawPdfMetaCard(ctx, metaFields)

  drawPdfSectionTitle(ctx, 'Detalle de la compra')

  const colQty = margin
  const colDesc = margin + 16
  const colUnit = margin + contentW - 58
  const colTotal = margin + contentW - 4
  const tableHeaderH = 8

  ensureSpace(tableHeaderH + 20)
  let y = getY()
  doc.setFillColor(...palette.accent)
  doc.roundedRect(margin, y, contentW, tableHeaderH, 1.5, 1.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  const headerBaseline = y + 5.3
  doc.text('CANT.', colQty + 3, headerBaseline)
  doc.text('DESCRIPCIÓN', colDesc, headerBaseline)
  doc.text('P. UNIT.', colUnit, headerBaseline, { align: 'right' })
  doc.text('TOTAL', colTotal, headerBaseline, { align: 'right' })
  setY(y + tableHeaderH + 1)

  const descMaxW = colUnit - colDesc - 4

  sale.items.forEach((item, index) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const descLines = doc.splitTextToSize(item.description, descMaxW) as string[]
    const rowH = Math.max(9, descLines.length * 4.2 + 4)

    ensureSpace(rowH + 2)
    y = getY()

    if (index % 2 === 0) {
      doc.setFillColor(...palette.accentSoft)
      doc.rect(margin, y, contentW, rowH, 'F')
    }

    const baseline = y + 5.5
    doc.setTextColor(...palette.ink)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(String(item.quantity), colQty + 8, baseline, { align: 'center' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    let ly = baseline
    for (const lineText of descLines) {
      doc.text(lineText, colDesc, ly)
      ly += 4.2
    }

    doc.setTextColor(...palette.muted)
    doc.setFontSize(8.5)
    doc.text(formatMoneyPdf(item.unitPrice), colUnit, baseline, { align: 'right' })

    doc.setTextColor(...palette.ink)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(formatMoneyPdf(item.lineTotal), colTotal, baseline, { align: 'right' })

    setY(y + rowH)
    doc.setDrawColor(...palette.line)
    doc.setLineWidth(0.2)
    doc.line(margin, getY(), margin + contentW, getY())
  })

  setY(getY() + 8)

  ensureSpace(28)
  y = getY()
  const totalsW = 72
  const totalsX = margin + contentW - totalsW
  doc.setFillColor(...palette.accentMid)
  doc.roundedRect(totalsX, y, totalsW, 22, 2.5, 2.5, 'F')
  doc.setFillColor(...palette.accent)
  doc.roundedRect(totalsX, y + 10, totalsW, 12, 2.5, 2.5, 'F')
  doc.setFillColor(...palette.accent)
  doc.rect(totalsX, y + 10, totalsW, 4, 'F')

  doc.setTextColor(...palette.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`${sale.items.length} ítem${sale.items.length === 1 ? '' : 's'}`, totalsX + 4, y + 7)

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('TOTAL', totalsX + 4, y + 17.5)
  doc.setFontSize(12)
  doc.text(formatMoneyPdf(sale.total), totalsX + totalsW - 4, y + 18, { align: 'right' })

  setY(y + 30)

  if (sale.notes?.trim()) {
    ensureSpace(16)
    y = getY()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...palette.muted)
    doc.text('NOTAS', margin, y)
    setY(y + 4)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...palette.ink)
    const noteLines = doc.splitTextToSize(sale.notes.trim(), contentW) as string[]
    for (const nl of noteLines) {
      ensureSpace(5)
      y = getY()
      doc.text(nl, margin, y)
      setY(y + 4.5)
    }
    setY(getY() + 4)
  }

  drawPdfClosingNote(
    ctx,
    'Gracias por su compra',
    'Conserve este comprobante como respaldo de su pago.',
  )
  drawPdfFooter(ctx)

  return doc
}

export function storeSaleInvoicePdfBlob(
  sale: StoreSale,
  options: InvoicePdfOptions | string = {},
): Blob {
  return buildStoreSaleInvoicePdf(sale, options).output('blob')
}

export function downloadStoreSaleInvoicePdf(
  sale: StoreSale,
  options: InvoicePdfOptions | string = {},
) {
  buildStoreSaleInvoicePdf(sale, options).save(invoiceFilename(sale))
}

export function buildStoreSaleWhatsAppMessage(sale: StoreSale, gymName = 'GymPlatform'): string {
  const lines = [
    `*${gymName}*`,
    `Comprobante de venta #${sale.id}`,
    `Fecha: ${formatPdfDateTime(sale.createdAt)}`,
    sale.memberName ? `Cliente: ${sale.memberName}` : null,
    '',
    '*Detalle*',
    ...sale.items.map(
      (item) => `• ${item.quantity}× ${item.description} — ${formatMoney(item.lineTotal)}`,
    ),
    '',
    `*Total: ${formatMoney(sale.total)}*`,
    '',
    'Gracias por su compra.',
  ]
  return lines.filter((l) => l != null).join('\n')
}

/** Mensaje corto al enviar el PDF (el archivo va adjunto o descargado). */
export function buildStoreSaleWhatsAppPdfNote(sale: StoreSale, gymName = 'GymPlatform'): string {
  return [
    `*${gymName}*`,
    `Comprobante de venta #${sale.id} (PDF)`,
    `Total: ${formatMoney(sale.total)}`,
    '',
    'Adjunto el PDF de su factura. ¡Gracias por su compra!',
  ].join('\n')
}

export function buildWhatsAppChatUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '')
  if (!digits) throw new Error('Número de WhatsApp inválido')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

/**
 * Envía / comparte el PDF de la factura por WhatsApp.
 * - Si el navegador permite compartir archivos (p. ej. móvil), adjunta el PDF.
 * - Si no, descarga el PDF y abre el chat con un mensaje para adjuntarlo.
 */
export async function shareStoreSaleInvoiceViaWhatsApp(
  sale: StoreSale,
  phone: string | null | undefined,
  options: InvoicePdfOptions | string = {},
): Promise<ShareInvoiceWhatsAppResult> {
  const trimmed = phone?.trim()
  if (!trimmed) return { ok: false, reason: 'no-phone' }

  const opts = normalizeOptions(options)
  const gymName = opts.gymName?.trim() || 'GymPlatform'
  const filename = invoiceFilename(sale)
  const blob = storeSaleInvoicePdfBlob(sale, opts)
  const file = new File([blob], filename, { type: 'application/pdf' })
  const note = buildStoreSaleWhatsAppPdfNote(sale, gymName)

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })

  if (canShareFiles) {
    try {
      await navigator.share({
        files: [file],
        title: `Factura #${sale.id}`,
        text: note,
      })
      return { ok: true, mode: 'share' }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { ok: false, reason: 'cancelled' }
      }
      // Continúa al fallback
    }
  }

  try {
    buildStoreSaleInvoicePdf(sale, opts).save(filename)
    const url = buildWhatsAppChatUrl(trimmed, note)
    window.open(url, '_blank', 'noopener,noreferrer')
    return { ok: true, mode: 'download-and-chat' }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

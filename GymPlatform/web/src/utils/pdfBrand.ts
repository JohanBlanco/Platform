import { jsPDF } from 'jspdf'

export type Rgb = [number, number, number]

export type PdfBrandPalette = {
  accent: Rgb
  accentSoft: Rgb
  accentMid: Rgb
  ink: Rgb
  muted: Rgb
  line: Rgb
}

export type PdfBrandOptions = {
  gymName?: string
  accentHex?: string
}

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16),
    ]
  }
  if (clean.length === 6) {
    return [
      parseInt(clean.slice(0, 2), 16),
      parseInt(clean.slice(2, 4), 16),
      parseInt(clean.slice(4, 6), 16),
    ]
  }
  return [99, 102, 241]
}

export function lighten(rgb: Rgb, amount: number): Rgb {
  return [
    Math.min(255, Math.round(rgb[0] + (255 - rgb[0]) * amount)),
    Math.min(255, Math.round(rgb[1] + (255 - rgb[1]) * amount)),
    Math.min(255, Math.round(rgb[2] + (255 - rgb[2]) * amount)),
  ]
}

export function createPdfPalette(accentHex = '#6366f1'): PdfBrandPalette {
  const accent = hexToRgb(accentHex)
  return {
    accent,
    accentSoft: lighten(accent, 0.88),
    accentMid: lighten(accent, 0.72),
    ink: [30, 41, 59],
    muted: [100, 116, 139],
    line: [226, 232, 240],
  }
}

export function readThemeAccentHex(): string {
  if (typeof document === 'undefined') return '#6366f1'
  return getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#6366f1'
}

export function formatPdfDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-CR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/** Contexto de página A4 con el encabezado de marca del producto. */
export function createBrandedPdfDoc(
  subtitle: string,
  options: PdfBrandOptions & { badge?: string } = {},
) {
  const gymName = options.gymName?.trim() || 'GymPlatform'
  const palette = createPdfPalette(options.accentHex || '#6366f1')
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 16
  const contentW = pageW - margin * 2

  // Header band
  doc.setFillColor(...palette.accent)
  doc.rect(0, 0, pageW, 42, 'F')
  doc.setFillColor(...lighten(palette.accent, 0.18))
  doc.rect(0, 38, pageW, 4, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(gymName, margin, 18)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(subtitle, margin, 26)

  if (options.badge) {
    const badgeLabel = options.badge
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    const badgeW = Math.max(28, doc.getTextWidth(badgeLabel) + 10)
    const badgeX = pageW - margin - badgeW
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(badgeX, 12, badgeW, 10, 2, 2, 'F')
    doc.setTextColor(...palette.accent)
    doc.text(badgeLabel, badgeX + badgeW / 2, 18.5, { align: 'center' })
  }

  let y = 52

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - 22) {
      doc.addPage()
      y = 18
    }
  }

  return {
    doc,
    palette,
    gymName,
    pageW,
    pageH,
    margin,
    contentW,
    getY: () => y,
    setY: (next: number) => {
      y = next
    },
    ensureSpace,
  }
}

export type PdfMetaField = { label: string; value: string }

/** Tarjeta de metadatos (2 columnas), igual que la factura. */
export function drawPdfMetaCard(
  ctx: ReturnType<typeof createBrandedPdfDoc>,
  fields: PdfMetaField[],
) {
  const { doc, palette, margin, contentW, getY, setY, ensureSpace } = ctx
  const rows = Math.ceil(fields.length / 2)
  const cardH = Math.max(22, 6 + rows * 13)
  ensureSpace(cardH + 4)

  let y = getY()
  doc.setFillColor(...palette.accentSoft)
  doc.roundedRect(margin, y, contentW, cardH, 2.5, 2.5, 'F')

  const col1 = margin + 4
  const col2 = margin + contentW / 2 + 2
  let metaY = y + 7

  for (let i = 0; i < fields.length; i += 2) {
    const left = fields[i]
    const right = fields[i + 1]

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...palette.muted)
    doc.text(left.label.toUpperCase(), col1, metaY)
    if (right) doc.text(right.label.toUpperCase(), col2, metaY)
    metaY += 5

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(...palette.ink)
    doc.text(left.value || '—', col1, metaY, { maxWidth: contentW / 2 - 10 })
    if (right) doc.text(right.value || '—', col2, metaY, { maxWidth: contentW / 2 - 8 })
    metaY += 8
  }

  setY(y + cardH + 10)
}

export function drawPdfSectionTitle(
  ctx: ReturnType<typeof createBrandedPdfDoc>,
  title: string,
) {
  const { doc, palette, margin, getY, setY, ensureSpace } = ctx
  ensureSpace(14)
  let y = getY()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...palette.ink)
  doc.text(title, margin, y)
  y += 2
  doc.setDrawColor(...palette.accent)
  doc.setLineWidth(0.6)
  doc.line(margin, y, margin + Math.min(36, title.length * 2.2), y)
  setY(y + 6)
}

export function drawPdfClosingNote(
  ctx: ReturnType<typeof createBrandedPdfDoc>,
  title: string,
  subtitle: string,
) {
  const { doc, palette, margin, contentW, pageW, getY, setY, ensureSpace } = ctx
  ensureSpace(20)
  let y = getY()
  doc.setDrawColor(...palette.accentMid)
  doc.setLineWidth(0.3)
  doc.setLineDashPattern([1.2, 1.2], 0)
  doc.line(margin, y, margin + contentW, y)
  doc.setLineDashPattern([], 0)
  y += 8
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...palette.accent)
  doc.text(title, pageW / 2, y, { align: 'center' })
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...palette.muted)
  doc.text(subtitle, pageW / 2, y, { align: 'center' })
  setY(y + 4)
}

export function drawPdfFooter(ctx: ReturnType<typeof createBrandedPdfDoc>) {
  const { doc, palette, gymName, pageW, pageH, margin } = ctx
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(...palette.muted)
    doc.setLineWidth(0.2)
    doc.line(margin, pageH - 14, pageW - margin, pageH - 14)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...palette.muted)
    doc.text(gymName, margin, pageH - 9)
    doc.text(`Página ${i} de ${pages}`, pageW - margin, pageH - 9, { align: 'right' })
  }
}

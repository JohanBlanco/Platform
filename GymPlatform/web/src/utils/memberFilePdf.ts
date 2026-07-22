import type { jsPDF } from 'jspdf'
import type { FormField, MemberFileDetail } from '../types'
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

function formatAnswer(field: FormField, value: unknown): string {
  if (value == null || value === '') return '—'
  if (field.type === 'CHECKBOX') return value ? 'Sí' : 'No'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  return String(value)
}

function memberFilePdfFilename(detail: MemberFileDetail) {
  const safeUser = detail.userFullName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
  const safeForm = detail.formTitle.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
  return `${safeForm}-${safeUser}.pdf`
}

/**
 * Genera el PDF del expediente (mismo documento para vista previa y descarga).
 */
export function buildMemberFilePdf(detail: MemberFileDetail, options: PdfBrandOptions = {}): jsPDF {
  const gymName = options.gymName?.trim() || detail.organizationName || 'GymPlatform'
  const accentHex = options.accentHex || readThemeAccentHex()

  const ctx = createBrandedPdfDoc('Expediente · formulario', {
    gymName,
    accentHex,
    badge: `N.º ${detail.id}`,
  })
  const { doc, palette, margin, contentW, getY, setY, ensureSpace } = ctx

  drawPdfMetaCard(ctx, [
    { label: 'Fecha de envío', value: formatPdfDateTime(detail.createdAt) },
    { label: 'Formulario', value: detail.formTitle },
    { label: 'Miembro', value: detail.userFullName },
    { label: 'Correo', value: detail.userEmail },
  ])

  if (detail.formDescription?.trim()) {
    ensureSpace(16)
    let y = getY()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...palette.muted)
    const descLines = doc.splitTextToSize(detail.formDescription.trim(), contentW) as string[]
    for (const line of descLines) {
      ensureSpace(5)
      y = getY()
      doc.text(line, margin, y)
      setY(y + 4.2)
    }
    setY(getY() + 4)
  }

  drawPdfSectionTitle(ctx, 'Respuestas del formulario')

  ensureSpace(10)
  let y = getY()
  doc.setFillColor(...palette.accent)
  doc.roundedRect(margin, y, contentW, 8, 1.5, 1.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('CAMPO', margin + 3, y + 5.3)
  doc.text('RESPUESTA', margin + contentW * 0.42, y + 5.3)
  setY(y + 9)

  let rowIndex = 0

  for (const field of detail.fields) {
    if (field.type === 'HEADING') {
      ensureSpace(14)
      y = getY()
      setY(y + 3)
      y = getY()
      doc.setFillColor(...palette.accentMid)
      doc.roundedRect(margin, y, contentW, 8, 1.5, 1.5, 'F')
      doc.setTextColor(...palette.ink)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(field.label, margin + 3, y + 5.3, { maxWidth: contentW - 6 })
      setY(y + 11)
      continue
    }

    const value = detail.answers[field.id]
    if (value == null || value === '') continue

    const isSignature =
      field.type === 'SIGNATURE' && typeof value === 'string' && value.startsWith('data:image')

    if (isSignature) {
      ensureSpace(42)
      y = getY()
      if (rowIndex % 2 === 0) {
        doc.setFillColor(...palette.accentSoft)
        doc.rect(margin, y, contentW, 40, 'F')
      }
      doc.setTextColor(...palette.muted)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text(field.label.toUpperCase(), margin + 3, y + 5)
      try {
        doc.addImage(value, 'PNG', margin + 3, y + 8, 72, 28)
      } catch {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(...palette.ink)
        doc.text('Firma no disponible', margin + 3, y + 18)
      }
      setY(y + 42)
      doc.setDrawColor(...palette.line)
      doc.setLineWidth(0.2)
      doc.line(margin, getY(), margin + contentW, getY())
      rowIndex += 1
      continue
    }

    const answer = formatAnswer(field, value)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    const labelColW = contentW * 0.38
    const valueColW = contentW * 0.55
    const labelLines = doc.splitTextToSize(field.label, labelColW - 4) as string[]
    const valueLines = doc.splitTextToSize(answer, valueColW - 4) as string[]
    const rowH = Math.max(10, Math.max(labelLines.length, valueLines.length) * 4.2 + 5)

    ensureSpace(rowH + 2)
    y = getY()

    if (rowIndex % 2 === 0) {
      doc.setFillColor(...palette.accentSoft)
      doc.rect(margin, y, contentW, rowH, 'F')
    }

    const baseline = y + 5.5
    doc.setTextColor(...palette.muted)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    let ly = baseline
    for (const line of labelLines) {
      doc.text(line, margin + 3, ly)
      ly += 4.2
    }

    doc.setTextColor(...palette.ink)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    let vy = baseline
    for (const line of valueLines) {
      doc.text(line, margin + contentW * 0.42, vy)
      vy += 4.2
    }

    setY(y + rowH)
    doc.setDrawColor(...palette.line)
    doc.setLineWidth(0.2)
    doc.line(margin, getY(), margin + contentW, getY())
    rowIndex += 1
  }

  if (rowIndex === 0) {
    ensureSpace(10)
    y = getY()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...palette.muted)
    doc.text('Sin respuestas registradas.', margin, y)
    setY(y + 8)
  }

  setY(getY() + 6)
  drawPdfClosingNote(
    ctx,
    'Expediente generado por GymPlatform',
    'Documento de respaldo del formulario del miembro.',
  )
  drawPdfFooter(ctx)

  return doc
}

export function memberFilePdfBlob(detail: MemberFileDetail, options: PdfBrandOptions = {}): Blob {
  return buildMemberFilePdf(detail, options).output('blob')
}

export function downloadMemberFilePdf(detail: MemberFileDetail, options: PdfBrandOptions = {}) {
  buildMemberFilePdf(detail, options).save(memberFilePdfFilename(detail))
}

export function formatFieldAnswer(field: FormField, value: unknown): string {
  return formatAnswer(field, value)
}

export function isSignatureValue(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:image')
}

import {
  createBrandedPdfDoc,
  drawPdfFooter,
  readThemeAccentHex,
  type PdfBrandOptions,
} from './pdfBrand'

export type FormQrPdfOptions = PdfBrandOptions & {
  formTitle: string
  formUrl: string
  formSlug?: string
}

async function loadViaCanvas(src: string): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || 600
        canvas.height = img.naturalHeight || 600
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No se pudo preparar el código QR'))
          return
        }
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch (err) {
        reject(err instanceof Error ? err : new Error('No se pudo leer el código QR'))
      }
    }
    img.onerror = () => reject(new Error('No se pudo cargar el código QR'))
    img.src = src
  })
}

async function loadViaFetch(src: string): Promise<string> {
  const response = await fetch(src)
  if (!response.ok) {
    throw new Error('No se pudo cargar el código QR')
  }
  const blob = await response.blob()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No se pudo leer el código QR'))
    reader.readAsDataURL(blob)
  })
}

async function loadImageAsDataUrl(src: string): Promise<string> {
  try {
    return await loadViaCanvas(src)
  } catch {
    return await loadViaFetch(src)
  }
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'formulario'
}

/**
 * PDF imprimible con QR grande, título del formulario y URL.
 */
export async function downloadFormQrPdf(options: FormQrPdfOptions) {
  const formTitle = options.formTitle.trim() || 'Formulario público'
  const formUrl = options.formUrl.trim()
  if (!formUrl) {
    throw new Error('Falta el enlace del formulario')
  }

  const printQrSrc =
    `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=12&data=${encodeURIComponent(formUrl)}`
  const qrDataUrl = await loadImageAsDataUrl(printQrSrc)

  const ctx = createBrandedPdfDoc('Código QR · formulario', {
    gymName: options.gymName,
    accentHex: options.accentHex || readThemeAccentHex(),
  })
  const { doc, palette, margin, contentW, pageW, setY, getY } = ctx

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...palette.ink)
  const titleLines = doc.splitTextToSize(formTitle, contentW)
  doc.text(titleLines, margin, getY() + 2)
  setY(getY() + titleLines.length * 7 + 4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(...palette.muted)
  doc.text('Escanea este código para abrir el formulario (no requiere iniciar sesión).', margin, getY())
  setY(getY() + 10)

  const qrSize = 95
  const qrX = (pageW - qrSize) / 2
  const qrY = getY()

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(...palette.line)
  doc.roundedRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8, 3, 3, 'FD')
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)
  setY(qrY + qrSize + 14)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...palette.ink)
  doc.text('Enlace', margin, getY())
  setY(getY() + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...palette.muted)
  const urlLines = doc.splitTextToSize(formUrl, contentW)
  doc.text(urlLines, margin, getY())
  setY(getY() + urlLines.length * 4.2 + 8)

  if (options.formSlug) {
    doc.setFontSize(9)
    doc.text(`Slug: /${options.formSlug}`, margin, getY())
    setY(getY() + 6)
  }

  doc.setFontSize(9)
  doc.setTextColor(...palette.muted)
  doc.text('Imprime esta hoja y colócala donde tus visitantes puedan escanearla.', margin, getY())

  drawPdfFooter(ctx)

  const filename = `qr-${slugify(formTitle)}.pdf`
  doc.save(filename)
  return filename
}

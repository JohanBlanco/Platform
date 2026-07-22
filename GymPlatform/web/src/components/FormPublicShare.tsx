import { useMemo, useState } from 'react'
import { useToast } from '../toast'
import { downloadFormQrPdf } from '../utils/formQrPdf'

type Props = {
  url: string
  title?: string
  slug?: string
  gymName?: string
  compact?: boolean
}

/** Comparte enlace público + QR (imagen generada vía servicio QR). */
export default function FormPublicShare({
  url,
  title = 'Formulario público',
  slug,
  gymName,
  compact = false,
}: Props) {
  const { showSuccess, showApiError } = useToast()
  const [open, setOpen] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  const qrSrc = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(url)}`,
    [url],
  )

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      showSuccess('Enlace copiado')
    } catch {
      showApiError(new Error('No se pudo copiar'), 'No se pudo copiar el enlace')
    }
  }

  const exportPdf = async () => {
    setExportingPdf(true)
    try {
      await downloadFormQrPdf({
        formTitle: title,
        formUrl: url,
        formSlug: slug,
        gymName,
      })
      showSuccess('PDF del QR listo para imprimir')
    } catch (err) {
      showApiError(err, 'No se pudo exportar el QR a PDF')
    } finally {
      setExportingPdf(false)
    }
  }

  const actions = (
    <div className="form-public-share-actions">
      <button type="button" className="btn-secondary" onClick={() => void copyLink()}>
        Copiar enlace
      </button>
      <button
        type="button"
        className="btn-primary"
        disabled={exportingPdf}
        onClick={() => void exportPdf()}
      >
        {exportingPdf ? 'Generando PDF…' : 'Exportar PDF'}
      </button>
    </div>
  )

  if (compact) {
    return (
      <div className="form-public-share form-public-share--compact">
        <button type="button" className="btn-secondary" onClick={() => setOpen((v) => !v)}>
          {open ? 'Ocultar QR' : 'Código QR'}
        </button>
        {open && (
          <div className="form-public-share-panel">
            <img src={qrSrc} alt={`Código QR de ${title}`} width={180} height={180} />
            <div>
              <p className="form-hint" style={{ marginTop: 0 }}>
                Escanea para abrir el formulario sin iniciar sesión. Exporta a PDF para imprimir.
              </p>
              {actions}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="form-public-share">
      <div className="form-public-share-panel">
        <img src={qrSrc} alt={`Código QR de ${title}`} width={200} height={200} />
        <div>
          <strong>Código QR</strong>
          <p className="form-hint">
            Quienes no son usuarios pueden escanearlo y completar el formulario público.
            Exporta el PDF para imprimirlo.
          </p>
          <code className="form-public-share-url">{url}</code>
          {actions}
        </div>
      </div>
    </div>
  )
}

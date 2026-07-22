import { useEffect, useState } from 'react'
import { usePreferences } from '../../preferences'
import type { MemberFileDetail } from '../../types'
import { memberFilePdfBlob } from '../../utils/memberFilePdf'
import { readThemeAccentHex } from '../../utils/pdfBrand'

type Props = {
  detail: MemberFileDetail
}

/**
 * Vista previa WYSIWYG del PDF final (mismas páginas, márgenes y saltos).
 */
export default function MemberFormDocument({ detail }: Props) {
  const { theme, accent } = usePreferences()
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [building, setBuilding] = useState(true)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    setBuilding(true)
    setError(null)
    setPdfUrl(null)

    const timer = window.setTimeout(() => {
      try {
        const blob = memberFilePdfBlob(detail, {
          gymName: detail.organizationName,
          accentHex: readThemeAccentHex(),
        })
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setPdfUrl(objectUrl)
        setBuilding(false)
      } catch {
        if (!cancelled) {
          setError('No se pudo generar la vista previa del PDF')
          setBuilding(false)
        }
      }
    }, 30)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [detail, theme, accent])

  if (building && !pdfUrl) {
    return <p className="text-muted member-form-pdf-status">Generando vista previa del PDF…</p>
  }

  if (error) {
    return <div className="empty-state">{error}</div>
  }

  if (!pdfUrl) return null

  return (
    <div className="member-form-pdf-preview">
      <iframe
        title={`Vista previa PDF — ${detail.formTitle}`}
        src={`${pdfUrl}#view=FitH`}
        className="member-form-pdf-frame"
      />
    </div>
  )
}

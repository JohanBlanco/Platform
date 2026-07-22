import { useEffect, useState } from 'react'
import { api } from '../../api'
import BodyMeasurementResults from '../../components/BodyMeasurementResults'
import { useToast } from '../../toast'
import type { BodyMeasurement } from '../../types'
import { formatMeasurementDate } from '../../utils/bodyMeasurements'

export default function MemberMeasurementsPage() {
  const { showApiError } = useToast()
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    api.getMyBodyMeasurements()
      .then((data) => {
        setMeasurements(data)
        if (data.length > 0 && data[0].id != null) setExpandedId(data[0].id)
      })
      .catch((err) => {
        showApiError(err, 'No se pudieron cargar tus medidas')
        setMeasurements([])
      })
      .finally(() => setLoading(false))
  }, [showApiError])

  if (loading) return <p>Cargando...</p>

  if (measurements.length === 0) {
    return (
      <div className="empty-state card measurement-empty">
        <h3>Sin mediciones aún</h3>
        <p>
          Cuando tu instructor registre una medición corporal en el gimnasio, podrás ver aquí tu IMC,
          composición estimada, evolución y recomendaciones personalizadas.
        </p>
        <p className="text-muted">
          Puedes agendar una cita de tipo &quot;Medidas&quot; desde la sección Citas.
        </p>
      </div>
    )
  }

  const latest = measurements[0]

  return (
    <div className="member-measurements">
      <section className="card measurement-latest-hero">
        <div className="measurement-latest-header">
          <div>
            <p className="measurement-latest-label">Última medición</p>
            <h2>{formatMeasurementDate(latest.measuredAt)}</h2>
            {latest.recordedByName && (
              <p className="text-muted">Registrada por {latest.recordedByName}</p>
            )}
          </div>
        </div>
        <BodyMeasurementResults measurement={latest} compact />
        {latest.analysis.recommendations.length > 0 && (
          <div className="measurement-recommendations measurement-recommendations--hero">
            <h3>Tus recomendaciones</h3>
            <ul>
              {latest.analysis.recommendations.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {measurements.length > 1 && (
        <section className="measurement-history-section">
          <h3>Historial</h3>
          <p className="text-muted">Compara tu evolución en cada sesión de medición.</p>
          <div className="measurement-history">
            {measurements.slice(1).map((m) => (
              <article key={m.id ?? m.measuredAt} className="card measurement-history-item">
                <button
                  type="button"
                  className="measurement-history-toggle"
                  onClick={() => setExpandedId(expandedId === m.id ? null : (m.id ?? null))}
                  aria-expanded={expandedId === m.id}
                >
                  <div>
                    <strong>{formatMeasurementDate(m.measuredAt)}</strong>
                    <span className="text-muted">
                      {' · '}
                      {m.weightKg} kg · IMC {m.analysis.bmi ?? '—'}
                    </span>
                  </div>
                  <span className="measurement-history-chevron">{expandedId === m.id ? '▾' : '▸'}</span>
                </button>
                {expandedId === m.id && m.id != null && (
                  <BodyMeasurementResults measurement={m} />
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

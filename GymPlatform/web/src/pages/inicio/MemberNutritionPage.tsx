import { useEffect, useState } from 'react'
import { api } from '../../api'
import NutritionPlanDisplay from '../../components/NutritionPlanDisplay'
import { useToast } from '../../toast'
import type { NutritionPlan } from '../../types'
import { activePlan, formatPlanDate } from '../../utils/nutritionPlan'

export default function MemberNutritionPage() {
  const { showApiError } = useToast()
  const [plans, setPlans] = useState<NutritionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    api.getMyNutritionPlans()
      .then((data) => {
        setPlans(data)
        const current = data.find((p) => p.status === 'ACTIVE')
        if (current) setExpandedId(current.id)
      })
      .catch((err) => {
        showApiError(err, 'No se pudo cargar tu plan nutricional')
        setPlans([])
      })
      .finally(() => setLoading(false))
  }, [showApiError])

  if (loading) return <p>Cargando...</p>

  const current = activePlan(plans)
  const archived = plans.filter((p) => p.status === 'ARCHIVED')

  if (!current && archived.length === 0) {
    return (
      <div className="empty-state card measurement-empty">
        <h3>Sin plan nutricional</h3>
        <p>
          Cuando tu instructor te asigne un plan alimenticio, lo verás aquí con calorías,
          macros, comidas del día y recomendaciones.
        </p>
        <p className="text-muted">Puedes agendar una cita de tipo Nutrición desde Citas.</p>
      </div>
    )
  }

  return (
    <div className="member-nutrition">
      {current && (
        <section className="card nutrition-active-plan nutrition-latest-hero">
          <div className="nutrition-plan-header">
            <div>
              <p className="measurement-latest-label">Tu plan activo</p>
              <h2>{current.title}</h2>
              {current.objective && <p className="nutrition-plan-objective">{current.objective}</p>}
              <p className="text-muted">
                Asignado por {current.createdByName}
                {current.validUntil && ` · Vigente hasta ${formatPlanDate(current.validUntil)}`}
              </p>
            </div>
          </div>
          <NutritionPlanDisplay plan={current} />
        </section>
      )}

      {archived.length > 0 && (
        <section className="nutrition-history-section">
          <h3>Planes anteriores</h3>
          <div className="measurement-history">
            {archived.map((plan) => (
              <article key={plan.id} className="card measurement-history-item">
                <button
                  type="button"
                  className="measurement-history-toggle"
                  onClick={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
                >
                  <div>
                    <strong>{plan.title}</strong>
                    <span className="text-muted"> · Archivado</span>
                  </div>
                  <span className="measurement-history-chevron">{expandedId === plan.id ? '▾' : '▸'}</span>
                </button>
                {expandedId === plan.id && <NutritionPlanDisplay plan={plan} compact />}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

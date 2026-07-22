import type { BodyMeasurement, BodyMeasurementAnalysis } from '../types'
import {
  bmiBadgeClass,
  bodyFatBadgeClass,
  formatMeasurementDate,
  SEX_LABELS,
} from '../utils/bodyMeasurements'

type Props = {
  measurement: BodyMeasurement
  showMemberName?: boolean
  compact?: boolean
}

function MetricCard({ label, value, sub, badgeClass }: {
  label: string
  value: string
  sub?: string
  badgeClass?: string
}) {
  return (
    <div className="measurement-metric-card">
      <span className="measurement-metric-label">{label}</span>
      {badgeClass ? (
        <span className={badgeClass}>{value}</span>
      ) : (
        <span className="measurement-metric-value">{value}</span>
      )}
      {sub && <span className="measurement-metric-sub">{sub}</span>}
    </div>
  )
}

function formatDelta(value: number | null | undefined, unit: string, invertGood = false): string | null {
  if (value == null || value === 0) return null
  const sign = value > 0 ? '+' : ''
  const good = invertGood ? value < 0 : value > 0
  return `${sign}${value}${unit}${good ? ' ✓' : ''}`
}

export default function BodyMeasurementResults({ measurement, showMemberName = false, compact = false }: Props) {
  const a: BodyMeasurementAnalysis = measurement.analysis
  const c = measurement.comparison

  return (
    <div className={`measurement-results${compact ? ' measurement-results--compact' : ''}`}>
      {showMemberName && (
        <div className="measurement-results-header">
          <h3>{measurement.memberName}</h3>
          <p className="text-muted">{formatMeasurementDate(measurement.measuredAt)}</p>
        </div>
      )}

      <div className="measurement-metrics-grid">
        <MetricCard
          label="IMC"
          value={a.bmi != null ? String(a.bmi) : '—'}
          sub={a.bmiCategory ?? undefined}
          badgeClass={a.bmiCategory ? bmiBadgeClass(a.bmiCategory) : undefined}
        />
        <MetricCard
          label="Grasa corporal"
          value={a.bodyFatPercent != null ? `${a.bodyFatPercent}%` : '—'}
          sub={a.bodyFatCategory ?? (a.bodyFatPercent == null ? 'Requiere cuello y cintura' : undefined)}
          badgeClass={a.bodyFatCategory ? bodyFatBadgeClass(a.bodyFatCategory) : undefined}
        />
        <MetricCard
          label="Peso"
          value={`${measurement.weightKg} kg`}
          sub={formatDelta(c?.weightChangeKg, ' kg') ?? undefined}
        />
        <MetricCard
          label="Altura"
          value={`${measurement.heightCm} cm`}
        />
        <MetricCard
          label="TMB estimada"
          value={a.bmrKcal != null ? `${a.bmrKcal} kcal/día` : '—'}
          sub="Metabolismo basal (Mifflin-St Jeor)"
        />
        {a.waistHipRatio != null && (
          <MetricCard
            label="Relación cintura-cadera"
            value={String(a.waistHipRatio)}
            sub={a.waistHipRisk ?? undefined}
          />
        )}
        {a.idealWeightMinKg != null && a.idealWeightMaxKg != null && (
          <MetricCard
            label="Peso ideal (IMC 18.5–24.9)"
            value={`${a.idealWeightMinKg} – ${a.idealWeightMaxKg} kg`}
          />
        )}
        {a.fatMassKg != null && a.leanMassKg != null && (
          <MetricCard
            label="Masa grasa / magra"
            value={`${a.fatMassKg} / ${a.leanMassKg} kg`}
          />
        )}
      </div>

      {!compact && (
        <>
          <div className="measurement-circumferences">
            <h4>Circunferencias registradas</h4>
            <dl className="measurement-dl">
              {measurement.neckCm != null && <><dt>Cuello</dt><dd>{measurement.neckCm} cm</dd></>}
              {measurement.chestCm != null && <><dt>Pecho</dt><dd>{measurement.chestCm} cm</dd></>}
              {measurement.waistCm != null && (
                <>
                  <dt>Cintura (abdomen)</dt>
                  <dd>
                    {measurement.waistCm} cm
                    {c?.waistChangeCm != null && (
                      <span className="measurement-delta"> ({formatDelta(c.waistChangeCm, ' cm', true)})</span>
                    )}
                  </dd>
                </>
              )}
              {measurement.hipsCm != null && <><dt>Cadera</dt><dd>{measurement.hipsCm} cm</dd></>}
              {measurement.shouldersCm != null && <><dt>Hombros</dt><dd>{measurement.shouldersCm} cm</dd></>}
              {a.avgArmCm != null && <><dt>Brazo (prom.)</dt><dd>{a.avgArmCm} cm</dd></>}
              {measurement.leftArmCm != null && <><dt>Brazo izq.</dt><dd>{measurement.leftArmCm} cm</dd></>}
              {measurement.rightArmCm != null && <><dt>Brazo der.</dt><dd>{measurement.rightArmCm} cm</dd></>}
              {measurement.leftForearmCm != null && <><dt>Antebrazo izq.</dt><dd>{measurement.leftForearmCm} cm</dd></>}
              {measurement.rightForearmCm != null && <><dt>Antebrazo der.</dt><dd>{measurement.rightForearmCm} cm</dd></>}
              {a.avgThighCm != null && <><dt>Muslo (prom.)</dt><dd>{a.avgThighCm} cm</dd></>}
              {measurement.leftThighCm != null && <><dt>Muslo izq.</dt><dd>{measurement.leftThighCm} cm</dd></>}
              {measurement.rightThighCm != null && <><dt>Muslo der.</dt><dd>{measurement.rightThighCm} cm</dd></>}
              {a.avgCalfCm != null && <><dt>Pantorrilla (prom.)</dt><dd>{a.avgCalfCm} cm</dd></>}
              {measurement.leftCalfCm != null && <><dt>Pantorrilla izq.</dt><dd>{measurement.leftCalfCm} cm</dd></>}
              {measurement.rightCalfCm != null && <><dt>Pantorrilla der.</dt><dd>{measurement.rightCalfCm} cm</dd></>}
            </dl>
            <p className="text-muted measurement-meta">
              {SEX_LABELS[measurement.sex]} · {measurement.ageYears} años
              {measurement.recordedByName && ` · Registrado por ${measurement.recordedByName}`}
            </p>
          </div>

          {a.recommendations.length > 0 && (
            <div className="measurement-recommendations">
              <h4>Recomendaciones</h4>
              <ul>
                {a.recommendations.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {measurement.notes && (
            <div className="measurement-notes">
              <h4>Notas del instructor</h4>
              <p>{measurement.notes}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

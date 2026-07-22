import { useEffect, useState } from 'react'
import { api } from '../../api'
import { useToast } from '../../toast'
import type { GeneratedRoutinePlan, RoutineGenerationContext } from '../../types'

export type GenerateRoutineFocus =
  | 'HYPERTROPHY'
  | 'STRENGTH'
  | 'FAT_LOSS'
  | 'TONE'
  | 'GENERAL'

type Props = {
  open: boolean
  memberId: number
  memberName: string
  routineRequestId?: number | null
  initialGoals?: string
  initialNotes?: string
  onClose: () => void
  onGenerated: (plan: GeneratedRoutinePlan) => void
}

const FOCUS_OPTIONS: { value: GenerateRoutineFocus; label: string; hint: string }[] = [
  { value: 'HYPERTROPHY', label: 'Hipertrofia', hint: 'Volumen y masa' },
  { value: 'STRENGTH', label: 'Fuerza', hint: 'Cargas altas' },
  { value: 'FAT_LOSS', label: 'Quema de grasa', hint: 'Más reps / cardio' },
  { value: 'TONE', label: 'Tonificación', hint: 'Control y definición' },
  { value: 'GENERAL', label: 'Salud general', hint: 'Equilibrado' },
]

const DAY_OPTIONS = [2, 3, 4, 5, 6]
const SESSION_OPTIONS = [45, 60, 75]
const EQUIPMENT_OPTIONS: { value: string; label: string }[] = [
  { value: 'FULL_GYM', label: 'Gimnasio completo' },
  { value: 'MACHINES_DUMBBELLS', label: 'Máquinas y mancuernas' },
  { value: 'BODYWEIGHT', label: 'Peso corporal' },
]

const LEVEL_OPTIONS = ['Principiante', 'Intermedio', 'Avanzado']

function sexLabel(sex: string | null) {
  if (sex === 'MALE') return 'Masculino'
  if (sex === 'FEMALE') return 'Femenino'
  return null
}

export default function GenerateRoutineModal({
  open,
  memberId,
  memberName,
  routineRequestId,
  initialGoals,
  initialNotes,
  onClose,
  onGenerated,
}: Props) {
  const { showApiError } = useToast()
  const [loadingContext, setLoadingContext] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [context, setContext] = useState<RoutineGenerationContext | null>(null)

  const [daysPerWeek, setDaysPerWeek] = useState(3)
  const [focus, setFocus] = useState<GenerateRoutineFocus>('GENERAL')
  const [sessionMinutes, setSessionMinutes] = useState(60)
  const [equipment, setEquipment] = useState('FULL_GYM')
  const [levelOverride, setLevelOverride] = useState('Intermedio')
  const [injuriesNotes, setInjuriesNotes] = useState('')
  const [goalsOverride, setGoalsOverride] = useState('')

  useEffect(() => {
    if (!open) return
    setLoadingContext(true)
    setContext(null)
    api.getRoutineGenerationContext(memberId, routineRequestId)
      .then((ctx) => {
        setContext(ctx)
        setInjuriesNotes(ctx.injuries ?? initialNotes ?? '')
        setGoalsOverride(ctx.goals ?? initialGoals ?? '')
        if (ctx.level) setLevelOverride(ctx.level)
        // Infer focus from goals text lightly
        const goalsText = (ctx.goals ?? initialGoals ?? '').toLowerCase()
        if (goalsText.includes('fuerza')) setFocus('STRENGTH')
        else if (goalsText.includes('hipertrof') || goalsText.includes('masa')) setFocus('HYPERTROPHY')
        else if (goalsText.includes('grasa') || goalsText.includes('peso') || goalsText.includes('defin')) setFocus('FAT_LOSS')
        else if (goalsText.includes('tonif')) setFocus('TONE')
        else setFocus('GENERAL')
      })
      .catch((err) => {
        showApiError(err, 'No se pudieron cargar los datos del miembro')
        setInjuriesNotes(initialNotes ?? '')
        setGoalsOverride(initialGoals ?? '')
      })
      .finally(() => setLoadingContext(false))
  }, [open, memberId, routineRequestId, initialGoals, initialNotes, showApiError])

  if (!open) return null

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    try {
      const plan = await api.generateRoutine({
        memberId,
        daysPerWeek,
        focus,
        sessionMinutes,
        equipment,
        injuriesNotes: injuriesNotes.trim() || null,
        goalsOverride: goalsOverride.trim() || null,
        levelOverride: context?.levelKnown ? null : levelOverride,
        routineRequestId: routineRequestId ?? null,
      })
      onGenerated(plan)
      onClose()
    } catch (err) {
      showApiError(err, 'No se pudo generar la rutina')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal card admin-form-modal generate-routine-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-routine-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h3 id="generate-routine-title">Generar rutina</h3>
        <p className="admin-form-intro">
          Para <strong>{memberName}</strong>. Usamos el expediente y el registro cuando existen;
          solo pedimos lo necesario para armar el plan.
        </p>

        {loadingContext ? (
          <p className="text-muted">Cargando datos del miembro…</p>
        ) : (
          <form onSubmit={handleGenerate}>
            {context && (context.levelKnown || context.sexKnown || context.age != null || context.goalsKnown) && (
              <div className="generate-routine-known">
                <h4>Ya tenemos</h4>
                <div className="generate-routine-known-chips">
                  {context.age != null && <span className="generate-chip">Edad: {context.age}</span>}
                  {sexLabel(context.sex) && (
                    <span className="generate-chip">Sexo: {sexLabel(context.sex)}</span>
                  )}
                  {context.levelKnown && context.level && (
                    <span className="generate-chip">Nivel: {context.level}</span>
                  )}
                  {context.goalsKnown && context.goals && (
                    <span className="generate-chip generate-chip--wide" title={context.goals}>
                      Objetivos: {context.goals}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Días de entrenamiento por semana</label>
              <div className="generate-choice-row">
                {DAY_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`generate-choice${daysPerWeek === d ? ' active' : ''}`}
                    onClick={() => setDaysPerWeek(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Enfoque del plan</label>
              <div className="generate-focus-grid">
                {FOCUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`generate-focus-card${focus === opt.value ? ' active' : ''}`}
                    onClick={() => setFocus(opt.value)}
                  >
                    <strong>{opt.label}</strong>
                    <span>{opt.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Duración aproximada por sesión</label>
              <div className="generate-choice-row">
                {SESSION_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`generate-choice${sessionMinutes === m ? ' active' : ''}`}
                    onClick={() => setSessionMinutes(m)}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Equipamiento disponible</label>
              <div className="generate-choice-row generate-choice-row--wrap">
                {EQUIPMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`generate-choice generate-choice--wide${equipment === opt.value ? ' active' : ''}`}
                    onClick={() => setEquipment(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {!context?.levelKnown && (
              <div className="form-group">
                <label>Nivel del miembro</label>
                <div className="generate-choice-row">
                  {LEVEL_OPTIONS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className={`generate-choice generate-choice--wide${levelOverride === lvl ? ' active' : ''}`}
                      onClick={() => setLevelOverride(lvl)}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!context?.goalsKnown && (
              <div className="form-group">
                <label>Objetivos (opcional)</label>
                <textarea
                  value={goalsOverride}
                  onChange={(e) => setGoalsOverride(e.target.value)}
                  placeholder="Ej. ganar masa en tren superior"
                  rows={2}
                />
              </div>
            )}

            <div className="form-group">
              <label>
                Lesiones o limitaciones
                {context?.injuriesKnown ? ' (del registro, editable)' : ''}
              </label>
              <textarea
                value={injuriesNotes}
                onChange={(e) => setInjuriesNotes(e.target.value)}
                placeholder="Ej. molestia de hombro derecho"
                rows={2}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={generating}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={generating || loadingContext}>
                {generating ? 'Generando…' : 'Generar plan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

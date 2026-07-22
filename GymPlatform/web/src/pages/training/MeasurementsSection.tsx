import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../../api'
import AdminFormModal from '../../components/AdminFormModal'
import BodyMeasurementResults from '../../components/BodyMeasurementResults'
import MemberSearchSelect from '../../components/MemberSearchSelect'
import { useToast } from '../../toast'
import type { BodyMeasurement, User } from '../../types'
import {
  emptyMeasurementForm,
  formToPayload,
  formatMeasurementDate,
  bmiBadgeClass,
  type BodyMeasurementFormState,
} from '../../utils/bodyMeasurements'

type MemberMeasurementSummary = {
  member: User
  count: number
  latest: BodyMeasurement | null
}

type FormSection = 'basic' | 'torso' | 'limbs'

const SECTIONS: { id: FormSection; label: string }[] = [
  { id: 'basic', label: 'Datos básicos' },
  { id: 'torso', label: 'Torso' },
  { id: 'limbs', label: 'Extremidades' },
]

function numField(
  label: string,
  key: keyof BodyMeasurementFormState,
  form: BodyMeasurementFormState,
  setForm: (f: BodyMeasurementFormState) => void,
  opts?: { required?: boolean; hint?: string; step?: string },
) {
  return (
    <label key={key} className="form-group">
      {label}
      {opts?.required && ' *'}
      <input
        type="number"
        min="0"
        step={opts?.step ?? '0.1'}
        value={form[key] as string}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        required={opts?.required}
      />
      {opts?.hint && <span className="form-hint">{opts.hint}</span>}
    </label>
  )
}

export default function MeasurementsSection() {
  const { showSuccess, showApiError } = useToast()
  const [members, setMembers] = useState<User[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('')
  const [history, setHistory] = useState<BodyMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formSection, setFormSection] = useState<FormSection>('basic')
  const [form, setForm] = useState(emptyMeasurementForm)
  const [preview, setPreview] = useState<BodyMeasurement | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [summaries, setSummaries] = useState<MemberMeasurementSummary[]>([])
  const [summariesLoading, setSummariesLoading] = useState(false)

  useEffect(() => {
    api.getUsers()
      .then((users) => setMembers(users.filter((u) => u.active && u.roles.includes('MEMBER'))))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }, [])

  const loadSummaries = useCallback(async (memberList: User[]) => {
    if (memberList.length === 0) {
      setSummaries([])
      return
    }
    setSummariesLoading(true)
    try {
      const results = await Promise.all(
        memberList.map(async (member) => {
          try {
            const data = await api.getMemberBodyMeasurements(member.id)
            return { member, count: data.length, latest: data[0] ?? null }
          } catch {
            return { member, count: 0, latest: null }
          }
        }),
      )
      setSummaries(results.filter((s) => s.count > 0))
    } finally {
      setSummariesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loading && members.length > 0) {
      loadSummaries(members)
    }
  }, [loading, members, loadSummaries])

  const loadHistory = useCallback(async (memberId: number) => {
    setHistoryLoading(true)
    try {
      const data = await api.getMemberBodyMeasurements(memberId)
      setHistory(data)
      if (data.length > 0 && data[0].id != null) setExpandedId(data[0].id)
    } catch (err) {
      showApiError(err, 'No se pudo cargar el historial')
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [showApiError])

  useEffect(() => {
    if (selectedMemberId) loadHistory(selectedMemberId)
    else setHistory([])
  }, [selectedMemberId, loadHistory])

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId),
    [members, selectedMemberId],
  )

  const openNewMeasurement = () => {
    const age = selectedMember?.profile?.age
      ?? (selectedMember?.profile?.birthYear
        ? new Date().getFullYear() - selectedMember.profile.birthYear
        : undefined)
    setForm({
      ...emptyMeasurementForm(),
      memberId: selectedMemberId,
      ageYears: age != null ? String(age) : '',
    })
    setPreview(null)
    setFormSection('basic')
    setShowForm(true)
  }

  const runPreview = async () => {
    const payload = formToPayload(form)
    if (!payload) {
      showApiError(new ApiError('Completa miembro, sexo, edad, peso y altura', 400), 'Datos incompletos')
      return
    }
    setPreviewing(true)
    try {
      const result = await api.previewBodyMeasurement(payload)
      setPreview(result)
    } catch (err) {
      showApiError(err, 'No se pudo calcular el análisis')
    } finally {
      setPreviewing(false)
    }
  }

  const submitMeasurement = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = formToPayload(form)
    if (!payload) {
      showApiError(new ApiError('Completa los campos obligatorios', 400), 'Datos incompletos')
      return
    }
    setSaving(true)
    try {
      const saved = await api.createBodyMeasurement(payload)
      showSuccess('Medición guardada correctamente')
      setShowForm(false)
      setPreview(null)
      setSelectedMemberId(saved.memberId)
      await loadHistory(saved.memberId)
      await loadSummaries(members)
      if (saved.id != null) setExpandedId(saved.id)
    } catch (err) {
      showApiError(err, 'No se pudo guardar la medición')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Cargando...</p>

  return (
    <>
      <div className="admin-list-toolbar measurement-toolbar">
        <MemberSearchSelect
          members={members}
          value={selectedMemberId}
          onChange={setSelectedMemberId}
          placeholder="Buscar miembro por nombre, correo o cédula…"
        />
        <button
          type="button"
          className="btn-primary"
          disabled={!selectedMemberId}
          onClick={openNewMeasurement}
        >
          Nueva medición
        </button>
      </div>

      {!selectedMemberId ? (
        <div className="measurement-overview">
          <div className="measurement-overview-intro card">
            <p>
              Selecciona un miembro arriba o elige uno de la lista para ver su historial completo.
            </p>
          </div>
          {summariesLoading ? (
            <p>Cargando mediciones del gimnasio…</p>
          ) : summaries.length === 0 ? (
            <div className="empty-state card measurement-empty">
              <p>Aún no hay mediciones registradas en el gimnasio.</p>
              <p className="text-muted">
                Selecciona un miembro y usa <strong>Nueva medición</strong> para registrar la primera.
              </p>
            </div>
          ) : (
            <>
              <h3 className="measurement-overview-title">Miembros con mediciones ({summaries.length})</h3>
              <div className="measurement-overview-grid">
                {summaries.map(({ member, count, latest }) => (
                  <button
                    key={member.id}
                    type="button"
                    className="card measurement-overview-card"
                    onClick={() => setSelectedMemberId(member.id)}
                  >
                    <strong>{member.firstName} {member.lastName}</strong>
                    <span className="text-muted">{count} medición{count !== 1 ? 'es' : ''}</span>
                    {latest && (
                      <div className="measurement-overview-stats">
                        <span>{formatMeasurementDate(latest.measuredAt)}</span>
                        <span>{latest.weightKg} kg</span>
                        {latest.analysis.bmi != null && (
                          <span className={bmiBadgeClass(latest.analysis.bmiCategory)}>
                            IMC {latest.analysis.bmi}
                          </span>
                        )}
                        {latest.analysis.bodyFatPercent != null && (
                          <span>{latest.analysis.bodyFatPercent}% grasa</span>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : historyLoading ? (
        <p>Cargando historial…</p>
      ) : history.length === 0 ? (
        <div className="empty-state card">
          <p>{selectedMember?.firstName} aún no tiene mediciones registradas.</p>
          <button type="button" className="btn-primary" style={{ marginTop: '1rem' }} onClick={openNewMeasurement}>
            Registrar primera medición
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="btn-link measurement-back-link"
            onClick={() => setSelectedMemberId('')}
          >
            ← Volver a todos los miembros
          </button>
          <div className="measurement-history">
          {history.map((m) => (
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
                    {m.analysis.bodyFatPercent != null && ` · ${m.analysis.bodyFatPercent}% grasa`}
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
        </>
      )}

      <AdminFormModal
        title="Nueva medición corporal"
        open={showForm}
        onClose={() => { setShowForm(false); setPreview(null) }}
        onSubmit={submitMeasurement}
        saving={saving}
        submitLabel="Guardar medición"
        submitDisabled={!formToPayload(form)}
        intro={selectedMember && (
          <p className="text-muted measurement-form-intro">
            Registrando medidas para <strong>{selectedMember.firstName} {selectedMember.lastName}</strong>.
            Los campos con * son obligatorios para calcular el análisis.
          </p>
        )}
        footerExtra={
          <button
            type="button"
            className="btn-secondary"
            disabled={previewing || !formToPayload(form)}
            onClick={runPreview}
          >
            {previewing ? 'Calculando…' : 'Ver análisis'}
          </button>
        }
      >
        <div className="measurement-form-tabs" role="tablist">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={formSection === s.id}
              className={formSection === s.id ? 'active' : ''}
              onClick={() => setFormSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {formSection === 'basic' && (
          <div className="measurement-form-section">
            <div className="form-row grid-2">
              <label className="form-group">
                Sexo biológico *
                <select
                  value={form.sex}
                  onChange={(e) => setForm({ ...form, sex: e.target.value as BodyMeasurementFormState['sex'] })}
                  required
                >
                  <option value="">Seleccionar…</option>
                  <option value="MALE">Hombre</option>
                  <option value="FEMALE">Mujer</option>
                </select>
                <span className="form-hint">Necesario para fórmulas de grasa corporal y metabolismo.</span>
              </label>
              {numField('Edad (años)', 'ageYears', form, setForm, { required: true, step: '1' })}
            </div>
            <div className="form-row grid-2">
              {numField('Peso (kg)', 'weightKg', form, setForm, { required: true })}
              {numField('Altura (cm)', 'heightCm', form, setForm, { required: true, step: '0.5' })}
            </div>
          </div>
        )}

        {formSection === 'torso' && (
          <div className="measurement-form-section">
            <p className="form-hint measurement-section-hint">
              Mide con cinta métrica, sin apretar. Cuello y cintura permiten estimar grasa corporal (método Navy).
            </p>
            <div className="form-row grid-2">
              {numField('Cuello', 'neckCm', form, setForm)}
              {numField('Pecho', 'chestCm', form, setForm)}
              {numField('Cintura (abdomen)', 'waistCm', form, setForm)}
              {numField('Cadera', 'hipsCm', form, setForm, { hint: form.sex === 'FEMALE' ? 'Requerida para grasa corporal' : undefined })}
              {numField('Hombros', 'shouldersCm', form, setForm)}
            </div>
          </div>
        )}

        {formSection === 'limbs' && (
          <div className="measurement-form-section">
            <p className="form-hint measurement-section-hint">
              Brazo: flexionado, cinta en el punto más ancho del bíceps. Muslo: parte media. Pantorrilla: punto más ancho.
            </p>
            <div className="form-row grid-2">
              {numField('Brazo izquierdo', 'leftArmCm', form, setForm)}
              {numField('Brazo derecho', 'rightArmCm', form, setForm)}
              {numField('Antebrazo izquierdo', 'leftForearmCm', form, setForm)}
              {numField('Antebrazo derecho', 'rightForearmCm', form, setForm)}
              {numField('Muslo izquierdo', 'leftThighCm', form, setForm)}
              {numField('Muslo derecho', 'rightThighCm', form, setForm)}
              {numField('Pantorrilla izquierda', 'leftCalfCm', form, setForm)}
              {numField('Pantorrilla derecha', 'rightCalfCm', form, setForm)}
            </div>
          </div>
        )}

        <label className="form-group">
          Notas (opcional)
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Observaciones para el miembro…"
          />
        </label>

        {preview && (
          <div className="measurement-preview-panel">
            <h4>Vista previa del análisis</h4>
            <BodyMeasurementResults measurement={preview} compact />
            {preview.analysis.recommendations.length > 0 && (
              <div className="measurement-recommendations measurement-recommendations--inline">
                <h4>Recomendaciones</h4>
                <ul>
                  {preview.analysis.recommendations.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </AdminFormModal>
    </>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../../api'
import RoutineDisplay from '../../components/RoutineDisplay'
import RoutineRequestStatusBadge from '../../components/RoutineRequestStatusBadge'
import { useAuth } from '../../auth'
import { useToast } from '../../toast'
import type { Routine, RoutineRequest } from '../../types'
import { isRoutineRequestOpen } from '../../utils/routineRequest'

type InstructorOption = {
  id: number
  firstName: string
  lastName: string
}

const emptyForm = () => ({
  description: '',
  goals: '',
  additionalNotes: '',
  preferredInstructorId: '',
})

function formatValidityLabel(routine: Routine): string | null {
  if (!routine.validFrom && !routine.validUntil) return null
  const from = routine.validFrom ?? '—'
  const until = routine.validUntil ?? '—'
  return `Vigencia: ${from} → ${until}`
}

export default function MemberRoutinesPage() {
  const { user } = useAuth()
  const { showSuccess, showApiError } = useToast()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [myRequests, setMyRequests] = useState<RoutineRequest[]>([])
  const [instructors, setInstructors] = useState<InstructorOption[]>([])
  const [instructorsHint, setInstructorsHint] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [submitting, setSubmitting] = useState(false)

  const loadInstructors = useCallback(async () => {
    try {
      const list = await api.getInstructors()
      setInstructors(list)
      setInstructorsHint(
        list.length === 0 ? 'No hay instructores activos en el gimnasio por ahora.' : null,
      )
    } catch {
      setInstructors([])
      setInstructorsHint('No se pudieron cargar los instructores. Puedes enviar la solicitud igual (cualquier instructor).')
    }
  }, [])

  const loadRequests = useCallback(async () => {
    try {
      const list = await api.getRoutineRequests()
      // Staff con perfil Miembro puede recibir todas las del gym: limitar a las propias.
      const mine = user?.userId != null ? list.filter((r) => r.memberId === user.userId) : list
      setMyRequests(mine)
    } catch {
      setMyRequests([])
    }
  }, [user?.userId])

  const loadRoutines = useCallback(async () => {
    try {
      const list = await api.getMyRoutines()
      setRoutines(list)
    } catch {
      setRoutines([])
    }
  }, [])

  useEffect(() => {
    Promise.all([loadRoutines(), loadRequests(), loadInstructors()]).finally(() => setLoading(false))
  }, [loadInstructors, loadRequests, loadRoutines])

  const openRequest = useMemo(
    () => myRequests.find((r) => isRoutineRequestOpen(r.status)) ?? null,
    [myRequests],
  )

  /** Una sola rutina actual: la más reciente activa. */
  const currentRoutine = useMemo(() => {
    if (routines.length === 0) return null
    return [...routines].sort((a, b) => b.id - a.id)[0] ?? null
  }, [routines])

  const expired = Boolean(currentRoutine?.expired)
  const canRequest = !openRequest

  const openForm = async () => {
    if (!canRequest) return
    setForm(emptyForm())
    setShowForm(true)
    await loadInstructors()
  }

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || !canRequest) return
    setSubmitting(true)
    const preferredRaw = form.preferredInstructorId.trim()
    const preferredInstructorId = preferredRaw ? Number(preferredRaw) : undefined
    if (preferredInstructorId != null && !Number.isFinite(preferredInstructorId)) {
      showApiError(new Error('Selecciona un instructor válido o deja “Cualquier instructor”.'), 'Datos inválidos')
      setSubmitting(false)
      return
    }
    try {
      const created = await api.createRoutineRequest({
        description: form.description.trim(),
        goals: form.goals.trim(),
        additionalNotes: form.additionalNotes.trim() || undefined,
        preferredInstructorId,
      })
      setShowForm(false)
      setForm(emptyForm())
      if (created && typeof created === 'object' && 'id' in created) {
        setMyRequests((prev) => [created as RoutineRequest, ...prev.filter((r) => r.id !== (created as RoutineRequest).id)])
      } else {
        await loadRequests()
      }
      showSuccess('Solicitud enviada. Tu instructor te asignará un plan pronto.')
    } catch (err) {
      await loadRequests()
      const msg = err instanceof ApiError ? err.message : 'No se pudo enviar la solicitud'
      showApiError(err, msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p>Cargando...</p>

  return (
    <>
      {expired && canRequest && (
        <div className="card member-routine-expiry-reminder" role="status">
          <h3>Tu rutina ya no está vigente</h3>
          <p>
            El plan actual venció
            {currentRoutine?.validUntil ? ` el ${currentRoutine.validUntil}` : ''}.
            Solicita una nueva rutina a tu instructor.
          </p>
          <button type="button" className="btn-primary" onClick={() => void openForm()}>
            Solicitar rutina
          </button>
        </div>
      )}

      {openRequest && (
        <div className="card routine-request-card" style={{ marginBottom: '1rem' }}>
          <div className="card-list-header">
            <h3 title={openRequest.description}>{openRequest.description}</h3>
            <RoutineRequestStatusBadge status={openRequest.status} />
          </div>
          <p className="card-list-meta">Objetivos: {openRequest.goals}</p>
          <p className="card-list-meta">
            Preferencia: {openRequest.preferredInstructorName ?? 'Cualquier instructor'}
          </p>
          <p className="form-hint" style={{ marginTop: '0.5rem' }}>
            Solo puedes tener una solicitud abierta. Cuando te asignen la rutina podrás pedir otra.
          </p>
        </div>
      )}

      {currentRoutine ? (
        <div className={`card${expired ? ' member-routine-expired' : ''}`}>
          <div className="card-list-header">
            <h3>{currentRoutine.name}</h3>
            {expired ? (
              <span className="badge badge-warning">Vencida</span>
            ) : currentRoutine.validUntil ? (
              <span className="badge">Vigente hasta {currentRoutine.validUntil}</span>
            ) : null}
          </div>
          {formatValidityLabel(currentRoutine) && (
            <p className="card-list-meta">{formatValidityLabel(currentRoutine)}</p>
          )}
          {currentRoutine.instructorName && (
            <p className="card-list-meta">Instructor: {currentRoutine.instructorName}</p>
          )}
          <RoutineDisplay routine={currentRoutine} />
        </div>
      ) : (
        !openRequest && (
          <div className="empty-state card">
            <p>No tienes una rutina asignada</p>
            <button type="button" className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => void openForm()}>
              Solicitar rutina
            </button>
          </div>
        )
      )}

      {canRequest && !expired && currentRoutine && (
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          ¿Necesitas otra rutina?{' '}
          <button type="button" className="btn-secondary" style={{ marginLeft: '0.35rem' }} onClick={() => void openForm()}>
            Solicitar rutina
          </button>
        </p>
      )}

      {showForm && (
        <div className="modal-overlay" role="presentation" onClick={() => !submitting && setShowForm(false)}>
          <div
            className="card modal-card"
            role="dialog"
            aria-labelledby="routine-request-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="routine-request-title">Solicitar rutina</h3>
            <form onSubmit={(e) => void submitRequest(e)}>
              <div className="form-group">
                <label>¿Qué necesitas?</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  required
                  placeholder="Ej: Rutina de fuerza para 3 días por semana"
                />
              </div>
              <div className="form-group">
                <label>Objetivos</label>
                <textarea
                  value={form.goals}
                  onChange={(e) => setForm((p) => ({ ...p, goals: e.target.value }))}
                  rows={2}
                  required
                  placeholder="Ej: Hipertrofia, perder grasa, mejorar resistencia..."
                />
              </div>
              <div className="form-group">
                <label>Notas adicionales (opcional)</label>
                <textarea
                  value={form.additionalNotes}
                  onChange={(e) => setForm((p) => ({ ...p, additionalNotes: e.target.value }))}
                  rows={2}
                  placeholder="Lesiones, horarios, equipamiento disponible..."
                />
              </div>
              <div className="form-group">
                <label>Instructor de preferencia (opcional)</label>
                <select
                  value={form.preferredInstructorId}
                  onChange={(e) => setForm((p) => ({ ...p, preferredInstructorId: e.target.value }))}
                >
                  <option value="">Cualquier instructor</option>
                  {instructors.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.firstName} {i.lastName}
                    </option>
                  ))}
                </select>
                {instructorsHint && <p className="form-hint">{instructorsHint}</p>}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                  disabled={submitting}
                >
                  {submitting ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

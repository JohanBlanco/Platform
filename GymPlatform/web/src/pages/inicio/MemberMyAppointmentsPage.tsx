import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import HorizontalSwitch from '../../components/HorizontalSwitch'
import { useDateFormat } from '../../preferences/useDateFormat'
import { useToast } from '../../toast'
import type { AppointmentRequest } from '../../types'
import {
  appointmentStatusLabel,
  appointmentTypeLabel,
} from '../../utils/appointmentUtils'
import { formatTimeRange, parseDateTime } from '../../utils/appointmentCalendarUtils'
import { addMonths, toIsoDate } from '../../utils/calendarUtils'

type RangeTab = 'upcoming' | 'past'

function isUpcoming(appt: AppointmentRequest, now: Date): boolean {
  if (appt.status === 'COMPLETED' || appt.status === 'CANCELLED') return false
  if (appt.status !== 'PENDING' && appt.status !== 'SCHEDULED') return false
  if (!appt.scheduledStart) return true
  const start = parseDateTime(appt.scheduledStart)
  if (!start) return true
  return start.getTime() >= now.getTime()
}

function dayKey(appt: AppointmentRequest): string {
  if (appt.scheduledStart) {
    const d = parseDateTime(appt.scheduledStart)
    if (d) return toIsoDate(d)
  }
  if (appt.createdAt) {
    const d = new Date(appt.createdAt)
    if (!Number.isNaN(d.getTime())) return toIsoDate(d)
  }
  return 'sin-fecha'
}

export default function MemberMyAppointmentsPage() {
  const { formatIsoDate } = useDateFormat()
  const { showSuccess, showApiError } = useToast()
  const [tab, setTab] = useState<RangeTab>('upcoming')
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [cancelTarget, setCancelTarget] = useState<AppointmentRequest | null>(null)

  const load = useCallback(async (options?: { background?: boolean }) => {
    if (!options?.background) setLoading(true)
    try {
      const now = new Date()
      const from = addMonths(now, -3)
      const to = addMonths(now, 3)
      const list = await api.getMyAppointmentRequests({
        from: from.toISOString(),
        to: to.toISOString(),
      })
      setAppointments(
        list.filter((a) =>
          ['PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(a.status),
        ),
      )
    } catch (e) {
      showApiError(e, 'Error al cargar tus citas')
      setAppointments([])
    } finally {
      if (!options?.background) setLoading(false)
    }
  }, [showApiError])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const now = new Date()
    return appointments
      .filter((a) => {
        if (a.status === 'CANCELLED') return tab === 'past'
        const upcoming = isUpcoming(a, now)
        return tab === 'upcoming' ? upcoming : !upcoming
      })
      .sort((a, b) => {
        const aStart = a.scheduledStart ?? a.createdAt
        const bStart = b.scheduledStart ?? b.createdAt
        const cmp = aStart.localeCompare(bStart)
        return tab === 'upcoming' ? cmp : -cmp
      })
  }, [appointments, tab])

  const groups = useMemo(() => {
    const map = new Map<string, AppointmentRequest[]>()
    for (const a of filtered) {
      const key = dayKey(a)
      const list = map.get(key) ?? []
      list.push(a)
      map.set(key, list)
    }
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }))
  }, [filtered])

  const confirmCancel = async () => {
    if (!cancelTarget) return
    setBusyId(cancelTarget.id)
    try {
      await api.updateAppointmentRequestStatus(cancelTarget.id, 'CANCELLED')
      showSuccess('Cita cancelada')
      setCancelTarget(null)
      await load({ background: true })
    } catch (e) {
      showApiError(e, 'Error al cancelar la cita')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <p>Cargando tus citas…</p>
  }

  return (
    <div className="member-my-bookings">
      <div className="admin-list-toolbar member-my-bookings-toolbar">
        <HorizontalSwitch
          label="Periodo"
          checked={tab === 'past'}
          onChange={(past) => setTab(past ? 'past' : 'upcoming')}
          offLabel="Próximas"
          onLabel="Pasadas"
        />
        <Link to="/servicios/solicitudes-citas" className="btn-secondary">
          Agendar cita
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          {tab === 'upcoming' ? (
            <>
              <p>No tienes citas agendadas</p>
              <Link to="/servicios/solicitudes-citas" className="btn-primary" style={{ marginTop: '0.75rem' }}>
                Agendar cita
              </Link>
            </>
          ) : (
            <p>Aún no hay citas pasadas</p>
          )}
        </div>
      ) : (
        <div className="member-activities-agenda-list">
          {groups.map((group) => (
            <section key={group.date} className="member-activities-agenda-day">
              <h3 className="member-activities-agenda-day-title">
                {group.date === 'sin-fecha' ? 'Sin fecha' : formatIsoDate(group.date)}
              </h3>
              <ul className="member-home-activity-list">
                {group.items.map((a) => {
                  const canCancel =
                    tab === 'upcoming' && (a.status === 'PENDING' || a.status === 'SCHEDULED')
                  const busy = busyId === a.id
                  return (
                    <li key={a.id}>
                      <div className="member-home-activity member-my-booking-row">
                        <time dateTime={a.scheduledStart ?? undefined}>
                          {a.scheduledStart && a.scheduledEnd
                            ? formatTimeRange(a.scheduledStart, a.scheduledEnd)
                            : 'Horario por confirmar'}
                        </time>
                        <strong>{appointmentTypeLabel(a.type)}</strong>
                        <span>
                          {appointmentStatusLabel(a.status)}
                          {a.assignedStaffName ? ` · ${a.assignedStaffName}` : ''}
                          {a.preferredStaffName && !a.assignedStaffName
                            ? ` · Pref. ${a.preferredStaffName}`
                            : ''}
                        </span>
                        {canCancel && (
                          <button
                            type="button"
                            className="btn-danger"
                            disabled={busy}
                            onClick={() => setCancelTarget(a)}
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {cancelTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card card">
            <h2>Cancelar cita</h2>
            <p className="card-list-meta">{appointmentTypeLabel(cancelTarget.type)}</p>
            <p className="card-list-meta">
              {cancelTarget.scheduledStart && cancelTarget.scheduledEnd
                ? formatTimeRange(cancelTarget.scheduledStart, cancelTarget.scheduledEnd)
                : 'Horario por confirmar'}
            </p>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setCancelTarget(null)}>
                Volver
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={busyId === cancelTarget.id}
                onClick={() => void confirmCancel()}
              >
                {busyId === cancelTarget.id ? 'Cancelando…' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

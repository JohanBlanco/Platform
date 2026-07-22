import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../auth'
import { useDateFormat } from '../../preferences/useDateFormat'
import { useToast } from '../../toast'
import type { AppointmentRequest, AppointmentType, AvailableSlot } from '../../types'
import {
  APPOINTMENT_TYPES,
  appointmentTypeLabel,
} from '../../utils/appointmentUtils'
import { formatTimeRange, parseDateTime, combineDateAndTime } from '../../utils/appointmentCalendarUtils'
import {
  WEEKDAY_LABELS,
  addDays,
  addMonths,
  isSameDay,
  startOfWeek,
  toIsoDate,
} from '../../utils/calendarUtils'

type DaySlots = {
  day: Date
  iso: string
  available: AvailableSlot[]
  mine: AppointmentRequest[]
}

type BookingDraft = {
  dateIso: string
  startTime: string
  endTime: string
  openAppointmentId: number
}


function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10))
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0)
}

function longDateLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('es-CR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

/** True si el inicio del slot ya pasó (no se puede reservar). */
function isSlotInPast(dateIso: string, startTime: string, now = new Date()): boolean {
  const start = parseDateTime(combineDateAndTime(dateIso, startTime.slice(0, 5)))
  if (!start) return false
  return start.getTime() < now.getTime()
}

export default function MemberAppointmentsPage() {
  const { user } = useAuth()
  const { formatPeriodLabel, formatTime } = useDateFormat()
  const { showSuccess, showApiError } = useToast()

  const [anchor, setAnchor] = useState(() => new Date())
  const [monthAnchor, setMonthAnchor] = useState(() => new Date())
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState<DaySlots[]>([])
  const [busy, setBusy] = useState(false)

  const [booking, setBooking] = useState<BookingDraft | null>(null)
  const [cancelTarget, setCancelTarget] = useState<AppointmentRequest | null>(null)
  const [type, setType] = useState<AppointmentType>('CONSULTATION')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor])
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  useEffect(() => {
    if (!user) return
    setFirstName(user.firstName ?? '')
    setLastName(user.lastName ?? '')
    setEmail(user.email ?? '')
  }, [user])

  const load = useCallback(async (options?: { background?: boolean }) => {
    if (!options?.background) setLoading(true)
    try {
      const from = weekDays[0]
      const to = addDays(weekDays[6], 1)
      const [mineList, ...slotLists] = await Promise.all([
        api.getMyAppointmentRequests({
          from: from.toISOString(),
          to: to.toISOString(),
        }),
        ...weekDays.map((d) =>
          api.getStaffAvailableSlots(toIsoDate(d)).catch(() => [] as AvailableSlot[]),
        ),
      ])

      const myBooked = mineList.filter(
        (a) =>
          a.status === 'PENDING' || a.status === 'SCHEDULED' || a.status === 'COMPLETED',
      )

      setDays(
        weekDays.map((day, i) => {
          const iso = toIsoDate(day)
          const available = (slotLists[i] ?? [])
            .filter((s) => s.available && s.appointmentId != null)
            .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
          const mine = myBooked
            .filter((a) => {
              const start = parseDateTime(a.scheduledStart)
              return start != null && isSameDay(start, day)
            })
            .sort((a, b) => {
              const sa = parseDateTime(a.scheduledStart)?.getTime() ?? 0
              const sb = parseDateTime(b.scheduledStart)?.getTime() ?? 0
              return sa - sb
            })
          return { day, iso, available, mine }
        }),
      )
    } catch {
      setDays(weekDays.map((day) => ({
        day,
        iso: toIsoDate(day),
        available: [],
        mine: [],
      })))
    } finally {
      if (!options?.background) setLoading(false)
    }
  }, [weekDays])

  useEffect(() => {
    void load()
  }, [load])

  const daysWithAvailability = useMemo(() => {
    const set = new Set<string>()
    for (const col of days) {
      if (col.available.length > 0 || col.mine.length > 0) set.add(col.iso)
    }
    return set
  }, [days])

  const openBooking = (dateIso: string, slot: AvailableSlot) => {
    if (slot.appointmentId == null) return
    if (isSlotInPast(dateIso, slot.startTime)) return
    setCancelTarget(null)
    setBooking({
      dateIso,
      startTime: slot.startTime,
      endTime: slot.endTime,
      openAppointmentId: slot.appointmentId,
    })
    setType('CONSULTATION')
  }

  const openCancel = (appointment: AppointmentRequest) => {
    setBooking(null)
    setCancelTarget(appointment)
  }

  const handleReserve = async () => {
    if (!booking) return
    if (isSlotInPast(booking.dateIso, booking.startTime)) {
      showApiError(new Error('Ese horario ya pasó'), 'No se puede reservar')
      setBooking(null)
      return
    }
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      showApiError(new Error('Completa tu información de contacto'), 'Datos incompletos')
      return
    }
    setBusy(true)
    try {
      await api.createAppointmentRequest({
        type,
        openAppointmentId: booking.openAppointmentId,
        notes: `Contacto: ${firstName.trim()} ${lastName.trim()} · ${email.trim()}`,
      })
      showSuccess('Cita reservada')
      setBooking(null)
      await load({ background: true })
    } catch (err) {
      showApiError(err, 'No se pudo reservar la cita')
      await load({ background: true })
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    setBusy(true)
    try {
      await api.updateAppointmentRequestStatus(cancelTarget.id, 'CANCELLED')
      showSuccess('Cita cancelada')
      setCancelTarget(null)
      await load({ background: true })
    } catch (err) {
      showApiError(err, 'No se pudo cancelar la cita')
    } finally {
      setBusy(false)
    }
  }

  const monthStart = useMemo(
    () => new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1),
    [monthAnchor],
  )
  const monthGridStart = useMemo(() => startOfWeek(monthStart), [monthStart])
  const monthCells = useMemo(
    () => Array.from({ length: 42 }, (_, i) => addDays(monthGridStart, i)),
    [monthGridStart],
  )
  const monthTitle = monthAnchor.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' })

  const selectDay = (day: Date) => {
    setAnchor(day)
    setMonthAnchor(new Date(day.getFullYear(), day.getMonth(), 1))
  }

  return (
    <div className="member-citas-gcal">
      <div className="admin-list-toolbar">
        <div className="calendar-nav member-activities-kanban-nav">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setAnchor((d) => addDays(d, -7))}
            aria-label="Semana anterior"
          >
            ‹
          </button>
          <span className="calendar-period">{formatPeriodLabel('week', anchor)}</span>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setAnchor((d) => addDays(d, 7))}
            aria-label="Semana siguiente"
          >
            ›
          </button>
          <button type="button" className="btn-secondary" onClick={() => {
            const today = new Date()
            setAnchor(today)
            setMonthAnchor(new Date(today.getFullYear(), today.getMonth(), 1))
          }}
          >
            Hoy
          </button>
        </div>
        <div className="member-activities-mine-toggle">
          <Link to="/servicios/mis-citas" className="btn-secondary">
            Ver mis citas
          </Link>
        </div>
      </div>

      <div className="member-citas-gcal-shell card">
        <div className="member-citas-gcal-top">
          <h2 className="member-citas-gcal-title">Selecciona una hora para la cita</h2>
          <p className="member-citas-gcal-tz">(GMT-06:00) Hora estándar central - Costa Rica</p>
        </div>

        <div className="member-citas-gcal-body">
          <aside className="member-citas-mini-cal">
            <div className="member-citas-mini-cal-nav">
              <button
                type="button"
                className="btn-secondary"
                aria-label="Mes anterior"
                onClick={() => setMonthAnchor((d) => addMonths(d, -1))}
              >
                ‹
              </button>
              <strong>{capitalize(monthTitle)}</strong>
              <button
                type="button"
                className="btn-secondary"
                aria-label="Mes siguiente"
                onClick={() => setMonthAnchor((d) => addMonths(d, 1))}
              >
                ›
              </button>
            </div>
            <div className="member-citas-mini-cal-grid">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                <span key={d} className="member-citas-mini-cal-dow">{d}</span>
              ))}
              {monthCells.map((day) => {
                const iso = toIsoDate(day)
                const inMonth = day.getMonth() === monthAnchor.getMonth()
                const inWeek = weekDays.some((w) => isSameDay(w, day))
                const hasSlots = daysWithAvailability.has(iso)
                return (
                  <button
                    key={iso}
                    type="button"
                    className={[
                      'member-citas-mini-cal-day',
                      inMonth ? '' : 'is-muted',
                      isSameDay(day, new Date()) ? 'is-today' : '',
                      inWeek ? 'is-in-week' : '',
                      isSameDay(day, anchor) ? 'is-selected' : '',
                      hasSlots ? 'has-slots' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => selectDay(day)}
                  >
                    {day.getDate()}
                  </button>
                )
              })}
            </div>
          </aside>

          <div className="member-citas-week">
            <div className="member-citas-week-head">
              <button
                type="button"
                className="member-citas-week-arrow btn-secondary"
                aria-label="Semana anterior"
                onClick={() => setAnchor((d) => addDays(d, -7))}
              >
                ‹
              </button>
              <div className="member-citas-week-days">
                {weekDays.map((day, i) => (
                  <div
                    key={toIsoDate(day)}
                    className={`member-citas-week-day-label${isSameDay(day, new Date()) ? ' is-today' : ''}${isSameDay(day, anchor) ? ' is-focus' : ''}`}
                  >
                    <span>{WEEKDAY_LABELS[i]}</span>
                    <strong className={isSameDay(day, anchor) || isSameDay(day, new Date()) ? 'is-pill' : ''}>
                      {day.getDate()}
                    </strong>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="member-citas-week-arrow btn-secondary"
                aria-label="Semana siguiente"
                onClick={() => setAnchor((d) => addDays(d, 7))}
              >
                ›
              </button>
            </div>

            {loading ? (
              <p className="calendar-hint">Cargando horarios…</p>
            ) : (
              <div className="member-citas-week-cols">
                {days.map((col) => (
                  <div key={col.iso} className="member-citas-week-col">
                    <>
                      {col.mine.map((appt) => {
                        const start = parseDateTime(appt.scheduledStart)
                        const label = start ? formatTime(start) : 'Cita'
                        const past = start != null && start.getTime() < Date.now()
                        const canCancel =
                          !past && (appt.status === 'PENDING' || appt.status === 'SCHEDULED')
                        return (
                          <button
                            key={`mine-${appt.id}`}
                            type="button"
                            className={`member-citas-slot member-citas-slot--mine${past ? ' is-past' : ''}`}
                            disabled={past}
                            title={past ? 'Cita pasada' : canCancel ? 'Ver o cancelar cita' : undefined}
                            onClick={() => canCancel && openCancel(appt)}
                          >
                            {label}
                          </button>
                        )
                      })}
                      {col.available.map((slot) => {
                        const past = isSlotInPast(col.iso, slot.startTime)
                        return (
                          <button
                            key={`${col.iso}-${slot.startTime}-${slot.appointmentId}`}
                            type="button"
                            className={`member-citas-slot${past ? ' is-past' : ''}`}
                            disabled={past}
                            title={past ? 'Horario ya pasado' : undefined}
                            onClick={() => !past && openBooking(col.iso, slot)}
                          >
                            {formatTime(slot.startTime)}
                          </button>
                        )
                      })}
                      {col.available.length === 0 && col.mine.length === 0 && (
                        <div className="member-citas-week-empty" aria-hidden>
                          <span /><span />
                        </div>
                      )}
                    </>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {booking && (
        <div className="modal-overlay" role="presentation" onClick={() => !busy && setBooking(null)}>
          <div
            className="modal card member-citas-book-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{appointmentTypeLabel(type)}</h2>
            <p className="member-citas-book-when">
              {capitalize(longDateLabel(booking.dateIso))}
              {' · '}
              {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
            </p>
            <p className="member-citas-gcal-tz member-citas-book-tz">
              (GMT-06:00) Hora estándar central - Costa Rica
            </p>
            <hr className="member-citas-book-divider" />

            <div className="form-group">
              <label>Tipo de cita</label>
              <select value={type} onChange={(e) => setType(e.target.value as AppointmentType)}>
                {APPOINTMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{appointmentTypeLabel(t)}</option>
                ))}
              </select>
            </div>

            <h3 className="member-citas-book-contact-title">Tu información de contacto</h3>
            <div className="form-group">
              <label>Nombre</label>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Apellidos</label>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Dirección de correo electrónico</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="modal-actions member-citas-book-actions">
              <button type="button" className="btn-secondary" disabled={busy} onClick={() => setBooking(null)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void handleReserve()}>
                {busy ? 'Reservando…' : 'Reservar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div className="modal-overlay" role="presentation" onClick={() => !busy && setCancelTarget(null)}>
          <div
            className="modal card member-citas-book-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{appointmentTypeLabel(cancelTarget.type)}</h2>
            <p className="member-citas-book-when">
              {formatTimeRange(cancelTarget.scheduledStart, cancelTarget.scheduledEnd)}
            </p>
            <p className="member-citas-gcal-tz member-citas-book-tz">
              (GMT-06:00) Hora estándar central - Costa Rica
            </p>
            <hr className="member-citas-book-divider" />
            <p className="form-hint" style={{ marginTop: 0 }}>
              Esta es una de tus citas. Puedes cancelar la asistencia desde aquí.
            </p>
            <div className="modal-actions member-citas-book-actions">
              <button type="button" className="btn-secondary" disabled={busy} onClick={() => setCancelTarget(null)}>
                Cerrar
              </button>
              <button type="button" className="btn-danger" disabled={busy} onClick={() => void handleCancel()}>
                {busy ? 'Cancelando…' : 'Cancelar asistencia'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

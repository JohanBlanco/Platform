import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../../api'
import ActivityCapacityDisplay from '../../components/ActivityCapacityDisplay'
import { useFilteredList } from '../../hooks/useFilteredList'
import { useDateFormat } from '../../preferences/useDateFormat'
import { useToast } from '../../toast'
import type { Activity, Reservation } from '../../types'
import { isActivityFull } from '../../utils/activityCalendarUtils'
import { addDays, isSameDay, toIsoDate } from '../../utils/calendarUtils'

function reservationKey(activityId: number | null | undefined, occurrenceDate: string) {
  return `${activityId ?? ''}|${occurrenceDate}`
}

function isFutureActivity(activity: Activity, now = new Date()): boolean {
  const end = new Date(`${activity.activityDate}T${activity.endTime || '23:59:59'}`)
  if (Number.isNaN(end.getTime())) {
    const day = new Date(`${activity.activityDate}T23:59:59`)
    return !Number.isNaN(day.getTime()) && day.getTime() >= now.getTime()
  }
  return end.getTime() >= now.getTime()
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10))
  if (!Number.isFinite(h)) return 0
  return h * 60 + (Number.isFinite(m) ? m : 0)
}

function sortByStartTime(a: Activity, b: Activity): number {
  const byTime = timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  if (byTime !== 0) return byTime
  return a.name.localeCompare(b.name, 'es')
}

function isBookableActivityDate(activityDate: string, now = new Date()): boolean {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const tomorrow = addDays(today, 1)
  return activityDate === toIsoDate(today) || activityDate === toIsoDate(tomorrow)
}

function capitalize(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

type DayGroup = {
  date: string
  label: string
  isToday: boolean
  activities: Activity[]
}

function groupByDay(
  items: Activity[],
  formatIsoDate: (iso: string) => string,
): DayGroup[] {
  const sorted = [...items].sort((a, b) => {
    const byDate = a.activityDate.localeCompare(b.activityDate)
    if (byDate !== 0) return byDate
    return sortByStartTime(a, b)
  })

  const today = new Date()
  const groups: DayGroup[] = []
  for (const activity of sorted) {
    const last = groups[groups.length - 1]
    if (!last || last.date !== activity.activityDate) {
      const dayDate = new Date(`${activity.activityDate}T12:00:00`)
      const weekday = dayDate.toLocaleDateString('es-CR', { weekday: 'long' })
      groups.push({
        date: activity.activityDate,
        label: `${capitalize(weekday)} · ${formatIsoDate(activity.activityDate)}`,
        isToday: isSameDay(dayDate, today),
        activities: [activity],
      })
    } else {
      last.activities.push(activity)
    }
  }
  return groups
}

export default function MemberActivitiesPage() {
  const { formatIsoDate, formatTimeRange } = useDateFormat()
  const { showSuccess, showApiError } = useToast()
  const [activities, setActivities] = useState<Activity[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const range = useMemo(() => {
    const from = new Date()
    from.setHours(0, 0, 0, 0)
    const to = addDays(from, 1)
    return { from: toIsoDate(from), to: toIsoDate(to) }
  }, [])

  const load = useCallback(async (options?: { background?: boolean }) => {
    if (!options?.background) setLoading(true)
    try {
      const [acts, mine] = await Promise.all([
        api.getActivities(range.from, range.to),
        api.getMyReservations(),
      ])
      setActivities(
        acts.filter(
          (a) =>
            a.active
            && !a.occurrenceCancelled
            && isFutureActivity(a)
            && isBookableActivityDate(a.activityDate),
        ),
      )
      setReservations(mine)
    } catch {
      setActivities([])
      setReservations([])
    } finally {
      if (!options?.background) setLoading(false)
    }
  }, [range.from, range.to])

  useEffect(() => {
    void load()
  }, [load])

  const confirmedByKey = useMemo(() => {
    const map = new Map<string, Reservation>()
    for (const r of reservations) {
      if (r.status !== 'CONFIRMED' || r.activityId == null) continue
      map.set(reservationKey(r.activityId, r.occurrenceDate), r)
    }
    return map
  }, [reservations])

  const { filtered, filterInput } = useFilteredList(activities)

  const dayGroups = useMemo(
    () => groupByDay(filtered, formatIsoDate),
    [filtered, formatIsoDate],
  )

  const handleReserve = async (activity: Activity) => {
    if (!isBookableActivityDate(activity.activityDate)) {
      showApiError(new Error('Solo puedes reservar para hoy o mañana'), 'Fuera de ventana')
      return
    }
    const key = reservationKey(activity.id, activity.activityDate)
    setBusyKey(key)
    try {
      await api.createReservation(activity.id, { occurrenceDate: activity.activityDate })
      showSuccess('Asistencia reservada')
      await load({ background: true })
    } catch (e) {
      if (e instanceof ApiError && e.message.includes('Debes pagar en recepción')) {
        const pay = window.confirm(`${e.message}\n\n¿Deseas reservar y pagar en recepción?`)
        if (pay) {
          try {
            await api.createReservation(activity.id, {
              payAtReception: true,
              occurrenceDate: activity.activityDate,
            })
            showSuccess('Reservación creada. Paga en recepción para confirmar.')
            await load({ background: true })
          } catch (err) {
            showApiError(err, 'Error al reservar')
            await load({ background: true })
          }
        }
      } else {
        showApiError(e, 'Error al reservar')
        await load({ background: true })
      }
    } finally {
      setBusyKey(null)
    }
  }

  const handleCancel = async (reservation: Reservation) => {
    const key = reservationKey(reservation.activityId, reservation.occurrenceDate)
    setBusyKey(key)
    try {
      await api.cancelReservation(reservation.id)
      showSuccess('Asistencia cancelada')
      await load({ background: true })
    } catch (e) {
      showApiError(e, 'Error al cancelar')
    } finally {
      setBusyKey(null)
    }
  }

  const renderCard = (a: Activity) => {
    const key = reservationKey(a.id, a.activityDate)
    const mine = confirmedByKey.get(key)
    const full = isActivityFull(a)
    const busy = busyKey === key

    return (
      <article key={key} className={`card member-activity-agenda-card${mine ? ' is-reserved' : ''}`}>
        <div className="member-activity-agenda-card-head">
          <h3 title={a.name}>{a.name}</h3>
          {mine ? (
            <span className="badge badge-confirmed">Reservada</span>
          ) : full ? (
            <span className="badge badge-cancelled">Sin cupos</span>
          ) : null}
        </div>
        <p className="card-list-meta">
          {formatTimeRange(a.startTime, a.endTime)}
        </p>
        <p className="card-list-meta">{a.locationName}</p>
        {a.description?.trim() && (
          <p className="card-desc" title={a.description}>
            {a.description}
          </p>
        )}
        <p className="member-activity-agenda-capacity">
          <ActivityCapacityDisplay activity={a} />
        </p>
        {mine && mine.paymentRequired && !mine.paid && (
          <p className="form-hint" style={{ marginTop: '0.5rem' }}>
            Paga en recepción para conservar tu cupo.
          </p>
        )}
        <div className="member-activity-agenda-actions">
          {mine ? (
            <button
              type="button"
              className="btn-danger"
              disabled={busy}
              onClick={() => void handleCancel(mine)}
            >
              {busy ? 'Cancelando…' : 'Cancelar asistencia'}
            </button>
          ) : full ? (
            <p className="form-hint" style={{ margin: 0 }}>
              Sin cupos disponibles para reservar.
            </p>
          ) : (
            <button
              type="button"
              className="btn-primary"
              disabled={busy}
              onClick={() => void handleReserve(a)}
            >
              {busy ? 'Reservando…' : 'Reservar'}
            </button>
          )}
        </div>
      </article>
    )
  }

  if (loading && activities.length === 0) {
    return <p>Cargando...</p>
  }

  return (
    <div className="member-activities-agenda">
      <div className="admin-list-toolbar">
        {filterInput}
        <Link to="/servicios/mis-actividades" className="btn-secondary">
          Mis actividades
        </Link>
      </div>
      <p className="form-hint" style={{ marginTop: 0, marginBottom: '0.85rem' }}>
        Por ahora solo puedes reservar actividades de hoy y mañana.
      </p>

      {activities.length === 0 ? (
        <div className="empty-state card">
          No hay actividades para hoy ni mañana
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card">Ningún resultado coincide con la búsqueda</div>
      ) : (
        <div className="member-activities-agenda-list">
          {dayGroups.map((group) => (
            <section key={group.date} className="member-activities-agenda-day">
              <header className="member-activities-agenda-day-head">
                <h2>{group.label}</h2>
                {group.isToday && <span className="badge badge-active">Hoy</span>}
                <span className="member-activities-agenda-day-count">
                  {group.activities.length} actividad{group.activities.length === 1 ? '' : 'es'}
                </span>
              </header>
              <div className="member-activities-agenda-grid">
                {group.activities.map(renderCard)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

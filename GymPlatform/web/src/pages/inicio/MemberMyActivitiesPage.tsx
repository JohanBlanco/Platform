import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import HorizontalSwitch from '../../components/HorizontalSwitch'
import { useDateFormat } from '../../preferences/useDateFormat'
import { useToast } from '../../toast'
import type { Reservation } from '../../types'
import { addDays, toIsoDate } from '../../utils/calendarUtils'

type RangeTab = 'upcoming' | 'past'

function dayLabel(iso: string, todayIso: string, tomorrowIso: string, formatIsoDate: (d: string) => string): string {
  if (iso === todayIso) return 'Hoy'
  if (iso === tomorrowIso) return 'Mañana'
  return formatIsoDate(iso)
}

export default function MemberMyActivitiesPage() {
  const { formatIsoDate } = useDateFormat()
  const { showSuccess, showApiError } = useToast()
  const [tab, setTab] = useState<RangeTab>('upcoming')
  const [loading, setLoading] = useState(true)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [busyId, setBusyId] = useState<number | null>(null)

  const todayIso = toIsoDate(new Date())
  const tomorrowIso = toIsoDate(addDays(new Date(), 1))

  const load = useCallback(async (options?: { background?: boolean }) => {
    if (!options?.background) setLoading(true)
    try {
      const list = await api.getMyReservations()
      setReservations(list.filter((r) => r.status === 'CONFIRMED'))
    } catch (e) {
      showApiError(e, 'Error al cargar tus actividades')
      setReservations([])
    } finally {
      if (!options?.background) setLoading(false)
    }
  }, [showApiError])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    return reservations
      .filter((r) => (tab === 'upcoming' ? r.occurrenceDate >= todayIso : r.occurrenceDate < todayIso))
      .sort((a, b) => {
        const byDate = a.occurrenceDate.localeCompare(b.occurrenceDate)
        if (byDate !== 0) return tab === 'upcoming' ? byDate : -byDate
        return a.activityName.localeCompare(b.activityName, 'es')
      })
  }, [reservations, tab, todayIso])

  const groups = useMemo(() => {
    const map = new Map<string, Reservation[]>()
    for (const r of filtered) {
      const list = map.get(r.occurrenceDate) ?? []
      list.push(r)
      map.set(r.occurrenceDate, list)
    }
    return Array.from(map.entries()).map(([date, items]) => ({ date, items }))
  }, [filtered])

  const handleCancel = async (reservation: Reservation) => {
    if (!window.confirm(`¿Cancelar tu asistencia a «${reservation.activityName}»?`)) return
    setBusyId(reservation.id)
    try {
      await api.cancelReservation(reservation.id)
      showSuccess('Asistencia cancelada')
      await load({ background: true })
    } catch (e) {
      showApiError(e, 'Error al cancelar')
    } finally {
      setBusyId(null)
    }
  }

  if (loading) {
    return <p>Cargando tus actividades…</p>
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
        <Link to="/servicios/actividades" className="btn-secondary">
          Reservar actividad
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          {tab === 'upcoming' ? (
            <>
              <p>No tienes clases reservadas</p>
              <Link to="/servicios/actividades" className="btn-primary" style={{ marginTop: '0.75rem' }}>
                Reservar actividad
              </Link>
            </>
          ) : (
            <p>Aún no hay actividades pasadas</p>
          )}
        </div>
      ) : (
        <div className="member-activities-agenda-list">
          {groups.map((group) => (
            <section key={group.date} className="member-activities-agenda-day">
              <h3 className="member-activities-agenda-day-title">
                {dayLabel(group.date, todayIso, tomorrowIso, formatIsoDate)}
              </h3>
              <ul className="member-home-activity-list">
                {group.items.map((r) => {
                  const canCancel = tab === 'upcoming'
                  const busy = busyId === r.id
                  return (
                    <li key={r.id}>
                      <div className="member-home-activity member-my-booking-row">
                        <time dateTime={r.occurrenceDate}>{formatIsoDate(r.occurrenceDate)}</time>
                        <strong>{r.activityName}</strong>
                        <span>
                          {r.paymentRequired && !r.paid
                            ? 'Paga en recepción para conservar tu cupo'
                            : r.freeSlot
                              ? 'Cupo incluido'
                              : 'Confirmada'}
                        </span>
                        {canCancel && (
                          <button
                            type="button"
                            className="btn-danger"
                            disabled={busy}
                            onClick={() => void handleCancel(r)}
                          >
                            {busy ? 'Cancelando…' : 'Cancelar'}
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
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../auth'
import ActivityPromotionCarousel from '../../components/ActivityPromotionCarousel'
import { useOrgBrand } from '../../orgBrand'
import { useDateFormat } from '../../preferences/useDateFormat'
import type { Activity, ActivityPromotion, MembershipUsage } from '../../types'
import { formatActivityTimeRange } from '../../utils/activityCalendarUtils'
import { addDays, toIsoDate } from '../../utils/calendarUtils'

/**
 * Portada de marketing del miembro (Inicio).
 * Solo debe usarse con rol MEMBER activo.
 */
export default function MemberHomePage() {
  const { user } = useAuth()
  const { organization } = useOrgBrand()
  const { formatIsoDate, formatTimeRange } = useDateFormat()
  const [activities, setActivities] = useState<Activity[]>([])
  const [promotions, setPromotions] = useState<ActivityPromotion[]>([])
  const [membershipUsage, setMembershipUsage] = useState<MembershipUsage | null>(null)
  const [routinesCount, setRoutinesCount] = useState(0)
  const [reservationsCount, setReservationsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setVisible(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    const todayIso = toIsoDate(new Date())
    const tomorrowIso = toIsoDate(addDays(new Date(), 1))

    Promise.all([
      api.getActivities(todayIso, tomorrowIso).catch(() => [] as Activity[]),
      api.getMyMembershipUsage().catch(() => null),
      api.getMyRoutines().catch(() => []),
      api.getMyReservations().catch(() => []),
      api.getActivityHomePromotions().catch(() => [] as ActivityPromotion[]),
    ]).then(([acts, usage, routines, reservations, homePromotions]) => {
      if (cancelled) return
      setActivities(acts)
      setMembershipUsage(usage)
      setRoutinesCount(routines.length)
      setReservationsCount(reservations.filter((r) => r.status !== 'CANCELLED').length)
      setPromotions(homePromotions)
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => { cancelled = true }
  }, [user?.organizationId])

  const upcoming = useMemo(() => {
    const today = toIsoDate(new Date())
    const tomorrow = toIsoDate(addDays(new Date(), 1))
    return activities
      .filter((a) => a.active !== false && (a.activityDate === today || a.activityDate === tomorrow))
      .sort((a, b) => {
        const byDate = a.activityDate.localeCompare(b.activityDate)
        if (byDate !== 0) return byDate
        return (a.startTime || '').localeCompare(b.startTime || '')
      })
      .slice(0, 4)
  }, [activities])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])

  const gymName = organization?.name || 'Tu gimnasio'
  const tagline = organization?.tagline?.trim()

  if (loading) {
    return <p className="member-home-loading">Preparando tu espacio…</p>
  }

  return (
    <div className={`member-home${visible ? ' is-ready' : ''}`}>
      <section className="member-home-hero" aria-labelledby="member-home-brand">
        <div className="member-home-hero-bg" aria-hidden>
          <span className="member-home-orb member-home-orb--a" />
          <span className="member-home-orb member-home-orb--b" />
          <span className="member-home-grid" />
        </div>

        <div className="member-home-hero-copy">
          <p id="member-home-brand" className="member-home-brand">
            {gymName}
          </p>
          <h1 className="member-home-headline">
            {greeting}, {user?.firstName}.
            <span className="member-home-headline-em">
              {' '}
              {tagline || 'Hoy entrenas con propósito.'}
            </span>
          </h1>
          <p className="member-home-lede">
            Tu espacio para clases, citas y tu plan — a tu ritmo, desde aquí.
          </p>
          <div className="member-home-cta">
            <Link to="/servicios/actividades" className="member-home-cta-primary">
              Reservar actividad
            </Link>
            <Link to="/servicios/mis-actividades" className="member-home-cta-ghost">
              Mis actividades
            </Link>
          </div>
        </div>

        <div className="member-home-hero-visual" aria-hidden>
          <div className="member-home-kinetic">
            <span className="member-home-ring" />
            <span className="member-home-ring member-home-ring--delay" />
            <strong className="member-home-kinetic-mark">GO</strong>
          </div>
        </div>
      </section>

      {(membershipUsage?.membershipName || routinesCount > 0 || reservationsCount > 0) && (
        <p className="member-home-status">
          {membershipUsage?.membershipName ? (
            <>
              Membresía <strong>{membershipUsage.membershipName}</strong>
              {!membershipUsage.unlimitedFreeActivities && membershipUsage.freeActivityQuota != null && (
                <>
                  {' · '}
                  {membershipUsage.freeActivitiesRemaining ?? 0} actividades incluidas restantes
                </>
              )}
            </>
          ) : (
            'Tu espacio de entrenamiento'
          )}
          {routinesCount > 0 && <> · {routinesCount} rutina{routinesCount === 1 ? '' : 's'}</>}
          {reservationsCount > 0 && <> · {reservationsCount} reserva{reservationsCount === 1 ? '' : 's'}</>}
          {' · '}
          <Link to="/servicios/mis-citas">Mis citas</Link>
        </p>
      )}

      {promotions.length > 0 && <ActivityPromotionCarousel promotions={promotions} />}

      <section className="member-home-agenda" aria-labelledby="member-home-agenda-title">
        <header className="member-home-section-head member-home-section-head--row">
          <div>
            <h2 id="member-home-agenda-title">Actividades disponibles</h2>
            <p>Ideas para hoy y mañana — elige la que más te motive.</p>
          </div>
          <Link to="/servicios/actividades" className="member-home-text-link">
            Ver agenda completa
          </Link>
        </header>

        {upcoming.length === 0 ? (
          <p className="member-home-empty">
            No hay clases abiertas para hoy o mañana. Explora la agenda o{' '}
            <Link to="/servicios/solicitudes-citas">agenda una cita</Link>.
          </p>
        ) : (
          <ul className="member-home-activity-list">
            {upcoming.map((a) => (
              <li key={`${a.id}-${a.activityDate}`}>
                <Link to="/servicios/actividades" className="member-home-activity">
                  <time dateTime={a.activityDate}>{formatIsoDate(a.activityDate)}</time>
                  <strong>{a.name}</strong>
                  <span>
                    {a.startTime && a.endTime
                      ? formatTimeRange(a.startTime, a.endTime)
                      : formatActivityTimeRange(a)}
                    {a.locationName ? ` · ${a.locationName}` : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

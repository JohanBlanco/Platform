import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../auth'
import { useOrgBrand } from '../../orgBrand'
import PendingPaymentsPanel from '../../components/dashboard/PendingPaymentsPanel'
import RoutineRequestsPanel from '../../components/dashboard/RoutineRequestsPanel'
import TodayActivitiesPanel from '../../components/dashboard/TodayActivitiesPanel'
import TodayAppointmentsPanel from '../../components/dashboard/TodayAppointmentsPanel'
import { canViewReception, canViewTrainingAdmin } from '../../roles'
import { bookedAppointmentsForDay, rangeToQuery } from '../../utils/appointmentCalendarUtils'
import { toIsoDate } from '../../utils/calendarUtils'
import { isRoutineRequestOpen } from '../../utils/routineRequest'
import type { Activity, AppointmentRequest, RoutineRequest, User } from '../../types'

type OpsPanel = 'pendientes-de-pago' | 'solicitudes-citas' | 'actividades-hoy' | 'solicitudes-rutina'

const PANEL_META: Record<OpsPanel, { label: string; short: string; seeAll?: string }> = {
  'pendientes-de-pago': { label: 'Pendientes de pago', short: 'Pagos', seeAll: '/reception/usuarios' },
  'solicitudes-citas': { label: 'Citas del día', short: 'Citas', seeAll: '/agenda/citas' },
  'actividades-hoy': { label: 'Actividades del día', short: 'Clases', seeAll: '/agenda/actividades' },
  'solicitudes-rutina': { label: 'Solicitudes de rutina', short: 'Rutinas', seeAll: '/training/rutinas' },
}

export default function StaffHomePage() {
  const { user, activeRole } = useAuth()
  const { organization } = useOrgBrand()
  const [searchParams, setSearchParams] = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<Activity[]>([])
  const [routineRequests, setRoutineRequests] = useState<RoutineRequest[]>([])
  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([])
  const [pendingPayments, setPendingPayments] = useState<User[]>([])

  const showOpsHome = canViewReception(activeRole)
  const showTrainingHome = canViewTrainingAdmin(activeRole)

  const panels = useMemo(() => {
    const list: OpsPanel[] = []
    if (showOpsHome) {
      list.push('pendientes-de-pago', 'solicitudes-citas', 'actividades-hoy')
    }
    if (showTrainingHome) {
      list.push('solicitudes-rutina')
    }
    return list
  }, [showOpsHome, showTrainingHome])

  const defaultPanel: OpsPanel = panels[0] ?? 'solicitudes-rutina'
  const panelParam = searchParams.get('panel') as OpsPanel | null
  const activePanel: OpsPanel =
    panelParam && panels.includes(panelParam) ? panelParam : defaultPanel

  const setPanel = (panel: OpsPanel) => {
    setSearchParams(panel === defaultPanel ? {} : { panel }, { replace: true })
  }

  const load = useCallback(async () => {
    const todayIso = toIsoDate(new Date())
    const tasks: Promise<void>[] = []
    if (showOpsHome) {
      tasks.push(api.getActivities(todayIso, todayIso).then(setActivities).catch(() => setActivities([])))
      tasks.push(api.getPendingMembershipPayment().then(setPendingPayments).catch(() => setPendingPayments([])))
      tasks.push(
        api.getAppointmentRequests(rangeToQuery(new Date(), new Date()))
          .then(setAppointmentRequests)
          .catch(() => setAppointmentRequests([])),
      )
    }
    if (showTrainingHome) {
      tasks.push(api.getRoutineRequests().then(setRoutineRequests).catch(() => setRoutineRequests([])))
    }
    await Promise.all(tasks)
  }, [showOpsHome, showTrainingHome])

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setVisible(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const counts: Record<OpsPanel, number> = {
    'pendientes-de-pago': pendingPayments.length,
    'solicitudes-citas': bookedAppointmentsForDay(appointmentRequests, new Date()).length,
    'actividades-hoy': activities.filter((a) => a.activityDate === toIsoDate(new Date()) && a.active !== false).length,
    'solicitudes-rutina': routineRequests.filter((r) => isRoutineRequestOpen(r.status)).length,
  }

  const urgentPanel = useMemo(() => {
    const ordered: OpsPanel[] = ['pendientes-de-pago', 'solicitudes-rutina', 'solicitudes-citas', 'actividades-hoy']
    for (const p of ordered) {
      if (panels.includes(p) && counts[p] > 0) return p
    }
    return panels[0] ?? null
  }, [panels, counts])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 19) return 'Buenas tardes'
    return 'Buenas noches'
  }, [])

  const gymName = organization?.name || 'Tu gimnasio'
  const statusLine = panels.map((p) => `${counts[p]} ${PANEL_META[p].short.toLowerCase()}`).join(' · ')

  if (loading) {
    return <p className="member-home-loading">Preparando tu espacio…</p>
  }

  if (panels.length === 0) {
    return (
      <div className="staff-home is-ready">
        <p className="member-home-lede">Cuando haya algo por ver aquí, te lo mostramos con gusto.</p>
      </div>
    )
  }

  return (
    <div className={`staff-home member-home${visible ? ' is-ready' : ''}`}>
      <section className="member-home-hero staff-home-hero" aria-labelledby="staff-home-brand">
        <div className="member-home-hero-bg" aria-hidden>
          <span className="member-home-orb member-home-orb--a" />
          <span className="member-home-orb member-home-orb--b" />
          <span className="member-home-grid" />
        </div>

        <div className="member-home-hero-copy">
          <p id="staff-home-brand" className="member-home-brand">
            {gymName}
          </p>
          <h1 className="member-home-headline">
            {greeting}, {user?.firstName}.
            <span className="member-home-headline-em"> Listos para un gran día.</span>
          </h1>
          <p className="member-home-lede">
            Hoy: {statusLine || 'todo tranquilo por ahora'}. Un vistazo rápido y el gym fluye contigo.
          </p>
          <div className="member-home-cta">
            {urgentPanel && (
              <button
                type="button"
                className="member-home-cta-primary"
                onClick={() => setPanel(urgentPanel)}
              >
                Ver {PANEL_META[urgentPanel].short.toLowerCase()}
              </button>
            )}
            <Link to="/agenda" className="member-home-cta-ghost">
              Abrir agenda
            </Link>
          </div>
        </div>

        <div className="member-home-hero-visual" aria-hidden>
          <div className="member-home-kinetic">
            <span className="member-home-ring" />
            <span className="member-home-ring member-home-ring--delay" />
            <strong className="member-home-kinetic-mark">Go!</strong>
          </div>
        </div>
      </section>

      <div className="staff-home-queue-rail" role="tablist" aria-label="Resumen del día">
        {panels.map((panel, index) => (
          <button
            key={panel}
            type="button"
            role="tab"
            aria-selected={activePanel === panel}
            className={`staff-home-queue${activePanel === panel ? ' is-active' : ''}`}
            style={{ '--mh-i': index } as CSSProperties}
            onClick={() => setPanel(panel)}
          >
            <span className="staff-home-queue-count">{counts[panel]}</span>
            <span className="staff-home-queue-label">{PANEL_META[panel].short}</span>
          </button>
        ))}
      </div>

      <section className="staff-home-board" aria-labelledby="staff-board-title">
        <header className="member-home-section-head member-home-section-head--row">
          <div>
            <h2 id="staff-board-title">{PANEL_META[activePanel].label}</h2>
            <p>Aquí tienes lo más útil para acompañar al equipo hoy</p>
          </div>
          {PANEL_META[activePanel].seeAll && (
            <Link to={PANEL_META[activePanel].seeAll!} className="member-home-text-link">
              Ver todo →
            </Link>
          )}
        </header>

        <div className="staff-home-board-body">
          {activePanel === 'pendientes-de-pago' && <PendingPaymentsPanel />}
          {activePanel === 'solicitudes-citas' && (
            <TodayAppointmentsPanel onChanged={() => { void load() }} />
          )}
          {activePanel === 'actividades-hoy' && (
            <TodayActivitiesPanel onChanged={() => { void load() }} />
          )}
          {activePanel === 'solicitudes-rutina' && (
            <RoutineRequestsPanel onChanged={() => { void load() }} />
          )}
        </div>
      </section>
    </div>
  )
}

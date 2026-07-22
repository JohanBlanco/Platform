import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth'
import { getAgendaSections } from '../../navigation/sections'

export default function AgendaLayout() {
  const { pathname } = useLocation()
  const { activeRole } = useAuth()
  const sections = getAgendaSections(activeRole)
  const active = sections.find((s) => pathname.endsWith(`/${s.path}`)) ?? sections[0]

  return (
    <div className="agenda-page">
      <div className="page-header">
        <h1>{active?.label ?? 'Agenda'}</h1>
        <p>{active?.description ?? 'Citas y actividades del gimnasio'}</p>
      </div>
      <div key={pathname} className="agenda-outlet">
        <Outlet />
      </div>
    </div>
  )
}

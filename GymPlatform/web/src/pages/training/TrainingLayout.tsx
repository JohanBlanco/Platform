import { Outlet, useLocation } from 'react-router-dom'
import { TRAINING_SECTIONS } from '../../navigation/sections'

export default function TrainingLayout() {
  const { pathname } = useLocation()
  const active = TRAINING_SECTIONS.find((s) => pathname.endsWith(`/${s.path}`))

  return (
    <div>
      <div className="page-header">
        <h1>
          {active?.label ?? 'Plan de entrenamiento'}
          {active?.badge && <span className="nav-beta-badge nav-beta-badge--header">{active.badge}</span>}
        </h1>
        <p>{active?.description ?? 'Rutinas, medidas y nutrición'}</p>
      </div>
      <Outlet />
    </div>
  )
}

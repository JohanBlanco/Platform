import { Outlet, useLocation } from 'react-router-dom'
import { ESTADISTICAS_SECTIONS } from '../../navigation/sections'

export default function EstadisticasLayout() {
  const { pathname } = useLocation()
  const active = ESTADISTICAS_SECTIONS.find((s) => pathname.endsWith(`/${s.path}`))

  return (
    <div>
      <div className="page-header">
        <h1>{active?.label ?? 'Estadísticas'}</h1>
        <p>{active?.description ?? 'Resumen operativo del gimnasio'}</p>
      </div>
      <Outlet />
    </div>
  )
}

import { Outlet, useLocation } from 'react-router-dom'
import { VENTAS_SECTIONS } from '../../navigation/sections'

export default function VentasLayout() {
  const { pathname } = useLocation()
  const active = VENTAS_SECTIONS.find((s) => pathname.endsWith(`/${s.path}`))

  return (
    <div>
      <div className="page-header">
        <h1>{active?.label ?? 'Tienda'}</h1>
        <p>{active?.description ?? 'Tienda del gimnasio'}</p>
      </div>
      <Outlet />
    </div>
  )
}

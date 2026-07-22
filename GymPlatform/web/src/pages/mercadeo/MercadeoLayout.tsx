import { Outlet, useLocation } from 'react-router-dom'
import { MERCADEO_SECTIONS } from '../../navigation/sections'

export default function MercadeoLayout() {
  const { pathname } = useLocation()
  const active = MERCADEO_SECTIONS.find((s) => pathname.endsWith(`/${s.path}`))

  return (
    <div className="mercadeo-layout">
      <div className="page-header">
        <p className="mercadeo-kicker">Publicidad & Mercadeo</p>
        <h1>{active?.label ?? 'Publicidad & Mercadeo'}</h1>
        <p>{active?.description ?? 'Promociones, ofertas y ambiente de la web'}</p>
      </div>
      <Outlet />
    </div>
  )
}

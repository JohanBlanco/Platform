import { Outlet, useLocation } from 'react-router-dom'
import { flattenNavSections, RECEPTION_SECTIONS } from '../../navigation/sections'

export default function ReceptionLayout() {
  const { pathname } = useLocation()
  const sections = flattenNavSections(RECEPTION_SECTIONS)
  const active = sections.find((section) => {
    if (section.path === 'expedientes') {
      return pathname.includes('/reception/expedientes')
    }
    return pathname.endsWith(`/${section.path}`)
  })

  return (
    <div>
      <div className="page-header">
        <h1>{active?.label ?? 'Administración'}</h1>
        <p>{active?.description ?? 'Gestión del gimnasio'}</p>
      </div>
      <Outlet />
    </div>
  )
}

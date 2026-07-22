import { Outlet, useLocation } from 'react-router-dom'
import type { NavSection } from '../navigation/sections'

type Props = {
  sections: NavSection[]
  fallbackTitle: string
  fallbackDescription: string
}

export default function NavSectionLayout({ sections, fallbackTitle, fallbackDescription }: Props) {
  const { pathname } = useLocation()
  const active = sections.find((s) => pathname.endsWith(`/${s.path}`))

  return (
    <div>
      <div className="page-header">
        <h1>
          {active?.label ?? fallbackTitle}
          {active?.badge && <span className="nav-beta-badge nav-beta-badge--header">{active.badge}</span>}
        </h1>
        <p>{active?.description ?? fallbackDescription}</p>
      </div>
      <Outlet />
    </div>
  )
}

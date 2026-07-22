import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { NavSection } from '../navigation/sections'

type Props = {
  id: string
  label: string
  basePath: string
  sections: NavSection[]
}

function readStoredOpen(id: string): boolean | null {
  const stored = localStorage.getItem(`nav-expanded-${id}`)
  if (stored === 'true') return true
  if (stored === 'false') return false
  return null
}

function sectionMatchesPath(section: NavSection, pathname: string, basePath: string): boolean {
  const href = `${basePath}/${section.path}`
  if (pathname === href || pathname.startsWith(`${href}/`)) return true
  return section.children?.some((child) => sectionMatchesPath(child, pathname, basePath)) ?? false
}

function NestedCollapsible({
  id,
  label,
  basePath,
  sections,
}: {
  id: string
  label: string
  basePath: string
  sections: NavSection[]
}) {
  const location = useLocation()
  const isActiveGroup = sections.some((section) =>
    sectionMatchesPath(section, location.pathname, basePath),
  )

  const [open, setOpen] = useState(() => {
    const stored = readStoredOpen(id)
    if (stored !== null) return stored
    return isActiveGroup
  })

  useEffect(() => {
    if (isActiveGroup) setOpen(true)
  }, [isActiveGroup])

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev
      localStorage.setItem(`nav-expanded-${id}`, next ? 'true' : 'false')
      return next
    })
  }

  return (
    <div className="sidebar-nested-group">
      <button
        type="button"
        className={`sidebar-nested-group-header${isActiveGroup ? ' active' : ''}`}
        onClick={toggle}
        aria-expanded={open}
      >
        <span>{label}</span>
        <span className="sidebar-group-chevron" aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="sidebar-subnav sidebar-subnav--nested">
          <NavSectionLinks sections={sections} basePath={basePath} depth={1} />
        </div>
      )}
    </div>
  )
}

function NavSectionLinks({
  sections,
  basePath,
  depth = 0,
}: {
  sections: NavSection[]
  basePath: string
  depth?: number
}) {
  return (
    <>
      {sections.map((section) => {
        if (section.collapsible && section.children?.length) {
          return (
            <NestedCollapsible
              key={`collapse-${section.path}`}
              id={`${basePath}-${section.path}`}
              label={section.label}
              basePath={basePath}
              sections={section.children}
            />
          )
        }

        return (
          <div key={section.path} className={depth > 0 ? 'sidebar-nested-item' : undefined}>
            <NavLink
              to={`${basePath}/${section.path}`}
              className={({ isActive }) =>
                `sidebar-sub-link${depth > 0 ? ' sidebar-sub-link--nested' : ''}${isActive ? ' active' : ''}`
              }
            >
              <span className="sidebar-sub-link-label">{section.label}</span>
              {section.badge && <span className="nav-beta-badge">{section.badge}</span>}
            </NavLink>
            {section.children && section.children.length > 0 && (
              <div className="sidebar-subnav sidebar-subnav--nested">
                <NavSectionLinks
                  sections={section.children}
                  basePath={basePath}
                  depth={depth + 1}
                />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

export default function CollapsibleNavGroup({ id, label, basePath, sections }: Props) {
  const location = useLocation()
  const isActiveGroup = location.pathname.startsWith(basePath)

  const [open, setOpen] = useState(() => {
    const stored = readStoredOpen(id)
    if (stored !== null) return stored
    return isActiveGroup
  })

  useEffect(() => {
    if (isActiveGroup) setOpen(true)
  }, [isActiveGroup])

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev
      localStorage.setItem(`nav-expanded-${id}`, next ? 'true' : 'false')
      return next
    })
  }

  return (
    <div className="sidebar-group">
      <button
        type="button"
        className={`sidebar-group-header${isActiveGroup ? ' active' : ''}`}
        onClick={toggle}
        aria-expanded={open}
      >
        <span>{label}</span>
        <span className="sidebar-group-chevron" aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="sidebar-subnav">
          <NavSectionLinks sections={sections} basePath={basePath} />
        </div>
      )}
    </div>
  )
}

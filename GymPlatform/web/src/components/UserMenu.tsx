import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { AuthResponse } from '../types'
import {
  canViewProfile,
  canViewReception,
  canViewVentas,
  canViewEstadisticas,
  canViewTrainingAdmin,
  canViewMercadeo,
  isMemberView,
  getSwitchableRoles,
  profileLabel,
  ROLE_LABELS,
  type GymRole,
} from '../roles'
import { usePreferences } from '../preferences'

type Props = {
  user: AuthResponse
  activeRole: string | null
  onActiveRoleChange: (role: GymRole) => void
  logout: () => void
  placement?: 'default' | 'sidebar'
  onOpenSettings?: () => void
}

export default function UserMenu({
  user,
  activeRole,
  onActiveRoleChange,
  logout,
  placement = 'default',
  onOpenSettings,
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const switchableRoles = getSwitchableRoles(user)
  const showProfile = canViewProfile(activeRole)
  const { t } = usePreferences()
  const currentLabel = profileLabel(activeRole)
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  const inSidebar = placement === 'sidebar'

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const handleRoleChange = (role: GymRole) => {
    if (role === activeRole) return
    onActiveRoleChange(role)
    if (!canViewReception(role) && location.pathname.startsWith('/reception')) {
      navigate('/')
    }
    if (!isMemberView(role) && location.pathname.startsWith('/servicios')) {
      navigate('/')
    }
    if (!canViewVentas(role) && location.pathname.startsWith('/ventas')) {
      navigate('/')
    }
    if (!canViewEstadisticas(role) && location.pathname.startsWith('/estadisticas')) {
      navigate('/')
    }
    if (!canViewTrainingAdmin(role) && location.pathname.startsWith('/training')) {
      navigate('/')
    }
    if (!canViewMercadeo(role) && location.pathname.startsWith('/mercadeo')) {
      navigate('/')
    }
    if (!canViewProfile(role) && location.pathname.startsWith('/profile')) {
      navigate('/')
    }
    setOpen(false)
  }

  return (
    <div className={`user-menu${inSidebar ? ' user-menu--sidebar' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menú de ${user.firstName} ${user.lastName}`}
        title={`${user.firstName} ${user.lastName} · ${currentLabel}`}
      >
        <span className="user-menu-avatar">{initials}</span>
        <span className="user-menu-text">
          <span className="user-menu-name">{user.firstName} {user.lastName}</span>
          <span className="user-menu-role">{currentLabel}</span>
        </span>
        <span className="user-menu-chevron">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="user-menu-dropdown" role="menu">
          {switchableRoles.length > 1 && (
            <>
              <div className="user-menu-section-label">{t('userMenu.currentProfile')}</div>
              {switchableRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`user-menu-item user-menu-role-item${role === activeRole ? ' active' : ''}`}
                  role="menuitemradio"
                  aria-checked={role === activeRole}
                  onClick={() => handleRoleChange(role)}
                >
                  <span>{ROLE_LABELS[role]}</span>
                  {role === activeRole && <span className="user-menu-role-check">✓</span>}
                </button>
              ))}
              <div className="user-menu-divider" />
            </>
          )}
          {showProfile && (
            <Link
              to="/profile"
              className="user-menu-item"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              {t('userMenu.profile')}
            </Link>
          )}
          {onOpenSettings && (
            <button
              type="button"
              className="user-menu-item"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onOpenSettings()
              }}
            >
              {t('userMenu.settings')}
            </button>
          )}
          <div className="user-menu-divider" />
          <button
            type="button"
            className="user-menu-item"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              logout()
            }}
          >
            {t('userMenu.logout')}
          </button>
        </div>
      )}
    </div>
  )
}


import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api, setUnauthorizedHandler, resetUnauthorizedHandling } from './api'
import type { AuthResponse } from './types'
import { resolveActiveRole, type GymRole } from './roles'

interface AuthContextType {
  user: AuthResponse | null
  activeRole: string | null
  setActiveRole: (role: GymRole) => void
  login: (login: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

function activeRoleKey(userId: number) {
  return `activeRole_${userId}`
}

function readStoredActiveRole(user: AuthResponse): string | null {
  return resolveActiveRole(user, localStorage.getItem(activeRoleKey(user.userId)))
}

function persistActiveRole(userId: number, role: string) {
  localStorage.setItem(activeRoleKey(userId), role)
}

function clearStoredSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  // Cerrar también desbloqueos de áreas privadas
  try {
    const keys: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k?.startsWith('statsUnlock:')) keys.push(k)
    }
    keys.forEach((k) => sessionStorage.removeItem(k))
  } catch {
    // ignore
  }
}

function redirectToLogin(expired = false) {
  if (window.location.pathname === '/login') return
  const suffix = expired ? '?expired=1' : ''
  window.location.assign(`/login${suffix}`)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null)
  const [activeRole, setActiveRoleState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback((expired = false) => {
    clearStoredSession()
    setUser(null)
    setActiveRoleState(null)
    redirectToLogin(expired)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => logout(true))
    return () => setUnauthorizedHandler(null)
  }, [logout])

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('token')
      const stored = localStorage.getItem('user')

      if (!token || !stored) {
        if (stored || token) clearStoredSession()
        setIsLoading(false)
        return
      }

      try {
        const session = await api.getSession()
        const authUser: AuthResponse = { ...session, token }
        localStorage.setItem('user', JSON.stringify(authUser))
        setUser(authUser)
        setActiveRoleState(readStoredActiveRole(authUser))
        resetUnauthorizedHandling()
      } catch {
        clearStoredSession()
        setUser(null)
        setActiveRoleState(null)
        redirectToLogin(true)
      } finally {
        setIsLoading(false)
      }
    }

    void bootstrap()
  }, [])

  const login = async (loginId: string, password: string) => {
    const response = await api.login(loginId, password)
    resetUnauthorizedHandling()
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response))
    const role = resolveActiveRole(response, localStorage.getItem(activeRoleKey(response.userId)))
    if (role) persistActiveRole(response.userId, role)
    setUser(response)
    setActiveRoleState(role)
  }

  const setActiveRole = useCallback((role: GymRole) => {
    if (!user) return
    if (!user.roles.includes(role)) return
    persistActiveRole(user.userId, role)
    setActiveRoleState(role)
  }, [user])

  const logoutWithoutExpiredFlag = useCallback(() => {
    logout(false)
  }, [logout])

  return (
    <AuthContext.Provider value={{ user, activeRole, setActiveRole, login, logout: logoutWithoutExpiredFlag, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

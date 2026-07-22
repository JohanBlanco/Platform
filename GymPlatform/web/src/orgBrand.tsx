import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from './api'
import { useAuth } from './auth'
import { applyOrgBrand } from './preferences/storage'
import type { AccentId } from './preferences/types'
import type { GymOrganization } from './types'

type OrgBrandContextValue = {
  organization: GymOrganization | null
  loading: boolean
  refreshOrganization: () => Promise<GymOrganization | null>
  setOrganizationLocal: (org: GymOrganization) => void
}

const OrgBrandContext = createContext<OrgBrandContextValue | null>(null)

function isAccentId(value: string | null | undefined): value is AccentId {
  return value === 'indigo' || value === 'emerald' || value === 'rose' || value === 'amber' || value === 'sky'
}

export function OrgBrandProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [organization, setOrganization] = useState<GymOrganization | null>(null)
  const [loading, setLoading] = useState(false)

  const applyFromOrg = useCallback((org: GymOrganization | null) => {
    if (org && isAccentId(org.accentId)) {
      applyOrgBrand(org.accentId, org.seasonTheme)
    } else {
      applyOrgBrand('indigo', org?.seasonTheme)
    }
  }, [])

  const refreshOrganization = useCallback(async () => {
    if (!user?.organizationId) {
      setOrganization(null)
      applyFromOrg(null)
      return null
    }
    setLoading(true)
    try {
      const org = await api.getMyOrganization()
      setOrganization(org)
      applyFromOrg(org)
      return org
    } catch {
      setOrganization(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [applyFromOrg, user?.organizationId])

  useEffect(() => {
    if (!user?.organizationId) {
      setOrganization(null)
      applyFromOrg(null)
      return
    }
    void refreshOrganization()
  }, [user?.organizationId, refreshOrganization, applyFromOrg])

  const value = useMemo<OrgBrandContextValue>(() => ({
    organization,
    loading,
    refreshOrganization,
    setOrganizationLocal: (org) => {
      setOrganization(org)
      applyFromOrg(org)
    },
  }), [organization, loading, refreshOrganization, applyFromOrg])

  return (
    <OrgBrandContext.Provider value={value}>
      {children}
    </OrgBrandContext.Provider>
  )
}

export function useOrgBrand() {
  const ctx = useContext(OrgBrandContext)
  if (!ctx) throw new Error('useOrgBrand must be used within OrgBrandProvider')
  return ctx
}

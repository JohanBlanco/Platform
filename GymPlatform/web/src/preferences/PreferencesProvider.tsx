import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslate } from './i18n'
import { applyPreferences, loadPreferences, savePreferences } from './storage'
import type { AccentId, Language, ThemeMode, UserPreferences } from './types'

type PreferencesContextValue = UserPreferences & {
  setTheme: (theme: ThemeMode) => void
  setAccent: (accent: AccentId) => void
  setLanguage: (language: Language) => void
  t: (key: import('./i18n').MessageKey) => string
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences())
  const t = useTranslate(preferences.language)

  useEffect(() => {
    applyPreferences(preferences)
    savePreferences(preferences)
  }, [preferences])

  const value = useMemo<PreferencesContextValue>(() => ({
    ...preferences,
    setTheme: (theme) => setPreferences((prev) => ({ ...prev, theme })),
    setAccent: (accent) => setPreferences((prev) => ({ ...prev, accent })),
    setLanguage: (language) => setPreferences((prev) => ({ ...prev, language })),
    t,
  }), [preferences, t])

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}

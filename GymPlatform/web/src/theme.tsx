import type { ReactNode } from 'react'
import type { ThemeMode } from './preferences'
import { PreferencesProvider, usePreferences } from './preferences'

export type { ThemeMode }

export function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.style.colorScheme = theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return <PreferencesProvider>{children}</PreferencesProvider>
}

export function useTheme() {
  const { theme, setTheme } = usePreferences()
  return { theme, setTheme }
}

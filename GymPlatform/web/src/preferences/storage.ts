import { DEFAULT_PREFERENCES, type AccentId, type Language, type ThemeMode, type UserPreferences } from './types'

export const STORAGE_KEY = 'gymplatform.preferences.v1'
const LEGACY_THEME_KEY = 'theme'

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'dark' || value === 'light'
}

function isAccentId(value: unknown): value is AccentId {
  return value === 'indigo' || value === 'emerald' || value === 'rose' || value === 'amber' || value === 'sky'
}

function isLanguage(value: unknown): value is Language {
  return value === 'es' || value === 'en'
}

function parsePreferences(raw: string | null): UserPreferences | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<UserPreferences>
    if (!isThemeMode(parsed.theme) || !isAccentId(parsed.accent) || !isLanguage(parsed.language)) {
      return null
    }
    return {
      theme: parsed.theme,
      accent: parsed.accent,
      language: parsed.language,
    }
  } catch {
    return null
  }
}

function migrateLegacyTheme(): UserPreferences | null {
  const legacy = localStorage.getItem(LEGACY_THEME_KEY)
  if (!isThemeMode(legacy)) return null
  return {
    ...DEFAULT_PREFERENCES,
    theme: legacy,
  }
}

export function loadPreferences(): UserPreferences {
  const stored = parsePreferences(localStorage.getItem(STORAGE_KEY))
  if (stored) return stored

  const migrated = migrateLegacyTheme()
  if (migrated) {
    savePreferences(migrated)
    return migrated
  }

  return { ...DEFAULT_PREFERENCES }
}

export function savePreferences(preferences: UserPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
}

export function applyPreferences(preferences: UserPreferences) {
  const root = document.documentElement
  root.setAttribute('data-theme', preferences.theme)
  root.style.colorScheme = preferences.theme
  root.lang = preferences.language
  // El acento lo controla el branding de la organización (applyOrgBrand).
}

export function applyOrgBrand(accent: AccentId, seasonTheme?: string | null) {
  document.documentElement.setAttribute('data-accent', accent)
  const season = seasonTheme && seasonTheme !== 'NONE' ? seasonTheme : ''
  if (season) {
    document.documentElement.setAttribute('data-season', season)
  } else {
    document.documentElement.removeAttribute('data-season')
  }
}

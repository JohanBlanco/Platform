const STORAGE_PREFIX = 'statsUnlock:'

export type StoredStatsUnlock = {
  token: string
  expiresAt: string
}

export function statsUnlockStorageKey(organizationId: number | null | undefined) {
  return `${STORAGE_PREFIX}${organizationId ?? 'none'}`
}

export function readStatsUnlock(organizationId: number | null | undefined): StoredStatsUnlock | null {
  try {
    const raw = sessionStorage.getItem(statsUnlockStorageKey(organizationId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredStatsUnlock
    if (!parsed.token || !parsed.expiresAt) return null
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      sessionStorage.removeItem(statsUnlockStorageKey(organizationId))
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeStatsUnlock(
  organizationId: number | null | undefined,
  unlock: StoredStatsUnlock,
) {
  sessionStorage.setItem(statsUnlockStorageKey(organizationId), JSON.stringify(unlock))
}

export function clearStatsUnlock(organizationId: number | null | undefined) {
  sessionStorage.removeItem(statsUnlockStorageKey(organizationId))
}

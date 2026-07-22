import type { User } from '../types'
import { ROLE_LABELS, type AppRole } from '../roles'

export type UserSearchMode = 'member' | 'staff'

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
}

export function userFullName(user: User): string {
  return `${user.firstName} ${user.lastName}`.trim()
}

export function userNationalId(user: User): string | null {
  return user.profile?.nationalId?.trim() || null
}

export function userRoleLabels(user: User): string {
  return user.roles
    .map((role) => ROLE_LABELS[role as AppRole] ?? role)
    .join(', ')
}

export function formatUserOption(user: User, mode: UserSearchMode = 'staff'): string {
  const name = userFullName(user)
  if (mode === 'member') {
    const nationalId = userNationalId(user)
    if (nationalId) return `${name} · ${nationalId}`
  }
  return name
}

export function formatUserHint(user: User, mode: UserSearchMode = 'staff'): string {
  if (mode === 'member') {
    const parts = [user.email]
    const nationalId = userNationalId(user)
    if (nationalId) parts.unshift(nationalId)
    if (user.profile?.phone) parts.push(user.profile.phone)
    return parts.join(' · ')
  }
  const roles = userRoleLabels(user)
  return roles ? `${user.email} · ${roles}` : user.email
}

export function filterUsers(
  users: User[],
  query: string,
  mode: UserSearchMode = 'staff',
  limit = 8,
): User[] {
  const trimmed = query.trim()
  if (!trimmed) {
    return users.slice(0, limit)
  }

  const qText = normalizeText(trimmed)
  const qDigits = normalizeDigits(trimmed)

  const scored = users
    .map((user) => {
      const fullName = normalizeText(userFullName(user))
      const firstName = normalizeText(user.firstName)
      const lastName = normalizeText(user.lastName)
      const email = normalizeText(user.email)
      const roles = normalizeText(userRoleLabels(user))
      const nationalId = normalizeText(userNationalId(user) ?? '')
      const nationalIdDigits = normalizeDigits(userNationalId(user) ?? '')
      const phoneDigits = normalizeDigits(user.profile?.phone ?? '')
      const idText = String(user.id)

      let score = 0

      if (fullName.startsWith(qText) || firstName.startsWith(qText) || lastName.startsWith(qText)) {
        score += 100
      } else if (fullName.includes(qText)) {
        score += 70
      }

      if (mode === 'member') {
        if (nationalId.startsWith(qText) || (qDigits && nationalIdDigits.startsWith(qDigits))) {
          score += 95
        } else if (nationalId.includes(qText) || (qDigits && nationalIdDigits.includes(qDigits))) {
          score += 80
        }
        if (qDigits && phoneDigits.includes(qDigits)) score += 50
      }

      if (roles.includes(qText)) score += 55
      if (email.startsWith(qText)) score += 60
      else if (email.includes(qText)) score += 40

      if (qDigits && idText.includes(qDigits)) score += 30

      const tokens = qText.split(/\s+/).filter(Boolean)
      if (tokens.length > 1 && tokens.every((token) => fullName.includes(token))) {
        score += 85
      }

      return { user, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || userFullName(a.user).localeCompare(userFullName(b.user)))

  return scored.slice(0, limit).map(({ user }) => user)
}

export function findUserById(users: User[], id: number | ''): User | undefined {
  if (id === '') return undefined
  return users.find((user) => user.id === id)
}

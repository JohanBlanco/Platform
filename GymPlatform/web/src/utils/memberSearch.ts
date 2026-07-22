import type { User } from '../types'

function normalizeDigits(value: string): string {
  return value.replace(/\D/g, '')
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
}

export function memberFullName(member: User): string {
  return `${member.firstName} ${member.lastName}`.trim()
}

export function memberNationalId(member: User): string | null {
  return member.profile?.nationalId?.trim() || null
}

export function memberSearchHaystack(member: User): string {
  const parts = [
    memberFullName(member),
    member.firstName,
    member.lastName,
    member.email,
    memberNationalId(member),
    member.profile?.phone,
    String(member.id),
  ]
  return parts.filter(Boolean).join(' ')
}

export function formatMemberOption(member: User): string {
  const name = memberFullName(member)
  const nationalId = memberNationalId(member)
  if (nationalId) return `${name} · ${nationalId}`
  return name
}

export function formatMemberHint(member: User): string {
  const parts = [member.email]
  const nationalId = memberNationalId(member)
  if (nationalId) parts.unshift(nationalId)
  if (member.profile?.phone) parts.push(member.profile.phone)
  return parts.join(' · ')
}

export function filterMembers(members: User[], query: string, limit = 8): User[] {
  const trimmed = query.trim()
  if (!trimmed) {
    return members.slice(0, limit)
  }

  const qText = normalizeText(trimmed)
  const qDigits = normalizeDigits(trimmed)

  const scored = members
    .map((member) => {
      const fullName = normalizeText(memberFullName(member))
      const firstName = normalizeText(member.firstName)
      const lastName = normalizeText(member.lastName)
      const email = normalizeText(member.email)
      const nationalId = normalizeText(memberNationalId(member) ?? '')
      const nationalIdDigits = normalizeDigits(memberNationalId(member) ?? '')
      const phoneDigits = normalizeDigits(member.profile?.phone ?? '')
      const idText = String(member.id)

      let score = 0

      if (fullName.startsWith(qText) || firstName.startsWith(qText) || lastName.startsWith(qText)) {
        score += 100
      } else if (fullName.includes(qText)) {
        score += 70
      }

      if (nationalId.startsWith(qText) || (qDigits && nationalIdDigits.startsWith(qDigits))) {
        score += 95
      } else if (nationalId.includes(qText) || (qDigits && nationalIdDigits.includes(qDigits))) {
        score += 80
      }

      if (email.startsWith(qText)) score += 60
      else if (email.includes(qText)) score += 40

      if (qDigits && phoneDigits.includes(qDigits)) score += 50
      if (qDigits && idText.includes(qDigits)) score += 30

      const tokens = qText.split(/\s+/).filter(Boolean)
      if (tokens.length > 1 && tokens.every((token) => fullName.includes(token))) {
        score += 85
      }

      return { member, score }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || memberFullName(a.member).localeCompare(memberFullName(b.member)))

  return scored.slice(0, limit).map(({ member }) => member)
}

export function findMemberById(members: User[], id: number | ''): User | undefined {
  if (id === '') return undefined
  return members.find((member) => member.id === id)
}

export function normalizeNationalId(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidNationalId(value: string): boolean {
  return /^\d{9}$/.test(normalizeNationalId(value))
}

export function formatNationalIdInput(value: string): string {
  return normalizeNationalId(value).slice(0, 9)
}

export const COSTA_RICA_WHATSAPP_CODE = '+506'

export function formatWhatsappLocalInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8)
}

export function isValidWhatsappLocal(value: string): boolean {
  return /^\d{8}$/.test(value)
}

export function whatsappPhoneToLocalDisplay(fullPhone?: string | null): string {
  if (!fullPhone) return ''
  const digits = fullPhone.replace(/\D/g, '')
  if (digits.startsWith('506') && digits.length >= 11) {
    return digits.slice(3, 11)
  }
  if (digits.length === 8) {
    return digits
  }
  return digits.slice(-8)
}

/** Validación práctica de correo (formato usuario@dominio.ext). */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim()
  if (!trimmed) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)
}

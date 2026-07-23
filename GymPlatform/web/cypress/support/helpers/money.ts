/** Parsea montos tipo "₡12 345" o "12345". */
export function parseColones(text: string): number {
  const digits = text.replace(/[^\d]/g, '')
  return parseInt(digits, 10) || 0
}

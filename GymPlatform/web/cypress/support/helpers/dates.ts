export function todayIso(): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export function tomorrowIso(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(12, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

/** Hora futura hoy para actividades (evita fallos si el test corre tarde). */
export function laterTodayTime(): string {
  const hour = Math.min(new Date().getHours() + 3, 21)
  return `${String(hour).padStart(2, '0')}:00`
}

/** Fecha de actividades E2E: siempre mañana (visible en agenda miembro hoy/mañana). */
export function e2eActivityDate(): string {
  return tomorrowIso()
}

/** Hora única por ejecución (evita solapes con actividades demo o runs anteriores). */
export function e2eActivityTime(): string {
  const slot = Math.floor(Date.now() / 30_000) % 16
  const hour = 10 + slot
  return `${String(hour).padStart(2, '0')}:00`
}

export function e2eRunId(): string {
  return Cypress.env('E2E_RUN_ID') ?? `e2e-${Date.now()}`
}

/**
 * Sufijo corto para nombres de producto. El backend genera codePrefix (máx. 20 chars)
 * desde el nombre; «E2E Bebida e2e-1784742323988» y «…385314» colisionan al truncar.
 */
export function e2eUniqueSuffix(): string {
  const run = String(Cypress.env('E2E_RUN_ID') ?? Date.now())
  const runDigits = run.replace(/\D/g, '').slice(-6)
  const seq = ((Cypress.env('E2E_SEQ') as number | undefined) ?? 0) + 1
  Cypress.env('E2E_SEQ', seq)
  return `${runDigits}${seq}`
}

export function resetE2eSequence(): void {
  Cypress.env('E2E_SEQ', 0)
}

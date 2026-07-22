export function isRoutineRequestOpen(status: string) {
  return status === 'PENDING' || status === 'IN_PROGRESS'
}

export const ROUTINE_REQUEST_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada',
  REJECTED: 'Rechazada',
}

export function routineRequestStatusLabel(status: string) {
  return ROUTINE_REQUEST_STATUS_LABELS[status] ?? status
}

/** Clase completa del badge, p. ej. `badge-pending` (usar como `badge ${routineRequestBadgeClass(status)}`). */
export function routineRequestBadgeClass(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'badge-confirmed'
    case 'REJECTED':
      return 'badge-cancelled'
    case 'IN_PROGRESS':
      return 'badge-trial'
    default:
      return 'badge-pending'
  }
}

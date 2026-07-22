import type { AppointmentStatus, AppointmentType } from '../types'

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  MEASUREMENT: 'Medidas',
  NUTRITION: 'Nutrición',
  ROUTINE: 'Rutina',
  CONSULTATION: 'Consulta',
  OTHER: 'Otro',
}

export const APPOINTMENT_TYPES: AppointmentType[] = ['MEASUREMENT', 'NUTRITION', 'ROUTINE', 'CONSULTATION', 'OTHER']

/** Motivos mostrados al staff al crear cita desde el calendario */
export const STAFF_CALENDAR_APPOINTMENT_TYPES: AppointmentType[] = ['NUTRITION', 'MEASUREMENT', 'CONSULTATION', 'OTHER']

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  OPEN: 'Disponible',
  BLOCKED: 'No disponible',
  PENDING: 'Pendiente',
  SCHEDULED: 'Agendada',
  COMPLETED: 'Completada',
  REJECTED: 'Rechazada',
  CANCELLED: 'Cancelada',
}

export function appointmentTypeLabel(type: string): string {
  return APPOINTMENT_TYPE_LABELS[type as AppointmentType] ?? type
}

export function appointmentStatusLabel(status: string): string {
  return APPOINTMENT_STATUS_LABELS[status as AppointmentStatus] ?? status
}

export function appointmentStatusClass(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'appointment-status--open'
    case 'BLOCKED':
      return 'appointment-status--blocked'
    case 'PENDING':
      return 'appointment-status--pending'
    case 'SCHEDULED':
      return 'appointment-status--scheduled'
    case 'COMPLETED':
      return 'appointment-status--completed'
    case 'REJECTED':
      return 'appointment-status--rejected'
    case 'CANCELLED':
      return 'appointment-status--cancelled'
    default:
      return ''
  }
}

export function isAppointmentInactive(status: string): boolean {
  return status === 'CANCELLED' || status === 'REJECTED'
}

/** Citas que no deben mostrarse en el calendario */
export function isAppointmentOnCalendar(status: string): boolean {
  return status !== 'CANCELLED' && status !== 'REJECTED' && status !== 'BLOCKED'
}

/** Citas creadas/reservadas (excluye espacios OPEN de disponibilidad). */
export function isBookedAppointment(status: string): boolean {
  return status === 'PENDING' || status === 'SCHEDULED' || status === 'COMPLETED'
}

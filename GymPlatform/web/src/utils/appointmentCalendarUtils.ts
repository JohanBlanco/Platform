import type { AppointmentRequest, StaffAvailability } from '../types'
import type { CalendarView } from './calendarUtils'
import { isBookedAppointment } from './appointmentUtils'
import { addDays, getRangeForView, isSameDay, parseDate, toIsoDate } from './calendarUtils'
import { formatTimeRangeLabel } from './dateFormat'

export const TIMELINE_START_HOUR = 0
export const TIMELINE_END_HOUR = 24
export const TIMELINE_HOUR_HEIGHT = 56
export const TIMELINE_MIN_BLOCK_HEIGHT = 28
export const TIMELINE_DAY_MINUTES = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60

export function readTimelineHourHeight(fromEl?: Element | null): number {
  if (typeof document === 'undefined') return TIMELINE_HOUR_HEIGHT
  const root = fromEl?.closest('.appointment-gcal') ?? document.documentElement
  const raw = getComputedStyle(root).getPropertyValue('--timeline-hour-height').trim()
  const parsed = parseFloat(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : TIMELINE_HOUR_HEIGHT
}

export function minutesToTimelinePercent(minutes: number): number {
  return (minutes / TIMELINE_DAY_MINUTES) * 100
}

export function parseDateTime(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatTimeRange(start: string | null, end: string | null): string {
  return formatTimeRangeLabel(start, end, 'es')
}

export function appointmentsForDay(appointments: AppointmentRequest[], day: Date): AppointmentRequest[] {
  return appointments.filter((a) => {
    const start = parseDateTime(a.scheduledStart)
    return start != null && isSameDay(start, day)
  })
}

/** Citas reservadas/agendadas del día (excluye espacios OPEN de disponibilidad). */
export function bookedAppointmentsForDay(appointments: AppointmentRequest[], day: Date): AppointmentRequest[] {
  return appointmentsForDay(appointments, day).filter(
    (a) => a.scheduledStart != null && isBookedAppointment(a.status),
  )
}

export function appointmentsForRange(
  appointments: AppointmentRequest[],
  from: Date,
  to: Date,
): AppointmentRequest[] {
  return appointments.filter((a) => {
    const start = parseDateTime(a.scheduledStart)
    if (!start) return false
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const fromDay = new Date(from.getFullYear(), from.getMonth(), from.getDate())
    const toDay = new Date(to.getFullYear(), to.getMonth(), to.getDate())
    return day >= fromDay && day <= toDay
  })
}

export function rangeToQuery(from: Date, to: Date): { from: string; to: string } {
  const fromDate = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const toExclusive = addDays(new Date(to.getFullYear(), to.getMonth(), to.getDate()), 1)
  return {
    from: fromDate.toISOString(),
    to: toExclusive.toISOString(),
  }
}

export function getAppointmentRange(view: CalendarView, anchor: Date) {
  return getRangeForView(view, anchor)
}

export function minutesFromTimelineStart(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() - TIMELINE_START_HOUR * 60
}

export function appointmentDurationMinutes(start: string | null, end: string | null): number {
  const s = parseDateTime(start)
  const e = parseDateTime(end)
  if (!s || !e) return 30
  return Math.max(15, Math.round((e.getTime() - s.getTime()) / 60000))
}

export function appointmentTimelineStyle(start: string | null, end: string | null): {
  top: string
  height: string
} {
  const s = parseDateTime(start)
  const e = parseDateTime(end)
  if (!s || !e) {
    return { top: '0%', height: `${minutesToTimelinePercent(30)}%` }
  }
  const topMinutes = Math.max(0, minutesFromTimelineStart(s))
  const duration = appointmentDurationMinutes(start, end)
  const minHeightPct = minutesToTimelinePercent(15)
  return {
    top: `${minutesToTimelinePercent(topMinutes)}%`,
    height: `${Math.max(minHeightPct, minutesToTimelinePercent(duration))}%`,
  }
}

export function availabilityForDay(blocks: StaffAvailability[], day: Date): StaffAvailability[] {
  const iso = toIsoDate(day)
  return blocks.filter((b) => b.availabilityDate === iso)
}

export function availabilityTimelineStyle(
  availabilityDate: string,
  startTime: string,
  endTime: string,
): { top: string; height: string } {
  return appointmentTimelineStyle(
    combineDateAndTime(availabilityDate, startTime.slice(0, 5)),
    combineDateAndTime(availabilityDate, endTime.slice(0, 5)),
  )
}

/** Posición de un slot dentro de un bloque de disponibilidad (porcentajes). */
export function slotStyleWithinBlock(
  availabilityDate: string,
  blockStart: string,
  blockEnd: string,
  slotStart: string,
  slotEnd: string,
): { top: string; height: string } {
  const blockStartDt = parseDateTime(combineDateAndTime(availabilityDate, blockStart.slice(0, 5)))
  const blockEndDt = parseDateTime(combineDateAndTime(availabilityDate, blockEnd.slice(0, 5)))
  const slotStartDt = parseDateTime(combineDateAndTime(availabilityDate, slotStart.slice(0, 5)))
  const slotEndDt = parseDateTime(combineDateAndTime(availabilityDate, slotEnd.slice(0, 5)))
  if (!blockStartDt || !blockEndDt || !slotStartDt || !slotEndDt) {
    return { top: '0%', height: '100%' }
  }
  const blockMs = blockEndDt.getTime() - blockStartDt.getTime()
  if (blockMs <= 0) return { top: '0%', height: '100%' }
  const topPct = ((slotStartDt.getTime() - blockStartDt.getTime()) / blockMs) * 100
  const heightPct = ((slotEndDt.getTime() - slotStartDt.getTime()) / blockMs) * 100
  return {
    top: `${Math.max(0, topPct)}%`,
    height: `${Math.max(0, heightPct)}%`,
  }
}

export function isoDateFromAppointment(a: AppointmentRequest): string | null {
  const start = parseDateTime(a.scheduledStart)
  return start ? toIsoDate(start) : null
}

export function combineDateAndTime(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  return new Date(y, m - 1, d, hh, mm ?? 0, 0, 0).toISOString()
}

export function dateInputValue(date: Date): string {
  return toIsoDate(date)
}

export function parseLocalDate(isoDate: string): Date {
  return parseDate(isoDate)
}

/** Hora local HH:mm desde un ISO UTC del backend. */
export function localTimeFromIso(iso: string | null | undefined): string {
  const d = parseDateTime(iso)
  if (!d) return ''
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** Minutos desde medianoche (hora local) desde un ISO. */
export function localMinutesFromIso(iso: string | null | undefined): number {
  const d = parseDateTime(iso)
  if (!d) return 0
  return d.getHours() * 60 + d.getMinutes()
}

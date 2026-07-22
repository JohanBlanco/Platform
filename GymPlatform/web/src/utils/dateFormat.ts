import type { Language } from '../preferences/types'
import type { CalendarView } from './calendarUtils'
import { addDays, parseDate, startOfWeek } from './calendarUtils'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const CLOCK = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/

export function getDateLocale(language: Language): string {
  return language === 'es' ? 'es-CR' : 'en-US'
}

function toDate(value: Date | string): Date {
  if (value instanceof Date) return value
  if (ISO_DATE.test(value)) return parseDate(value)
  return new Date(value)
}

/** Acepta Date, ISO datetime o reloj `HH:mm` / `HH:mm:ss`. */
export function parseClockOrDateTime(value: Date | string): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  const raw = value.trim()
  if (!raw) return null
  const clock = CLOCK.exec(raw)
  if (clock) {
    const d = new Date(
      2000,
      0,
      1,
      Number(clock[1]),
      Number(clock[2]),
      Number(clock[3] ?? 0),
    )
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (ISO_DATE.test(raw)) {
    return parseDate(raw)
  }
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

const TIME_OPTS: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
}

/** Hora en formato 12 h (ej. 9:30 a. m.). */
export function formatTime(value: Date | string, language: Language = 'es'): string {
  const d = parseClockOrDateTime(value)
  if (!d) return String(value)
  return d.toLocaleTimeString(getDateLocale(language), TIME_OPTS)
}

/** Rango de horas 12 h (ej. 9:00 a. m. – 10:00 a. m.). */
export function formatTimeRangeLabel(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
  language: Language = 'es',
  emptyLabel = 'Sin horario',
): string {
  if (start == null || end == null || start === '' || end === '') return emptyLabel
  return `${formatTime(start, language)} – ${formatTime(end, language)}`
}

/** Fecha corta: dd/mm/yyyy (es) o mm/dd/yyyy (en). */
export function formatDate(
  value: Date | string,
  language: Language,
  options?: Intl.DateTimeFormatOptions,
): string {
  return toDate(value).toLocaleDateString(getDateLocale(language), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  })
}

export function formatDateTime(value: Date | string, language: Language): string {
  return toDate(value).toLocaleString(getDateLocale(language), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...TIME_OPTS,
  })
}

export function formatIsoDate(isoDate: string, language: Language): string {
  return formatDate(parseDate(isoDate), language)
}

export function formatDateRangeLabel(
  startDate: string,
  endDate: string | undefined,
  language: Language,
): string {
  if (!endDate || endDate === startDate) return formatIsoDate(startDate, language)
  return `${formatIsoDate(startDate, language)} → ${formatIsoDate(endDate, language)}`
}

export function formatPeriodLabel(
  view: CalendarView,
  anchor: Date,
  language: Language,
): string {
  const locale = getDateLocale(language)
  if (view === 'day') {
    return anchor.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
  if (view === 'week') {
    const from = startOfWeek(anchor)
    const to = addDays(from, 6)
    return `${from.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} – ${to.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`
  }
  if (view === 'month') {
    return anchor.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  }
  return String(anchor.getFullYear())
}

export function dateSearchTerms(value: Date | string): string[] {
  const date = toDate(value)
  const iso = ISO_DATE.test(String(value)) ? String(value) : undefined
  const terms = [
    date.toISOString(),
    formatDate(date, 'es'),
    formatDate(date, 'en'),
    date.toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' }),
    date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
  ]
  if (iso) {
    terms.push(iso, formatIsoDate(iso, 'es'), formatIsoDate(iso, 'en'))
  }
  return terms
}

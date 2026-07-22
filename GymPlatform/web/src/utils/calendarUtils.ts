import type { Activity } from '../types'

export type CalendarView = 'day' | 'week' | 'month' | 'year'

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function addYears(date: Date, years: number): Date {
  const d = new Date(date)
  d.setFullYear(d.getFullYear() + years)
  return d
}

export function activitiesForDay(activities: Activity[], day: Date): Activity[] {
  return activities.filter((a) => isSameDay(parseDate(a.activityDate), day))
}

export function activitiesForRange(activities: Activity[], from: Date, to: Date): Activity[] {
  return activities.filter((a) => {
    const d = parseDate(a.activityDate)
    return d >= from && d <= to
  })
}

export function getRangeForView(view: CalendarView, anchor: Date): { from: Date; to: Date } {
  if (view === 'day') {
    return { from: anchor, to: anchor }
  }
  if (view === 'week') {
    const from = startOfWeek(anchor)
    return { from, to: addDays(from, 6) }
  }
  if (view === 'month') {
    const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
    const to = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)
    return { from, to }
  }
  const from = new Date(anchor.getFullYear(), 0, 1)
  const to = new Date(anchor.getFullYear(), 11, 31)
  return { from, to }
}

export function shiftAnchor(view: CalendarView, anchor: Date, delta: number): Date {
  if (view === 'day') return addDays(anchor, delta)
  if (view === 'week') return addDays(anchor, delta * 7)
  if (view === 'month') return addMonths(anchor, delta)
  return addYears(anchor, delta)
}

export const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export const MONTH_LABELS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

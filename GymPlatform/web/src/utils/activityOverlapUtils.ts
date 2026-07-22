import type { Activity } from '../types'
import { parseActivityTimeMinutes } from './activityCalendarUtils'
import { addDays, toIsoDate } from './calendarUtils'
import { weekdayFromDate } from './activityDurationUtils'

function resolveEndMinutes(startMin: number, endTime: string | null | undefined): number {
  if (endTime) return parseActivityTimeMinutes(endTime)
  return startMin + 60
}

function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd
}

export function activityOccurrenceOverlaps(
  a: Pick<Activity, 'activityDate' | 'startTime' | 'endTime' | 'allDay'>,
  b: Pick<Activity, 'activityDate' | 'startTime' | 'endTime' | 'allDay' | 'id'>,
  excludeSameOccurrence?: { activityId: number; date: string },
): boolean {
  if (a.activityDate !== b.activityDate) return false
  if (
    excludeSameOccurrence
    && b.id === excludeSameOccurrence.activityId
    && b.activityDate === excludeSameOccurrence.date
  ) {
    return false
  }
  if (a.allDay || b.allDay) return true

  const aStart = parseActivityTimeMinutes(a.startTime)
  const aEnd = resolveEndMinutes(aStart, a.endTime)
  const bStart = parseActivityTimeMinutes(b.startTime)
  const bEnd = resolveEndMinutes(bStart, b.endTime)
  return rangesOverlap(aStart, aEnd, bStart, bEnd)
}

export function findActivityOverlap(
  candidate: Pick<Activity, 'activityDate' | 'startTime' | 'endTime' | 'allDay'>,
  activities: Activity[],
  exclude?: { activityId: number; date: string },
): Activity | null {
  for (const other of activities) {
    if (activityOccurrenceOverlaps(candidate, other, exclude)) {
      return other
    }
  }
  return null
}

export function formatActivityOverlapMessage(other: Activity): string {
  return `Este horario se solapa con «${other.name}». Elige otro horario.`
}

export function expandActivityOccurrenceDates(
  startDate: string,
  endDate: string,
  recurring: boolean,
  repeatDays: string[],
): string[] {
  const endIso = recurring ? endDate : startDate
  const dates: string[] = []
  let cursor = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endIso}T12:00:00`)

  while (cursor <= end) {
    const iso = toIsoDate(cursor)
    if (!recurring || repeatDays.includes(weekdayFromDate(iso))) {
      dates.push(iso)
    }
    cursor = addDays(cursor, 1)
  }

  return dates
}

export function findOverlappingActivitiesForAllDayCreate(
  startDate: string,
  endDate: string,
  recurring: boolean,
  repeatDays: string[],
  activities: Activity[],
): Activity[] {
  const byId = new Map<number, Activity>()
  const dates = expandActivityOccurrenceDates(startDate, endDate, recurring, repeatDays)

  for (const dateIso of dates) {
    const candidate = {
      activityDate: dateIso,
      startTime: '00:00',
      endTime: '23:59',
      allDay: true,
    }
    for (const other of activities) {
      if (activityOccurrenceOverlaps(candidate, other)) {
        byId.set(other.id, other)
      }
    }
  }

  return [...byId.values()]
}

export function formatAllDayOverlapConfirmMessage(overlaps: Activity[]): string {
  const names = [...new Set(overlaps.map((a) => a.name))]
  const lines = names.slice(0, 6).map((name) => `· ${name}`)
  if (names.length > 6) {
    lines.push(`· … y ${names.length - 6} más`)
  }
  return [
    `Esta actividad de todo el día se solapa con ${names.length} actividad(es) en el calendario:`,
    '',
    ...lines,
    '',
    '¿Cancelar las demás y crear esta actividad?',
  ].join('\n')
}

import type { Activity } from '../types'
import {
  availabilityTimelineStyle,
  combineDateAndTime,
  formatTimeRange,
} from './appointmentCalendarUtils'
import { activitiesForDay } from './calendarUtils'
import {
  durationLabelForSchedule,
  inferDurationPresetId,
} from './activityDurationUtils'
import { formatTime } from './dateFormat'
import { minutesToTimeString } from './timelineResizeUtils'

const PREVIEW_DATE = '2000-01-01'

export function formatActivityMinutesRange(startMin: number, endMin: number): string {
  return formatTimeRange(
    combineDateAndTime(PREVIEW_DATE, minutesToTimeString(startMin)),
    combineDateAndTime(PREVIEW_DATE, minutesToTimeString(endMin)),
  )
}

export function parseActivityTimeMinutes(time: string): number {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function isAllDayActivity(activity: Activity): boolean {
  return activity.allDay === true
}

export function activityTimelineStyle(activity: Activity): { top: string; height: string } | null {
  if (isAllDayActivity(activity)) return null
  return availabilityTimelineStyle(activity.activityDate, activity.startTime, activity.endTime)
}

export function formatActivityTimeRange(activity: Activity): string {
  if (isAllDayActivity(activity)) return 'Todo el día'
  const start = combineDateAndTime(activity.activityDate, activity.startTime.slice(0, 5))
  const end = combineDateAndTime(activity.activityDate, activity.endTime.slice(0, 5))
  return formatTimeRange(start, end)
}

export function formatActivityScheduleSummary(
  activityDate: string,
  allDay: boolean,
  startTime: string,
  endTime: string | null,
  durationLabel: string,
): string {
  if (allDay) return 'Todo el día'
  if (!endTime) return `${formatTime(startTime.slice(0, 5))} · ${durationLabel}`
  const range = formatTimeRange(
    combineDateAndTime(activityDate, startTime.slice(0, 5)),
    combineDateAndTime(activityDate, endTime.slice(0, 5)),
  )
  return `${range} · ${durationLabel}`
}

export function formatActivityScheduleFromActivity(activity: Activity): string {
  if (isAllDayActivity(activity)) return 'Todo el día'
  const presetId = inferDurationPresetId(activity.allDay, activity.startTime, activity.endTime)
  const durationLabel = durationLabelForSchedule(
    false,
    activity.startTime,
    activity.endTime,
    presetId,
  )
  return formatActivityScheduleSummary(
    activity.activityDate,
    false,
    activity.startTime,
    activity.endTime,
    durationLabel,
  )
}

export function isActivitySeries(activity: Activity, allActivities: Activity[]): boolean {
  if (activity.recurring) return true
  if ((activity.repeatDays?.length ?? 0) > 0) return true
  if (activity.startDate !== activity.endDate) return true
  return allActivities.filter((a) => a.id === activity.id).length > 1
}

export function compareActivitiesByTime(a: Activity, b: Activity): number {
  if (isAllDayActivity(a) && !isAllDayActivity(b)) return -1
  if (!isAllDayActivity(a) && isAllDayActivity(b)) return 1
  const dateCmp = a.activityDate.localeCompare(b.activityDate)
  if (dateCmp !== 0) return dateCmp
  return parseActivityTimeMinutes(a.startTime) - parseActivityTimeMinutes(b.startTime)
}

export function sortedActivitiesForDay(activities: Activity[], day: Date): Activity[] {
  return [...activitiesForDay(activities, day)]
    .filter((a) => !isAllDayActivity(a))
    .sort(compareActivitiesByTime)
}

export function allDayActivitiesForDay(activities: Activity[], day: Date): Activity[] {
  return activitiesForDay(activities, day).filter(isAllDayActivity)
}

export function activityReservedCount(activity: Activity): number {
  return activity.confirmedReservations
}

export function activityRemainingCapacity(activity: Activity): number | null {
  if (activity.capacity == null) return null
  return Math.max(0, activity.capacity - activityReservedCount(activity))
}

export function isActivityFull(activity: Activity): boolean {
  return activity.capacity != null && !activity.hasCapacity
}

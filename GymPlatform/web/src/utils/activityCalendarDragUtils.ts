import type { Activity } from '../types'
import { parseActivityTimeMinutes } from './activityCalendarUtils'
import { findActivityOverlap } from './activityOverlapUtils'
import { getDayGridAtPoint, dateIsoFromDayGrid } from './appointmentCalendarDragUtils'
import {
  clampTimelineMinutes,
  minutesToTimeString,
  pointerYToMinutesRaw,
  snapTimelineMinutes,
  timeStringToMinutes,
} from './timelineResizeUtils'
import { TIMELINE_END_HOUR, TIMELINE_START_HOUR } from './appointmentCalendarUtils'

const DRAG_THRESHOLD_PX = 4

export function activityStartMinutes(activity: Activity): number {
  return parseActivityTimeMinutes(activity.startTime)
}

export function activityEndMinutes(activity: Activity): number {
  if (activity.allDay) return TIMELINE_END_HOUR * 60
  const start = activityStartMinutes(activity)
  if (activity.endTime) return parseActivityTimeMinutes(activity.endTime)
  return start + 60
}

export function isValidActivityMove(
  activity: Activity,
  allActivities: Activity[],
  dateIso: string,
  startMin: number,
  endMin: number,
): boolean {
  if (activity.allDay) return false
  if (endMin <= startMin) return false

  const startTime = minutesToTimeString(startMin)
  const endTime = minutesToTimeString(endMin)
  const overlap = findActivityOverlap(
    { activityDate: dateIso, startTime, endTime, allDay: false },
    allActivities,
    { activityId: activity.id, date: activity.activityDate },
  )
  return overlap == null
}

type ActivityMoveOptions = {
  scrollEl: HTMLElement
  activity: Activity
  startDateIso: string
  startMinutes: number
  endMinutes: number
  startClientX: number
  startClientY: number
  allActivities: Activity[]
  allowDateChange: boolean
  snapStep?: number
  onDragStart: () => void
  onPreview: (dateIso: string, start: number, end: number, valid: boolean) => void
  onCommit: (dateIso: string, start: number, end: number) => void
  onClick: () => void
  onInvalid?: () => void
}

export function startActivityCalendarMove(options: ActivityMoveOptions): void {
  const step = options.snapStep ?? 15
  const duration = options.endMinutes - options.startMinutes
  const minStart = TIMELINE_START_HOUR * 60
  const maxEnd = TIMELINE_END_HOUR * 60

  const startGrid = getDayGridAtPoint(options.startClientX, options.startClientY)
  const pointerMinAtStart = startGrid
    ? pointerYToMinutesRaw(options.startClientY, startGrid, null)
    : options.startMinutes
  const offsetMin = pointerMinAtStart - options.startMinutes

  let dragStarted = false

  const computeRange = (clientX: number, clientY: number) => {
    const grid = getDayGridAtPoint(clientX, clientY)
    let dateIso = dateIsoFromDayGrid(grid) ?? options.startDateIso
    if (!options.allowDateChange) {
      dateIso = options.startDateIso
    }

    const pointer = grid
      ? pointerYToMinutesRaw(clientY, grid, null)
      : clampTimelineMinutes(snapTimelineMinutes(pointerMinAtStart - offsetMin, step))

    let start = snapTimelineMinutes(pointer - offsetMin, step)
    let end = start + duration
    if (end > maxEnd) {
      end = maxEnd
      start = end - duration
    }
    if (start < minStart) {
      start = minStart
      end = start + duration
    }

    const valid = isValidActivityMove(
      options.activity,
      options.allActivities,
      dateIso,
      start,
      end,
    )

    return { dateIso, start, end, valid }
  }

  const autoScroll = (clientX: number, clientY: number) => {
    const scrollEl = options.scrollEl
    const rect = scrollEl.getBoundingClientRect()
    if (clientY < rect.top + 48) scrollEl.scrollTop -= 12
    else if (clientY > rect.bottom - 48) scrollEl.scrollTop += 12
    if (clientX < rect.left + 48) scrollEl.scrollLeft -= 12
    else if (clientX > rect.right - 48) scrollEl.scrollLeft += 12
  }

  const onMouseMove = (e: MouseEvent) => {
    const dy = Math.abs(e.clientY - options.startClientY)
    const dx = Math.abs(e.clientX - options.startClientX)
    if (!dragStarted && dy < DRAG_THRESHOLD_PX && dx < DRAG_THRESHOLD_PX) return

    if (!dragStarted) {
      dragStarted = true
      document.body.classList.add('appointment-is-dragging')
      options.onDragStart()
    }

    e.preventDefault()
    autoScroll(e.clientX, e.clientY)
    const range = computeRange(e.clientX, e.clientY)
    options.onPreview(range.dateIso, range.start, range.end, range.valid)
  }

  const cleanup = () => {
    document.body.classList.remove('appointment-is-dragging')
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  const onMouseUp = (e: MouseEvent) => {
    cleanup()
    if (!dragStarted) {
      options.onClick()
      return
    }
    const range = computeRange(e.clientX, e.clientY)
    if (!range.valid) {
      options.onInvalid?.()
      return
    }
    options.onCommit(range.dateIso, range.start, range.end)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

export function minutesFromActivityGridClick(clientY: number, gridEl: HTMLElement): number {
  return snapTimelineMinutes(pointerYToMinutesRaw(clientY, gridEl, null))
}

export function defaultCreateSlotEnd(startMin: number, durationMin = 60): number {
  return Math.min(TIMELINE_END_HOUR * 60, startMin + durationMin)
}

export { timeStringToMinutes }

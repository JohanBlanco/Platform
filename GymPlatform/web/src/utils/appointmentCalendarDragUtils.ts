import type { AppointmentRequest, StaffAvailability } from '../types'
import { parseDate, toIsoDate } from './calendarUtils'
import {
  canCreateOutsideAvailabilitySlot,
  findAvailabilityBlockContaining,
  parseTimeToMinutes,
} from './availabilityUtils'
import { isRangeValidForMove } from './availabilitySlotDragUtils'
import {
  clampTimelineMinutes,
  pointerYToMinutesRaw,
  snapTimelineMinutes,
  timeStringToMinutes,
} from './timelineResizeUtils'
import { TIMELINE_END_HOUR, TIMELINE_START_HOUR } from './appointmentCalendarUtils'

const DRAG_THRESHOLD_PX = 4

export function getDayGridAtPoint(clientX: number, clientY: number): HTMLElement | null {
  const target = document.elementFromPoint(clientX, clientY)
  return target?.closest('.appointment-gcal-day-grid') as HTMLElement | null
}

export function dateIsoFromDayGrid(grid: HTMLElement | null): string | null {
  return grid?.dataset.dateIso ?? null
}

export function minutesFromDayGrid(clientY: number, grid: HTMLElement): number {
  return pointerYToMinutesRaw(clientY, grid, null)
}

export function isValidAppointmentMove(
  appointmentId: number,
  dateIso: string,
  startMin: number,
  endMin: number,
  appointments: AppointmentRequest[],
  availabilityBlocks: StaffAvailability[],
): boolean {
  if (endMin <= startMin) return false

  const block = findAvailabilityBlockContaining(dateIso, startMin, endMin, availabilityBlocks)
  if (block) {
    return isRangeValidForMove(appointments, block, appointmentId, startMin, endMin)
  }

  const dayAppointments = appointments.filter((a) => {
    if (a.id === appointmentId) return false
    const apptDate = a.scheduledStart?.slice(0, 10)
    return apptDate === dateIso
  })

  return canCreateOutsideAvailabilitySlot(
    dateIso,
    startMin,
    endMin,
    availabilityBlocks,
    dayAppointments,
  )
}

type CalendarMoveOptions = {
  scrollEl: HTMLElement
  appointmentId: number
  startDateIso: string
  startMinutes: number
  endMinutes: number
  startClientX: number
  startClientY: number
  appointments: AppointmentRequest[]
  availabilityBlocks: StaffAvailability[]
  snapStep?: number
  onDragStart: () => void
  onPreview: (dateIso: string, start: number, end: number, valid: boolean) => void
  onCommit: (dateIso: string, start: number, end: number) => void
  onClick: () => void
  onInvalid?: () => void
}

export function startCalendarAppointmentMove(options: CalendarMoveOptions): void {
  const step = options.snapStep ?? 15
  const duration = options.endMinutes - options.startMinutes
  const minStart = TIMELINE_START_HOUR * 60
  const maxEnd = TIMELINE_END_HOUR * 60

  const startGrid = getDayGridAtPoint(options.startClientX, options.startClientY)
  const pointerMinAtStart = startGrid
    ? minutesFromDayGrid(options.startClientY, startGrid)
    : options.startMinutes
  const offsetMin = pointerMinAtStart - options.startMinutes

  let dragStarted = false

  const computeRange = (clientX: number, clientY: number) => {
    const grid = getDayGridAtPoint(clientX, clientY)
    const dateIso = dateIsoFromDayGrid(grid) ?? options.startDateIso
    const pointer = grid
      ? minutesFromDayGrid(clientY, grid)
      : clampTimelineMinutes(snapTimelineMinutes(clientY, step))

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

    const valid = isValidAppointmentMove(
      options.appointmentId,
      dateIso,
      start,
      end,
      options.appointments,
      options.availabilityBlocks,
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

export function dateIsoFromAppointment(appointment: AppointmentRequest): string {
  return appointment.scheduledStart?.slice(0, 10) ?? toIsoDate(new Date())
}

export function appointmentStartMinutes(appointment: AppointmentRequest): number {
  if (!appointment.scheduledStart) return TIMELINE_START_HOUR * 60
  return timeStringToMinutes(appointment.scheduledStart.slice(11, 16))
}

export function appointmentEndMinutes(appointment: AppointmentRequest): number {
  if (!appointment.scheduledEnd) return appointmentStartMinutes(appointment) + 30
  return timeStringToMinutes(appointment.scheduledEnd.slice(11, 16))
}

export function dateFromIso(dateIso: string): Date {
  return parseDate(dateIso)
}

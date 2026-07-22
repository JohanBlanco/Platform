import type { AppointmentRequest, StaffAvailability } from '../types'
import { isoDateFromAppointment, localMinutesFromIso } from './appointmentCalendarUtils'
import {
  RESIZE_MIN_DURATION,
  minutesToTimeString,
  timeStringToMinutes,
} from './timelineResizeUtils'

const DRAG_THRESHOLD_PX = 4

export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && aEnd > bStart
}

export function blockMinuteBounds(block: StaffAvailability): { start: number; end: number; step: number } {
  return {
    start: timeStringToMinutes(block.startTime.slice(0, 5)),
    end: timeStringToMinutes(block.endTime.slice(0, 5)),
    step: block.slotDurationMinutes ?? 15,
  }
}

export function snapMinutesToBlockGrid(minutes: number, blockStart: number, step: number): number {
  const offset = minutes - blockStart
  return blockStart + Math.round(offset / step) * step
}

export function pointerYToBlockMinutes(
  clientY: number,
  blockEl: HTMLElement,
  blockStartMin: number,
  blockEndMin: number,
  step: number,
): number {
  const rect = blockEl.getBoundingClientRect()
  if (rect.height <= 0) return blockStartMin
  const ratio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
  const raw = blockStartMin + ratio * (blockEndMin - blockStartMin)
  const snapped = snapMinutesToBlockGrid(raw, blockStartMin, step)
  return Math.min(blockEndMin, Math.max(blockStartMin, snapped))
}

export function clampRangeToBlock(
  start: number,
  end: number,
  blockStart: number,
  blockEnd: number,
  minDuration: number = RESIZE_MIN_DURATION,
): { start: number; end: number } {
  const duration = Math.max(minDuration, end - start)
  let nextStart = start
  let nextEnd = end
  if (nextStart < blockStart) {
    nextStart = blockStart
    nextEnd = nextStart + duration
  }
  if (nextEnd > blockEnd) {
    nextEnd = blockEnd
    nextStart = nextEnd - duration
  }
  return { start: nextStart, end: nextEnd }
}

export function appointmentFitsAvailabilityBlock(
  appointment: AppointmentRequest,
  block: StaffAvailability,
): boolean {
  if (!appointment.scheduledStart || !appointment.scheduledEnd) return false
  const date = isoDateFromAppointment(appointment)
  if (date !== block.availabilityDate) return false
  const aStart = localMinutesFromIso(appointment.scheduledStart)
  const aEnd = localMinutesFromIso(appointment.scheduledEnd)
  const { start: blockStart, end: blockEnd } = blockMinuteBounds(block)
  return aStart >= blockStart && aEnd <= blockEnd
}

export function appointmentBelongsToBlock(
  appointment: AppointmentRequest,
  block: StaffAvailability,
): boolean {
  if (!appointmentFitsAvailabilityBlock(appointment, block)) return false
  if (appointment.staffAvailabilityId === block.id) return true
  return appointment.status === 'PENDING' || appointment.status === 'SCHEDULED'
}

export function hasReservedOverlap(
  appointments: AppointmentRequest[],
  block: StaffAvailability,
  start: number,
  end: number,
): boolean {
  return appointments.some((a) => {
    if (!appointmentBelongsToBlock(a, block)) return false
    if (a.status !== 'PENDING' && a.status !== 'SCHEDULED') return false
    if (!a.scheduledStart || !a.scheduledEnd) return false
    const aStart = localMinutesFromIso(a.scheduledStart)
    const aEnd = localMinutesFromIso(a.scheduledEnd)
    return rangesOverlap(start, end, aStart, aEnd)
  })
}

export function isRangeValidForMove(
  appointments: AppointmentRequest[],
  block: StaffAvailability,
  movingAppointmentId: number,
  start: number,
  end: number,
): boolean {
  const { start: blockStart, end: blockEnd } = blockMinuteBounds(block)
  if (start < blockStart || end > blockEnd || end <= start) return false
  if (!isDurationValidForBlock(block, start, end)) return false
  const others = appointments.filter((a) => a.id !== movingAppointmentId)
  return !hasReservedOverlap(others, block, start, end)
}

export function isDurationValidForBlock(
  block: StaffAvailability,
  start: number,
  end: number,
): boolean {
  const step = block.slotDurationMinutes
  if (!step || step <= 0) return end > start
  const { start: blockStart } = blockMinuteBounds(block)
  const offset = start - blockStart
  const duration = end - start
  return offset >= 0
    && offset % step === 0
    && duration >= step
    && duration % step === 0
}

export function findBlockForAppointment(
  appointment: AppointmentRequest,
  blocks: StaffAvailability[],
): StaffAvailability | undefined {
  if (appointment.staffAvailabilityId != null) {
    const linked = blocks.find((b) => b.id === appointment.staffAvailabilityId)
    if (linked) return linked
  }
  return blocks.find((b) => appointmentFitsAvailabilityBlock(appointment, b))
}

export function isRangeValidInBlock(
  appointments: AppointmentRequest[],
  block: StaffAvailability,
  excludeId: number,
  start: number,
  end: number,
): boolean {
  return isRangeValidForMove(appointments, block, excludeId, start, end)
}

type MoveSessionOptions = {
  block: StaffAvailability
  blockZoneEl: HTMLElement
  scrollEl?: HTMLElement | null
  startMinutes: number
  endMinutes: number
  startClientY: number
  startClientX: number
  onDragStart: () => void
  onPreview: (start: number, end: number) => void
  onCommit: (start: number, end: number) => void
  onClick: () => void
}

export function startBlockAppointmentMove(options: MoveSessionOptions): void {
  const { block, blockZoneEl } = options
  const { start: blockStart, end: blockEnd, step } = blockMinuteBounds(block)
  const duration = options.endMinutes - options.startMinutes

  const pointerMinAtStart = pointerYToBlockMinutes(
    options.startClientY,
    blockZoneEl,
    blockStart,
    blockEnd,
    step,
  )
  const offsetMin = pointerMinAtStart - options.startMinutes

  let dragging = false
  let dragStarted = false

  const computeRange = (clientY: number) => {
    const pointer = pointerYToBlockMinutes(clientY, blockZoneEl, blockStart, blockEnd, step)
    const start = snapMinutesToBlockGrid(pointer - offsetMin, blockStart, step)
    const end = start + duration
    return clampRangeToBlock(start, end, blockStart, blockEnd, duration)
  }

  const autoScroll = (clientY: number) => {
    const scrollEl = options.scrollEl
    if (!scrollEl) return
    const rect = scrollEl.getBoundingClientRect()
    if (clientY < rect.top + 48) scrollEl.scrollTop -= 12
    else if (clientY > rect.bottom - 48) scrollEl.scrollTop += 12
  }

  const onMouseMove = (e: MouseEvent) => {
    const dy = Math.abs(e.clientY - options.startClientY)
    const dx = Math.abs(e.clientX - options.startClientX)
    if (!dragging && dy < DRAG_THRESHOLD_PX && dx < DRAG_THRESHOLD_PX) return

    if (!dragging) {
      dragging = true
      dragStarted = true
      document.body.classList.add('appointment-is-dragging')
      options.onDragStart()
    }

    e.preventDefault()
    autoScroll(e.clientY)
    const range = computeRange(e.clientY)
    options.onPreview(range.start, range.end)
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
    const range = computeRange(e.clientY)
    options.onCommit(range.start, range.end)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

export function minutesRangeToIso(
  date: string,
  start: number,
  end: number,
  combine: (date: string, time: string) => string,
): { scheduledStart: string; scheduledEnd: string } {
  return {
    scheduledStart: combine(date, minutesToTimeString(start)),
    scheduledEnd: combine(date, minutesToTimeString(end)),
  }
}

import type { AppointmentRequest, StaffAvailability } from '../types'
import { localMinutesFromIso } from './appointmentCalendarUtils'
import { appointmentFitsAvailabilityBlock } from './availabilitySlotDragUtils'
import { addDays, parseDate, toIsoDate } from './calendarUtils'
import { formatTime } from './dateFormat'

export function parseTimeToMinutes(time: string): number {
  const parts = time.split(':')
  const h = Number(parts[0]) || 0
  const m = Number(parts[1]) || 0
  return h * 60 + m
}

export function minutesToTimeLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60) % 24
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function formatTimeShort(time: string): string {
  return formatTime(time.slice(0, 5), 'es')
}

export function countAvailabilitySlots(startTime: string, endTime: string, durationMinutes: number): number {
  if (!durationMinutes || durationMinutes <= 0) return 0
  const start = parseTimeToMinutes(startTime)
  const end = parseTimeToMinutes(endTime)
  if (end <= start) return 0
  return Math.floor((end - start) / durationMinutes)
}

export function buildAvailabilitySlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
): { start: string; end: string }[] {
  const count = countAvailabilitySlots(startTime, endTime, durationMinutes)
  const start = parseTimeToMinutes(startTime)
  const slots: { start: string; end: string }[] = []
  for (let i = 0; i < count; i++) {
    const slotStart = start + i * durationMinutes
    const slotEnd = slotStart + durationMinutes
    slots.push({
      start: minutesToTimeLabel(slotStart),
      end: minutesToTimeLabel(slotEnd),
    })
  }
  return slots
}

export function previewAvailabilitySlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  maxVisible = 6,
): { visible: { start: string; end: string }[]; remaining: number } {
  const all = buildAvailabilitySlots(startTime, endTime, durationMinutes)
  return {
    visible: all.slice(0, maxVisible),
    remaining: Math.max(0, all.length - maxVisible),
  }
}

export function countDaysInRange(startDate: string, endDate?: string): number {
  if (!startDate) return 0
  if (!endDate || endDate < startDate) return 1
  const start = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate}T12:00:00`)
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000)
  return diff + 1
}

export function isDateRangeValid(startDate: string, endDate?: string): boolean {
  if (!startDate) return false
  if (!endDate) return true
  return endDate >= startDate
}

function normalizeTime(time: string): string {
  return time.slice(0, 5)
}

export function availabilityBlocksMatch(a: StaffAvailability, b: StaffAvailability): boolean {
  return normalizeTime(a.startTime) === normalizeTime(b.startTime)
    && normalizeTime(a.endTime) === normalizeTime(b.endTime)
    && (a.slotDurationMinutes ?? null) === (b.slotDurationMinutes ?? null)
    && (a.staffId ?? null) === (b.staffId ?? null)
}

/** Bloques consecutivos del mismo horario que incluyen al bloque seleccionado. */
export function findContiguousAvailabilityRange(
  block: StaffAvailability,
  allBlocks: StaffAvailability[],
): StaffAvailability[] {
  const siblings = allBlocks.filter((b) => availabilityBlocksMatch(b, block))
  const dates = new Set(siblings.map((b) => b.availabilityDate))

  let startDate = block.availabilityDate
  let prev = toIsoDate(addDays(parseDate(startDate), -1))
  while (dates.has(prev)) {
    startDate = prev
    prev = toIsoDate(addDays(parseDate(startDate), -1))
  }

  let endDate = block.availabilityDate
  let next = toIsoDate(addDays(parseDate(endDate), 1))
  while (dates.has(next)) {
    endDate = next
    next = toIsoDate(addDays(parseDate(endDate), 1))
  }

  return siblings
    .filter((b) => b.availabilityDate >= startDate && b.availabilityDate <= endDate)
    .sort((a, b) => a.availabilityDate.localeCompare(b.availabilityDate))
}

/** True si el rango [startMin, endMin) solapa algún bloque verde de disponibilidad ese día. */
export function timeRangeOverlapsAvailability(
  dateIso: string,
  startMin: number,
  endMin: number,
  blocks: StaffAvailability[],
): boolean {
  return blocks
    .filter((b) => b.availabilityDate === dateIso)
    .some((b) => {
      const blockStart = parseTimeToMinutes(b.startTime.slice(0, 5))
      const blockEnd = parseTimeToMinutes(b.endTime.slice(0, 5))
      return startMin < blockEnd && endMin > blockStart
    })
}

/** True si el rango solapa una cita PENDING/SCHEDULED del mismo día. */
export function timeRangeOverlapsAppointments(
  appointments: AppointmentRequest[],
  startMin: number,
  endMin: number,
): boolean {
  return appointments.some((a) => {
    if (a.status !== 'PENDING' && a.status !== 'SCHEDULED') return false
    if (!a.scheduledStart || !a.scheduledEnd) return false
    const aStart = localMinutesFromIso(a.scheduledStart)
    const aEnd = localMinutesFromIso(a.scheduledEnd)
    return startMin < aEnd && endMin > aStart
  })
}

/** Valida si staff puede crear cita fuera del bloque verde en ese rango. */
export function canCreateOutsideAvailabilitySlot(
  dateIso: string,
  startMin: number,
  endMin: number,
  availabilityBlocks: StaffAvailability[],
  appointments: AppointmentRequest[],
): boolean {
  if (timeRangeOverlapsAvailability(dateIso, startMin, endMin, availabilityBlocks)) return false
  if (timeRangeOverlapsAppointments(appointments, startMin, endMin)) return false
  return true
}

/** True si el rango cae completamente dentro de un bloque de disponibilidad ese día. */
export function findAvailabilityBlockContaining(
  dateIso: string,
  startMin: number,
  endMin: number,
  blocks: StaffAvailability[],
): StaffAvailability | undefined {
  return blocks.find((block) => {
    if (block.availabilityDate !== dateIso) return false
    const blockStart = parseTimeToMinutes(block.startTime.slice(0, 5))
    const blockEnd = parseTimeToMinutes(block.endTime.slice(0, 5))
    return startMin >= blockStart && endMin <= blockEnd
  })
}

function isReservedAppointmentStatus(status: string): boolean {
  return status === 'PENDING' || status === 'SCHEDULED'
}

/** Cita reservada vinculada al bloque o que cae dentro de su ventana horaria. */
export function appointmentReservedInBlocks(
  appointment: AppointmentRequest,
  blocks: StaffAvailability[],
): boolean {
  if (!isReservedAppointmentStatus(appointment.status)) return false
  const blockIds = new Set(blocks.map((b) => b.id))
  if (appointment.staffAvailabilityId != null && blockIds.has(appointment.staffAvailabilityId)) {
    return true
  }
  return blocks.some((block) => appointmentFitsAvailabilityBlock(appointment, block))
}

export function countReservedForBlocks(
  blocks: StaffAvailability[],
  appointments: AppointmentRequest[],
): number {
  const seen = new Set<number>()
  let count = 0
  for (const appointment of appointments) {
    if (!appointmentReservedInBlocks(appointment, blocks) || seen.has(appointment.id)) continue
    seen.add(appointment.id)
    count += 1
  }
  return count
}

export function findReservedForBlocks(
  blocks: StaffAvailability[],
  appointments: AppointmentRequest[],
): AppointmentRequest[] {
  const seen = new Set<number>()
  const result: AppointmentRequest[] = []
  for (const appointment of appointments) {
    if (!appointmentReservedInBlocks(appointment, blocks) || seen.has(appointment.id)) continue
    seen.add(appointment.id)
    result.push(appointment)
  }
  return result
}

/** True si la cita reservada encaja en la cuadrícula del bloque (inicio y duración alineados). */
export function appointmentAlignsWithBlockGrid(
  appointment: AppointmentRequest,
  block: StaffAvailability,
): boolean {
  if (!appointment.scheduledStart || !appointment.scheduledEnd) return false
  const step = block.slotDurationMinutes
  if (!step || step <= 0) return true

  const blockStart = parseTimeToMinutes(block.startTime.slice(0, 5))
  const blockEnd = parseTimeToMinutes(block.endTime.slice(0, 5))
  const aStart = localMinutesFromIso(appointment.scheduledStart)
  const aEnd = localMinutesFromIso(appointment.scheduledEnd)
  const offset = aStart - blockStart
  const duration = aEnd - aStart

  if (aStart < blockStart || aEnd > blockEnd || duration <= 0) return false
  return offset >= 0 && offset % step === 0 && duration >= step && duration % step === 0
}

/** Cuenta citas reservadas que no encajan con la nueva duración de cuadrícula. */
export function countMisalignedReservedForBlocks(
  blocks: StaffAvailability[],
  appointments: AppointmentRequest[],
  slotDurationMinutes: number,
  startTime?: string,
  endTime?: string,
): number {
  return analyzeAvailabilityUpdateImpact(blocks, appointments, {
    startTime: startTime ?? blocks[0]?.startTime.slice(0, 5) ?? '09:00',
    endTime: endTime ?? blocks[0]?.endTime.slice(0, 5) ?? '17:00',
    slotDurationMinutes,
  }).affectedCount
}

export type AvailabilityUpdateImpact = {
  reservedInRange: number
  alignedCount: number
  affectedCount: number
  multiSlotCount: number
  affectedAppointments: AppointmentRequest[]
  multiSlotSummaries: { memberName: string; durationMinutes: number; slotsSpanned: number }[]
}

function countGridSlotsSpanned(
  block: StaffAvailability,
  appointment: AppointmentRequest,
): number {
  const step = block.slotDurationMinutes
  if (!step || step <= 0 || !appointment.scheduledStart || !appointment.scheduledEnd) {
    return 1
  }
  const duration = localMinutesFromIso(appointment.scheduledEnd) - localMinutesFromIso(appointment.scheduledStart)
  return Math.max(1, Math.round(duration / step))
}

function isOutsideAvailabilityWindow(
  appointment: AppointmentRequest,
  blockStartMin: number,
  blockEndMin: number,
): boolean {
  if (!appointment.scheduledStart || !appointment.scheduledEnd) return true
  const aStart = localMinutesFromIso(appointment.scheduledStart)
  const aEnd = localMinutesFromIso(appointment.scheduledEnd)
  return aStart < blockStartMin || aEnd > blockEndMin
}

/** Analiza citas reservadas vs horario/cuadrícula nueva antes de guardar disponibilidad. */
export function analyzeAvailabilityUpdateImpact(
  blocks: StaffAvailability[],
  appointments: AppointmentRequest[],
  schedule: { startTime: string; endTime: string; slotDurationMinutes: number },
): AvailabilityUpdateImpact {
  if (blocks.length === 0) {
    return {
      reservedInRange: 0,
      alignedCount: 0,
      affectedCount: 0,
      multiSlotCount: 0,
      affectedAppointments: [],
      multiSlotSummaries: [],
    }
  }

  const blockById = new Map(blocks.map((b) => [b.id, b]))
  const blockStartMin = parseTimeToMinutes(schedule.startTime.slice(0, 5))
  const blockEndMin = parseTimeToMinutes(schedule.endTime.slice(0, 5))

  const seen = new Set<number>()
  const affectedAppointments: AppointmentRequest[] = []
  const multiSlotSummaries: AvailabilityUpdateImpact['multiSlotSummaries'] = []
  let reservedInRange = 0
  let alignedCount = 0

  for (const appointment of appointments) {
    if (!appointmentReservedInBlocks(appointment, blocks) || seen.has(appointment.id)) continue

    const linkedBlock = appointment.staffAvailabilityId != null
      ? blockById.get(appointment.staffAvailabilityId)
      : undefined
    const block = linkedBlock ?? blocks.find((b) => appointmentFitsAvailabilityBlock(appointment, b))
    if (!block) continue

    seen.add(appointment.id)
    reservedInRange += 1

    const hypotheticalBlock: StaffAvailability = {
      ...block,
      startTime: schedule.startTime.length === 5 ? `${schedule.startTime}:00` : schedule.startTime,
      endTime: schedule.endTime.length === 5 ? `${schedule.endTime}:00` : schedule.endTime,
      slotDurationMinutes: schedule.slotDurationMinutes,
    }

    const outside = isOutsideAvailabilityWindow(appointment, blockStartMin, blockEndMin)
    const misaligned = !outside && !appointmentAlignsWithBlockGrid(appointment, hypotheticalBlock)

    if (outside || misaligned) {
      affectedAppointments.push(appointment)
      continue
    }

    alignedCount += 1
    const slotsSpanned = countGridSlotsSpanned(hypotheticalBlock, appointment)
    if (slotsSpanned > 1) {
      multiSlotSummaries.push({
        memberName: `${appointment.memberName ?? 'Miembro'}`.trim(),
        durationMinutes: localMinutesFromIso(appointment.scheduledEnd!) - localMinutesFromIso(appointment.scheduledStart!),
        slotsSpanned,
      })
    }
  }

  return {
    reservedInRange,
    alignedCount,
    affectedCount: affectedAppointments.length,
    multiSlotCount: multiSlotSummaries.length,
    affectedAppointments,
    multiSlotSummaries,
  }
}


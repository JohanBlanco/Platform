import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from 'react'
import type { AppointmentRequest, StaffAvailability } from '../types'
import CalendarCurrentTimeLine from './CalendarCurrentTimeLine'
import { useLiveNow } from '../hooks/useLiveNow'
import {
  appointmentTypeLabel,
} from '../utils/appointmentUtils'
import {
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
  appointmentTimelineStyle,
  appointmentsForDay,
  availabilityForDay,
  availabilityTimelineStyle,
  combineDateAndTime,
  formatTimeRange,
  isoDateFromAppointment,
  localMinutesFromIso,
  localTimeFromIso,
  parseDateTime,
  slotStyleWithinBlock,
} from '../utils/appointmentCalendarUtils'
import {
  appointmentStartMinutes,
  appointmentEndMinutes,
  dateIsoFromAppointment,
  startCalendarAppointmentMove,
} from '../utils/appointmentCalendarDragUtils'
import { formatTimeShort, buildAvailabilitySlots, parseTimeToMinutes, canCreateOutsideAvailabilitySlot, appointmentAlignsWithBlockGrid } from '../utils/availabilityUtils'
import { formatTimeRangeLabel } from '../utils/dateFormat'
import { appointmentFitsAvailabilityBlock } from '../utils/availabilitySlotDragUtils'
import {
  getTimelineGridElements,
  pointerYToMinutesRaw,
  scheduleScrollTimelineToNow,
  snapTimelineMinutes,
  startTimelineResizeSession,
  timeStringToMinutes,
  timelineStyleFromMinutes,
  minutesToTimeString,
} from '../utils/timelineResizeUtils'
import { WEEKDAY_LABELS, isSameDay, toIsoDate } from '../utils/calendarUtils'

export type TimelineViewMode = 'day' | 'week'

type Props = {
  appointments: AppointmentRequest[]
  availabilityBlocks?: StaffAvailability[]
  view: TimelineViewMode
  anchor: Date
  onSelect?: (appointment: AppointmentRequest) => void
  onSelectAvailability?: (block: StaffAvailability) => void
  onCreateSlot?: (date: Date, hour: number) => void
  onCreateOutsideSlot?: (date: Date, startTime: string, endTime: string) => void
  onCreateInAvailabilitySlot?: (dateIso: string, startTime: string, endTime: string) => void
  onAvailabilitySlotClick?: (params: {
    availabilityId: number
    dateIso: string
    startTime: string
    endTime: string
    openAppointment?: AppointmentRequest | null
  }) => void
  onBlockedSlotClick?: (params: {
    availabilityId: number
    dateIso: string
    startTime: string
    endTime: string
    blockedAppointment: AppointmentRequest
  }) => void
  onOutsideCreateBlocked?: () => void
  onResizeAvailability?: (block: StaffAvailability, startTime: string, endTime: string) => void
  onResizeAppointment?: (
    appointment: AppointmentRequest,
    scheduledStart: string,
    scheduledEnd: string,
  ) => void
  onScheduleConflict?: () => void
  interactive?: boolean
  staffCalendar?: boolean
  /** Solo lectura: muestra disponibilidad y citas; clic en cita abre detalle, verde inactivo. */
  viewOnly?: boolean
  compact?: boolean
  scrollToNow?: boolean
  /** Cambia cuando el contenido termina de cargar para re-centrar la hora actual. */
  scrollToNowKey?: number | string
}

function appointmentKey(a: AppointmentRequest): string {
  return `${a.id}-${a.scheduledStart ?? a.createdAt}`
}

function formatHourLabel(hour: number): string {
  const date = new Date(2000, 0, 1, hour, 0)
  return date.toLocaleTimeString('es-CR', { hour: 'numeric', hour12: true })
}

function compareAppointments(a: AppointmentRequest, b: AppointmentRequest): number {
  const sa = parseDateTime(a.scheduledStart)?.getTime() ?? 0
  const sb = parseDateTime(b.scheduledStart)?.getTime() ?? 0
  return sa - sb
}

function computeOutsideCreateSlot(clientY: number, gridEl: HTMLElement): { start: number; end: number } {
  const startMin = snapTimelineMinutes(
    pointerYToMinutesRaw(clientY, gridEl, null),
  )
  const maxMin = TIMELINE_END_HOUR * 60
  const minStart = TIMELINE_START_HOUR * 60
  let endMin = Math.min(startMin + 30, maxMin)
  const effectiveStart = Math.max(minStart, endMin - 30)
  endMin = effectiveStart + 30
  return { start: effectiveStart, end: endMin }
}

function isOutsideCreateTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  if (el.closest('.appointment-availability-zone')) return false
  if (el.closest('.appointment-block-wrap')) return false
  return true
}

function isReservedAppointment(status: string): boolean {
  return status === 'PENDING' || status === 'SCHEDULED'
}

function isBlockSlotAppointment(status: string): boolean {
  return status === 'OPEN' || status === 'BLOCKED' || isReservedAppointment(status)
}

type BlockSlot = {
  appointment: AppointmentRequest | null
  start: string
  end: string
  interior?: boolean
}

function getBlockLinkedAppointments(
  block: StaffAvailability,
  appointments: AppointmentRequest[],
  excludeAppointmentId?: number,
): AppointmentRequest[] {
  return appointments
    .filter((a) => {
      if (excludeAppointmentId != null && a.id === excludeAppointmentId) return false
      if (!isBlockSlotAppointment(a.status)) return false
      if (a.staffAvailabilityId === block.id) return true
      if (a.status === 'BLOCKED' && appointmentFitsAvailabilityBlock(a, block)) return true
      if (isReservedAppointment(a.status)) return appointmentFitsAvailabilityBlock(a, block)
      return false
    })
    .sort(compareAppointments)
}

function getBlockReservedAppointments(
  block: StaffAvailability,
  appointments: AppointmentRequest[],
  excludeAppointmentId?: number,
): AppointmentRequest[] {
  return getBlockLinkedAppointments(block, appointments, excludeAppointmentId)
    .filter((a) => isReservedAppointment(a.status))
}

function buildBlockSlots(
  block: StaffAvailability,
  appointments: AppointmentRequest[],
  excludeAppointmentId?: number,
): BlockSlot[] {
  const blockAppointments = getBlockLinkedAppointments(block, appointments, excludeAppointmentId)
  const reservedAppointments = blockAppointments.filter((a) => isReservedAppointment(a.status))

  if (!block.slotDurationMinutes || block.slotDurationMinutes <= 0) {
    const nonReserved = blockAppointments.filter((a) => !isReservedAppointment(a.status))
    if (nonReserved.length > 0) {
      return nonReserved.map((appointment) => ({
        appointment,
        start: localTimeFromIso(appointment.scheduledStart),
        end: localTimeFromIso(appointment.scheduledEnd),
      }))
    }
    return []
  }

  const startTime = block.startTime.slice(0, 5)
  const endTime = block.endTime.slice(0, 5)
  const gridSlots = buildAvailabilitySlots(startTime, endTime, block.slotDurationMinutes)
  const slots: BlockSlot[] = []

  for (const slot of gridSlots) {
    const slotStartMin = parseTimeToMinutes(slot.start)
    const slotEndMin = parseTimeToMinutes(slot.end)

    const openMatch = blockAppointments.find(
      (a) => a.status === 'OPEN'
        && localTimeFromIso(a.scheduledStart) === slot.start
        && localTimeFromIso(a.scheduledEnd) === slot.end,
    )

    const blockedMatch = blockAppointments.find(
      (a) => a.status === 'BLOCKED'
        && localTimeFromIso(a.scheduledStart) === slot.start
        && localTimeFromIso(a.scheduledEnd) === slot.end,
    )

    const coveredByReserved = reservedAppointments.some((a) => {
      const aStart = localMinutesFromIso(a.scheduledStart)
      const aEnd = localMinutesFromIso(a.scheduledEnd)
      return aStart < slotEndMin && aEnd > slotStartMin
    })

    if (coveredByReserved && !openMatch && !blockedMatch) {
      slots.push({
        appointment: null,
        start: slot.start,
        end: slot.end,
        interior: true,
      })
      continue
    }

    const appointment = openMatch ?? blockedMatch ?? null
    slots.push({
      appointment,
      start: slot.start,
      end: slot.end,
    })
  }

  return slots
}

function ResizeHandle({
  edge,
  onPointerDown,
}: {
  edge: 'top' | 'bottom'
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      className={`appointment-resize-handle appointment-resize-handle--${edge}`}
      onPointerDown={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onPointerDown(e)
      }}
      aria-hidden
    />
  )
}

function ReservationPill({
  appointment,
  invalid,
  preview,
}: {
  appointment: AppointmentRequest
  invalid?: boolean
  preview?: boolean
}) {
  const memberName = appointment.memberName?.trim() || 'Sin miembro'
  const typeLabel = appointmentTypeLabel(appointment.type)
  const label = `${memberName} - ${typeLabel}`
  const time = formatTimeRange(appointment.scheduledStart, appointment.scheduledEnd)

  return (
    <div
      className={`appointment-reservation-pill${invalid ? ' appointment-reservation-pill--invalid' : ''}${preview ? ' appointment-reservation-pill--preview' : ''}`}
      title={`${label} · ${time}`}
    >
      <span className="appointment-reservation-pill-text">{label}</span>
    </div>
  )
}

function AppointmentBlock({
  appointment,
  onSelect,
  onResize,
  onBeginDrag,
  draggingHidden,
  resizable,
  movable,
  compactWeek,
}: {
  appointment: AppointmentRequest
  onSelect?: (appointment: AppointmentRequest) => void
  onResize?: (appointment: AppointmentRequest, startTime: string, endTime: string) => void
  onBeginDrag?: (appointment: AppointmentRequest, e: MouseEvent<HTMLElement>) => void
  draggingHidden?: boolean
  resizable?: boolean
  movable?: boolean
  compactWeek?: boolean
}) {
  const [dragPreview, setDragPreview] = useState<{ start: number; end: number } | null>(null)

  const style = appointmentTimelineStyle(appointment.scheduledStart, appointment.scheduledEnd)

  const displayStart = localTimeFromIso(appointment.scheduledStart)
  const displayEnd = localTimeFromIso(appointment.scheduledEnd)

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!movable || !appointment.scheduledStart || !appointment.scheduledEnd) return
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('.appointment-resize-handle')) return
    e.preventDefault()
    e.stopPropagation()
    if (onBeginDrag) {
      onBeginDrag(appointment, e)
      return
    }
  }

  const handleResizeStart = (edge: 'top' | 'bottom') => (e: PointerEvent<HTMLDivElement>) => {
    if (!onResize || !appointment.scheduledStart || !appointment.scheduledEnd) return
    const startMinutes = localMinutesFromIso(appointment.scheduledStart)
    const endMinutes = localMinutesFromIso(appointment.scheduledEnd)
    const { gridEl, scrollEl } = getTimelineGridElements(e.currentTarget)
    startTimelineResizeSession({
      edge,
      startMinutes,
      endMinutes,
      gridEl,
      scrollEl,
      onPreview: (start, end) => setDragPreview({ start, end }),
      onCommit: (start, end) => {
        setDragPreview(null)
        onResize(appointment, minutesToTimeString(start), minutesToTimeString(end))
      },
    })
  }

  return (
    <div
      className={`appointment-block-wrap${resizable ? ' appointment-block-wrap--resizable' : ''}${movable ? ' appointment-block-wrap--movable' : ''}${dragPreview ? ' appointment-block-wrap--dragging' : ''}${draggingHidden ? ' appointment-block-wrap--source-hidden' : ''}`}
      style={style}
      onMouseDown={movable ? handleMouseDown : undefined}
    >
      {resizable && <ResizeHandle edge="top" onPointerDown={handleResizeStart('top')} />}
      <div
        className="appointment-block"
        role={onSelect ? 'button' : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={onSelect && !movable ? (e) => {
          e.stopPropagation()
          onSelect(appointment)
        } : undefined}
        onKeyDown={onSelect ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect(appointment)
          }
        } : undefined}
        title={appointmentTypeLabel(appointment.type)}
      >
        <span className="appointment-block-title">
          {appointment.memberName
            ? `${appointment.memberName} - ${appointmentTypeLabel(appointment.type)}`
            : appointmentTypeLabel(appointment.type)}
        </span>
        <span className="appointment-block-time">
          {displayStart && displayEnd
            ? formatTimeRangeLabel(displayStart, displayEnd)
            : formatTimeRange(appointment.scheduledStart, appointment.scheduledEnd)}
        </span>
        {!compactWeek && appointment.preferredStaffName && (
          <span className="appointment-block-meta">{appointment.preferredStaffName}</span>
        )}
      </div>
      {resizable && <ResizeHandle edge="bottom" onPointerDown={handleResizeStart('bottom')} />}
    </div>
  )
}

function AvailabilityZone({
  block,
  appointments,
  onSelectAvailability,
  onSelectAppointment,
  onCreateInAvailabilitySlot,
  onAvailabilitySlotClick,
  onBlockedSlotClick,
  onClearOutsidePreview,
  onResizeAvailability,
  onBeginAppointmentDrag,
  draggingAppointmentId,
  staffCalendar,
  viewOnly = false,
}: {
  block: StaffAvailability
  appointments: AppointmentRequest[]
  onSelectAvailability?: (block: StaffAvailability) => void
  onSelectAppointment?: (appointment: AppointmentRequest) => void
  onCreateInAvailabilitySlot?: (dateIso: string, startTime: string, endTime: string) => void
  onAvailabilitySlotClick?: (params: {
    availabilityId: number
    dateIso: string
    startTime: string
    endTime: string
    openAppointment?: AppointmentRequest | null
  }) => void
  onBlockedSlotClick?: (params: {
    availabilityId: number
    dateIso: string
    startTime: string
    endTime: string
    blockedAppointment: AppointmentRequest
  }) => void
  onClearOutsidePreview?: () => void
  onResizeAvailability?: (block: StaffAvailability, startTime: string, endTime: string) => void
  onBeginAppointmentDrag?: (appointment: AppointmentRequest, e: MouseEvent<HTMLElement>) => void
  draggingAppointmentId?: number | null
  staffCalendar?: boolean
  viewOnly?: boolean
}) {
  const zoneRef = useRef<HTMLDivElement>(null)
  const [previewRange, setPreviewRange] = useState<{ start: string; end: string } | null>(null)
  const startTime = previewRange?.start ?? block.startTime.slice(0, 5)
  const endTime = previewRange?.end ?? block.endTime.slice(0, 5)
  const style = availabilityTimelineStyle(block.availabilityDate, startTime, endTime)
  const slots = buildBlockSlots(block, appointments, draggingAppointmentId ?? undefined)
  const reservedOverlays = getBlockReservedAppointments(block, appointments, draggingAppointmentId ?? undefined)
  const readOnly = viewOnly
  const resizable = staffCalendar && !!onResizeAvailability && !readOnly
  const appointmentEditable = staffCalendar && !!onBeginAppointmentDrag && !readOnly

  const handleReservedMouseDown = (
    appointment: AppointmentRequest,
    e: MouseEvent<HTMLElement>,
  ) => {
    if (!appointmentEditable) return
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    onBeginAppointmentDrag?.(appointment, e)
  }

  const handleSlotsMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!appointmentEditable) return
    const slotEl = (e.target as HTMLElement).closest('[data-appointment-id]')
    if (!slotEl) return
    const id = Number(slotEl.getAttribute('data-appointment-id'))
    const appt = appointments.find((a) => a.id === id)
    if (appt) handleReservedMouseDown(appt, e)
  }

  const handleZoneResizeStart = (edge: 'top' | 'bottom') => (e: PointerEvent<HTMLDivElement>) => {
    if (!onResizeAvailability) return
    const startMinutes = timeStringToMinutes(startTime)
    const endMinutes = timeStringToMinutes(endTime)
    const { gridEl, scrollEl } = getTimelineGridElements(e.currentTarget)
    startTimelineResizeSession({
      edge,
      startMinutes,
      endMinutes,
      gridEl,
      scrollEl,
      onPreview: (start, end) => {
        setPreviewRange({
          start: minutesToTimeString(start),
          end: minutesToTimeString(end),
        })
      },
      onCommit: (start, end) => {
        setPreviewRange(null)
        onResizeAvailability(block, minutesToTimeString(start), minutesToTimeString(end))
      },
    })
  }

  return (
    <div
      ref={zoneRef}
      className={`appointment-availability-zone${staffCalendar ? ' appointment-availability-zone--staff' : ''}${readOnly ? ' appointment-availability-zone--readonly' : ''}${previewRange ? ' appointment-availability-zone--dragging' : ''}`}
      style={style}
      onMouseEnter={onClearOutsidePreview}
    >
      {onSelectAvailability && staffCalendar && !readOnly && (
        <button
          type="button"
          className="appointment-availability-zone-edit"
          onClick={(e) => {
            e.stopPropagation()
            onSelectAvailability(block)
          }}
          title={`Modificar disponibilidad ${formatTimeShort(startTime)} – ${formatTimeShort(endTime)}`}
          aria-label="Modificar disponibilidad"
        >
          ✎
        </button>
      )}
      {resizable && (
        <ResizeHandle edge="top" onPointerDown={handleZoneResizeStart('top')} />
      )}
      <div className="appointment-availability-slots" onMouseDown={handleSlotsMouseDown}>
        {reservedOverlays.map((appointment) => {
          const dragging = draggingAppointmentId === appointment.id
          const apptStart = localTimeFromIso(appointment.scheduledStart)
          const apptEnd = localTimeFromIso(appointment.scheduledEnd)
          const overlayStyle = slotStyleWithinBlock(
            block.availabilityDate,
            startTime,
            endTime,
            apptStart,
            apptEnd,
          )
          const misaligned = !appointmentAlignsWithBlockGrid(
            appointment,
            { ...block, startTime: `${startTime}:00`, endTime: `${endTime}:00` },
          )

          return (
            <div
              key={appointmentKey(appointment)}
              data-appointment-id={appointment.id}
              className={`appointment-reserved-overlay${appointmentEditable ? ' appointment-reserved-overlay--draggable' : ''}${readOnly && onSelectAppointment ? ' appointment-reserved-overlay--selectable' : ''}${dragging ? ' appointment-reserved-overlay--source-hidden' : ''}${misaligned ? ' appointment-reserved-overlay--misaligned' : ''}`}
              style={overlayStyle}
              onMouseDown={appointmentEditable ? (e) => handleReservedMouseDown(appointment, e) : undefined}
              onClick={readOnly && onSelectAppointment ? (e) => {
                e.stopPropagation()
                onSelectAppointment(appointment)
              } : undefined}
              onKeyDown={readOnly && onSelectAppointment ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectAppointment(appointment)
                }
              } : undefined}
              role={readOnly && onSelectAppointment ? 'button' : undefined}
              tabIndex={readOnly && onSelectAppointment ? 0 : undefined}
            >
              <ReservationPill appointment={appointment} invalid={misaligned} />
            </div>
          )
        })}
        {slots.map((slot) => {
          const key = slot.appointment
            ? appointmentKey(slot.appointment)
            : `${block.id}-${slot.start}-${slot.end}`

          const slotStyle = slotStyleWithinBlock(
            block.availabilityDate,
            startTime,
            endTime,
            slot.start,
            slot.end,
          )

          if (slot.interior) {
            return (
              <div
                key={key}
                className="appointment-availability-slot appointment-availability-slot--interior"
                style={slotStyle}
                aria-hidden
              />
            )
          }

          if (slot.appointment?.status === 'BLOCKED') {
            if (!staffCalendar) {
              return null
            }
            if (onBlockedSlotClick && slot.appointment && !readOnly) {
              return (
                <button
                  key={key}
                  type="button"
                  className="appointment-availability-slot appointment-availability-slot--blocked"
                  style={slotStyle}
                  onClick={(e) => {
                    e.stopPropagation()
                    onBlockedSlotClick({
                      availabilityId: block.id,
                      dateIso: block.availabilityDate,
                      startTime: slot.start,
                      endTime: slot.end,
                      blockedAppointment: slot.appointment!,
                    })
                  }}
                  title={`No disponible · ${slot.start} – ${slot.end}. Clic para reactivar.`}
                  aria-label={`Espacio no disponible ${slot.start} a ${slot.end}. Clic para reactivar.`}
                >
                  <span className="appointment-blocked-slot-label">No disp.</span>
                </button>
              )
            }
            return (
              <div
                key={key}
                className="appointment-availability-slot appointment-availability-slot--blocked"
                style={slotStyle}
                title={`No disponible · ${slot.start} – ${slot.end}`}
                aria-label={`Espacio no disponible ${slot.start} a ${slot.end}`}
              >
                <span className="appointment-blocked-slot-label">No disp.</span>
              </div>
            )
          }

          if (readOnly && (slot.appointment?.status === 'OPEN' || !slot.appointment)) {
            return (
              <div
                key={key}
                className="appointment-availability-slot appointment-availability-slot--open appointment-availability-slot--readonly"
                style={slotStyle}
                title={`Disponible · ${slot.start} – ${slot.end}`}
                aria-hidden
              >
                <span className="appointment-open-slot-label">
                  {formatTimeShort(slot.start)}
                </span>
              </div>
            )
          }

          if (slot.appointment?.status === 'OPEN') {
            if (staffCalendar && onAvailabilitySlotClick) {
              return (
                <button
                  key={key}
                  type="button"
                  className="appointment-availability-slot appointment-availability-slot--open"
                  style={slotStyle}
                  onClick={(e) => {
                    e.stopPropagation()
                    onAvailabilitySlotClick({
                      availabilityId: block.id,
                      dateIso: block.availabilityDate,
                      startTime: slot.start,
                      endTime: slot.end,
                      openAppointment: slot.appointment,
                    })
                  }}
                  title={`Crear Cita · ${slot.start} – ${slot.end}`}
                  aria-label={`Espacio disponible ${slot.start} a ${slot.end}`}
                >
                  <span className="appointment-open-slot-label">
                    {formatTimeShort(slot.start)}
                  </span>
                </button>
              )
            }
            return (
              <button
                key={key}
                type="button"
                className="appointment-availability-slot appointment-availability-slot--open"
                style={slotStyle}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectAppointment?.(slot.appointment!)
                }}
                title={staffCalendar
                  ? `Crear Cita · ${slot.start} – ${slot.end}`
                  : `Solicitar cita · ${slot.start} – ${slot.end}`}
                aria-label={staffCalendar
                  ? `Espacio disponible ${slot.start} a ${slot.end}, solicitar cita`
                  : `Espacio disponible ${slot.start} a ${slot.end}, solicitar cita`}
              >
                <span className="appointment-open-slot-label">
                  {formatTimeShort(slot.start)}
                </span>
              </button>
            )
          }

          if (staffCalendar && (onAvailabilitySlotClick || onCreateInAvailabilitySlot)) {
            const openSlot = () => {
              if (onAvailabilitySlotClick) {
                onAvailabilitySlotClick({
                  availabilityId: block.id,
                  dateIso: block.availabilityDate,
                  startTime: slot.start,
                  endTime: slot.end,
                  openAppointment: null,
                })
                return
              }
              onCreateInAvailabilitySlot?.(block.availabilityDate, slot.start, slot.end)
            }
            return (
              <button
                key={key}
                type="button"
                className="appointment-availability-slot appointment-availability-slot--open"
                style={slotStyle}
                onClick={(e) => {
                  e.stopPropagation()
                  openSlot()
                }}
                title={`Crear Cita · ${slot.start} – ${slot.end}`}
                aria-label={`Espacio disponible ${slot.start} a ${slot.end}`}
              >
                <span className="appointment-open-slot-label">
                  {formatTimeShort(slot.start)}
                </span>
              </button>
            )
          }

          if (!staffCalendar) {
            return null
          }

          return (
            <div
              key={key}
              className="appointment-availability-slot appointment-availability-slot--empty"
              style={slotStyle}
              onMouseEnter={onClearOutsidePreview}
              onMouseMove={(e) => e.stopPropagation()}
            >
              <span className="appointment-open-slot-label">
                {formatTimeShort(slot.start)}
              </span>
            </div>
          )
        })}
      </div>
      {resizable && (
        <ResizeHandle edge="bottom" onPointerDown={handleZoneResizeStart('bottom')} />
      )}
    </div>
  )
}

export type CalendarAppointmentDrag = {
  appointmentId: number
  previewDateIso: string
  previewStart: number
  previewEnd: number
  invalid: boolean
} | null

type CalendarMoveHandlers = {
  scrollRef: RefObject<HTMLDivElement | null>
  allAppointments: AppointmentRequest[]
  availabilityBlocks: StaffAvailability[]
  drag: CalendarAppointmentDrag
  setDrag: (drag: CalendarAppointmentDrag) => void
  onCommit: (appointment: AppointmentRequest, dateIso: string, start: number, end: number) => void
  onConflict?: () => void
}

function DayColumn({
  day,
  appointments,
  availabilityBlocks,
  onSelect,
  onSelectAvailability,
  onCreateSlot,
  onCreateOutsideSlot,
  onCreateInAvailabilitySlot,
  onAvailabilitySlotClick,
  onBlockedSlotClick,
  onOutsideCreateBlocked,
  onResizeAvailability,
  onResizeAppointment,
  onScheduleConflict,
  calendarMove,
  interactive,
  staffCalendar,
  showHeader = true,
  compactWeek = false,
  now,
  viewOnly = false,
}: {
  day: Date
  appointments: AppointmentRequest[]
  availabilityBlocks: StaffAvailability[]
  onSelect?: (appointment: AppointmentRequest) => void
  onSelectAvailability?: (block: StaffAvailability) => void
  onCreateSlot?: (date: Date, hour: number) => void
  onCreateOutsideSlot?: (date: Date, startTime: string, endTime: string) => void
  onCreateInAvailabilitySlot?: (dateIso: string, startTime: string, endTime: string) => void
  onAvailabilitySlotClick?: (params: {
    availabilityId: number
    dateIso: string
    startTime: string
    endTime: string
    openAppointment?: AppointmentRequest | null
  }) => void
  onBlockedSlotClick?: (params: {
    availabilityId: number
    dateIso: string
    startTime: string
    endTime: string
    blockedAppointment: AppointmentRequest
  }) => void
  onOutsideCreateBlocked?: () => void
  onResizeAvailability?: (block: StaffAvailability, startTime: string, endTime: string) => void
  onResizeAppointment?: (
    appointment: AppointmentRequest,
    scheduledStart: string,
    scheduledEnd: string,
  ) => void
  onScheduleConflict?: () => void
  calendarMove?: CalendarMoveHandlers
  interactive?: boolean
  staffCalendar?: boolean
  showHeader?: boolean
  compactWeek?: boolean
  now: Date
  viewOnly?: boolean
}) {
  const [hoverPreview, setHoverPreview] = useState<{
    start: number
    end: number
    valid: boolean
  } | null>(null)

  const dayAppointments = appointmentsForDay(appointments, day)
  const dayAvailability = availabilityForDay(availabilityBlocks, day)
  const availabilityIds = new Set(dayAvailability.map((b) => b.id))
  const standaloneAppointments = dayAppointments.filter((a) => {
    if (a.status === 'OPEN' || a.status === 'BLOCKED') return false
    if (a.staffAvailabilityId && availabilityIds.has(a.staffAvailabilityId)) return false
    if (isReservedAppointment(a.status) && dayAvailability.some((b) => appointmentFitsAvailabilityBlock(a, b))) {
      return false
    }
    return true
  })
  const totalHours = TIMELINE_END_HOUR - TIMELINE_START_HOUR
  const isToday = isSameDay(day, now)
  const dateIso = toIsoDate(day)
  const appointmentEditable = !viewOnly && staffCalendar && !!onResizeAppointment && !!calendarMove?.scrollRef

  const beginAppointmentDrag = (appointment: AppointmentRequest, e: MouseEvent<HTMLElement>) => {
    const scrollEl = calendarMove?.scrollRef.current
    if (!scrollEl || !onResizeAppointment || !calendarMove) return
    if (!appointment.scheduledStart || !appointment.scheduledEnd) return

    startCalendarAppointmentMove({
      scrollEl,
      appointmentId: appointment.id,
      startDateIso: dateIsoFromAppointment(appointment),
      startMinutes: appointmentStartMinutes(appointment),
      endMinutes: appointmentEndMinutes(appointment),
      startClientX: e.clientX,
      startClientY: e.clientY,
      appointments: calendarMove.allAppointments,
      availabilityBlocks: calendarMove.availabilityBlocks,
      onDragStart: () => {
        calendarMove.setDrag({
          appointmentId: appointment.id,
          previewDateIso: dateIsoFromAppointment(appointment),
          previewStart: appointmentStartMinutes(appointment),
          previewEnd: appointmentEndMinutes(appointment),
          invalid: false,
        })
      },
      onPreview: (previewDateIso, start, end, valid) => {
        calendarMove.setDrag({
          appointmentId: appointment.id,
          previewDateIso,
          previewStart: start,
          previewEnd: end,
          invalid: !valid,
        })
      },
      onCommit: (previewDateIso, start, end) => {
        calendarMove.setDrag(null)
        calendarMove.onCommit(appointment, previewDateIso, start, end)
      },
      onClick: () => onSelect?.(appointment),
      onInvalid: () => {
        calendarMove.setDrag(null)
        calendarMove.onConflict?.()
      },
    })
  }

  const draggingAppointmentId = calendarMove?.drag?.appointmentId ?? null
  const dragPreview = calendarMove?.drag?.previewDateIso === dateIso ? calendarMove.drag : null
  const dragPreviewAppointment = dragPreview
    ? calendarMove?.allAppointments.find((a) => a.id === dragPreview.appointmentId)
    : undefined

  const handleDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (viewOnly || !interactive || !onCreateSlot) return
    const { gridEl } = getTimelineGridElements(e.currentTarget)
    const rect = gridEl.getBoundingClientRect()
    const y = e.clientY - rect.top
    const hourOffset = Math.floor((y / Math.max(rect.height, 1)) * totalHours)
    const hour = TIMELINE_START_HOUR + hourOffset
    onCreateSlot(day, Math.min(Math.max(hour, TIMELINE_START_HOUR), TIMELINE_END_HOUR - 1))
  }

  const handleGridMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (viewOnly || !staffCalendar || !onCreateOutsideSlot) {
      setHoverPreview(null)
      return
    }
    if (!isOutsideCreateTarget(e.target)) {
      setHoverPreview(null)
      return
    }

    const { gridEl } = getTimelineGridElements(e.currentTarget)
    const { start, end } = computeOutsideCreateSlot(e.clientY, gridEl)
    const dateIso = toIsoDate(day)
    const valid = canCreateOutsideAvailabilitySlot(
      dateIso,
      start,
      end,
      availabilityBlocks,
      dayAppointments,
    )
    setHoverPreview({ start, end, valid })
  }

  const handleGridMouseLeave = () => {
    setHoverPreview(null)
  }

  const handleGridClick = (e: MouseEvent<HTMLDivElement>) => {
    if (viewOnly || !staffCalendar || !onCreateOutsideSlot) return
    if (!isOutsideCreateTarget(e.target)) return

    const { gridEl } = getTimelineGridElements(e.currentTarget)
    const { start: effectiveStart, end: endMin } = computeOutsideCreateSlot(e.clientY, gridEl)
    const dateIso = toIsoDate(day)
    const valid = canCreateOutsideAvailabilitySlot(
      dateIso,
      effectiveStart,
      endMin,
      availabilityBlocks,
      dayAppointments,
    )

    if (!valid) {
      onOutsideCreateBlocked?.()
      return
    }

    onCreateOutsideSlot(
      day,
      minutesToTimeString(effectiveStart),
      minutesToTimeString(endMin),
    )
  }

  const handleStandaloneResize = (
    appointment: AppointmentRequest,
    startTime: string,
    endTime: string,
  ) => {
    if (!onResizeAppointment) return
    onResizeAppointment(
      appointment,
      combineDateAndTime(dateIso, startTime),
      combineDateAndTime(dateIso, endTime),
    )
  }

  return (
    <div className={`appointment-gcal-day${isToday ? ' today' : ''}`}>
      {showHeader && (
        <div className="appointment-gcal-day-header">
          <span className="appointment-gcal-weekday">{WEEKDAY_LABELS[(day.getDay() + 6) % 7]}</span>
          <span className={`appointment-gcal-date${isToday ? ' appointment-gcal-date--today' : ''}`}>
            {day.getDate()}
          </span>
        </div>
      )}
      <div
        className={`appointment-gcal-day-grid${hoverPreview && !hoverPreview.valid ? ' appointment-gcal-day-grid--staff-create-invalid' : ''}`}
        data-date-iso={dateIso}
        onDoubleClick={handleDoubleClick}
        onClick={handleGridClick}
        onMouseMove={handleGridMouseMove}
        onMouseLeave={handleGridMouseLeave}
      >
        {Array.from({ length: totalHours }, (_, i) => (
          <div
            key={i}
            className="appointment-gcal-hour-line"
            style={{ top: `${(i / totalHours) * 100}%` }}
          />
        ))}
        {dayAvailability.map((block) => (
          <AvailabilityZone
            key={block.id}
            block={block}
            appointments={dayAppointments}
            onSelectAvailability={onSelectAvailability}
            onSelectAppointment={onSelect}
            onCreateInAvailabilitySlot={onCreateInAvailabilitySlot}
            onAvailabilitySlotClick={onAvailabilitySlotClick}
            onBlockedSlotClick={onBlockedSlotClick}
            onClearOutsidePreview={() => setHoverPreview(null)}
            onResizeAvailability={onResizeAvailability}
            onBeginAppointmentDrag={appointmentEditable ? beginAppointmentDrag : undefined}
            draggingAppointmentId={draggingAppointmentId}
            staffCalendar={staffCalendar}
            viewOnly={viewOnly}
          />
        ))}
        {standaloneAppointments.map((a) => (
          <AppointmentBlock
            key={appointmentKey(a)}
            appointment={a}
            onSelect={onSelect}
            onResize={handleStandaloneResize}
            onBeginDrag={appointmentEditable ? beginAppointmentDrag : undefined}
            draggingHidden={draggingAppointmentId === a.id}
            resizable={appointmentEditable && isReservedAppointment(a.status)}
            movable={appointmentEditable && isReservedAppointment(a.status)}
            compactWeek={compactWeek}
          />
        ))}
        {hoverPreview && (
          <div
            className={`appointment-outside-create-preview${hoverPreview.valid ? ' appointment-outside-create-preview--valid' : ' appointment-outside-create-preview--invalid'}`}
            style={timelineStyleFromMinutes(hoverPreview.start, hoverPreview.end)}
            aria-hidden
          >
            <span className="appointment-outside-create-preview-label">
              {formatTimeRangeLabel(
                minutesToTimeString(hoverPreview.start),
                minutesToTimeString(hoverPreview.end),
              )}
            </span>
          </div>
        )}
        {dragPreview && dragPreviewAppointment && (
          <div
            className="appointment-drag-overlay"
            style={timelineStyleFromMinutes(dragPreview.previewStart, dragPreview.previewEnd)}
            aria-hidden
          >
            <ReservationPill
              appointment={dragPreviewAppointment}
              invalid={dragPreview.invalid}
              preview
            />
          </div>
        )}
        <CalendarCurrentTimeLine day={day} now={now} />
      </div>
    </div>
  )
}

export default function AppointmentTimeline({
  appointments,
  availabilityBlocks = [],
  view,
  anchor,
  onSelect,
  onSelectAvailability,
  onCreateSlot,
  onCreateOutsideSlot,
  onCreateInAvailabilitySlot,
  onAvailabilitySlotClick,
  onBlockedSlotClick,
  onOutsideCreateBlocked,
  onResizeAvailability,
  onResizeAppointment,
  onScheduleConflict,
  interactive = false,
  staffCalendar = false,
  viewOnly = false,
  compact = false,
  scrollToNow = true,
  scrollToNowKey,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [calendarDrag, setCalendarDrag] = useState<CalendarAppointmentDrag>(null)
  const now = useLiveNow()
  const totalHours = TIMELINE_END_HOUR - TIMELINE_START_HOUR

  const calendarMove = useMemo<CalendarMoveHandlers | undefined>(() => {
    if (!staffCalendar || !onResizeAppointment) return undefined
    return {
      scrollRef: scrollRef,
      allAppointments: appointments,
      availabilityBlocks,
      drag: calendarDrag,
      setDrag: setCalendarDrag,
      onCommit: (appointment, dateIso, start, end) => {
        onResizeAppointment(
          appointment,
          combineDateAndTime(dateIso, minutesToTimeString(start)),
          combineDateAndTime(dateIso, minutesToTimeString(end)),
        )
      },
      onConflict: onScheduleConflict,
    }
  }, [
    staffCalendar,
    onResizeAppointment,
    appointments,
    availabilityBlocks,
    calendarDrag,
    onScheduleConflict,
  ])

  const days = useMemo(() => {
    if (view === 'day') return [anchor]
    const start = new Date(anchor)
    const dayOfWeek = start.getDay()
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    start.setDate(start.getDate() + diff)
    start.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [view, anchor])

  useEffect(() => {
    if (!scrollToNow || !scrollRef.current) return
    const now = new Date()
    const includesToday = days.some((d) => isSameDay(d, now))
    if (!includesToday) return
    return scheduleScrollTimelineToNow(scrollRef.current) ?? undefined
  }, [days, scrollToNow, view, anchor, scrollToNowKey, appointments.length])

  return (
    <div className={`appointment-gcal${compact ? ' appointment-gcal--compact' : ''}`}>
      <div className="appointment-gcal-shell">
        <div className={`appointment-gcal-header-row${view === 'week' ? ' appointment-gcal-header-row--week' : ''}`}>
          <div className="appointment-gcal-time-gutter appointment-gcal-time-gutter--header" aria-hidden />
          {days.map((day) => (
            <div key={toIsoDate(day)} className={`appointment-gcal-day-header-slot${isSameDay(day, new Date()) ? ' today' : ''}`}>
              <span className="appointment-gcal-weekday">{WEEKDAY_LABELS[(day.getDay() + 6) % 7]}</span>
              <span className={`appointment-gcal-date${isSameDay(day, new Date()) ? ' appointment-gcal-date--today' : ''}`}>
                {day.getDate()}
              </span>
            </div>
          ))}
        </div>

        <div className="appointment-gcal-scroll" ref={scrollRef}>
          <div className={`appointment-gcal-body${view === 'week' ? ' appointment-gcal-body--week' : ''}`}>
            <div className="appointment-gcal-time-gutter appointment-gcal-time-gutter--timeline">
              {Array.from({ length: totalHours }, (_, i) => {
                const hour = TIMELINE_START_HOUR + i
                return (
                  <div key={hour} className="appointment-gcal-time-label">
                    <span>{formatHourLabel(hour)}</span>
                  </div>
                )
              })}
            </div>

            <div className={`appointment-gcal-columns${view === 'week' ? ' appointment-gcal-columns--week' : ''}`}>
              {days.map((day) => (
                <DayColumn
                  key={toIsoDate(day)}
                  day={day}
                  appointments={appointments}
                  availabilityBlocks={availabilityBlocks}
                  onSelect={onSelect}
                  onSelectAvailability={onSelectAvailability}
                  onCreateSlot={onCreateSlot}
                  onCreateOutsideSlot={onCreateOutsideSlot}
                  onCreateInAvailabilitySlot={onCreateInAvailabilitySlot}
                  onAvailabilitySlotClick={onAvailabilitySlotClick}
                  onBlockedSlotClick={onBlockedSlotClick}
                  onOutsideCreateBlocked={onOutsideCreateBlocked}
                  onResizeAvailability={onResizeAvailability}
                  onResizeAppointment={onResizeAppointment}
                  onScheduleConflict={onScheduleConflict}
                  calendarMove={calendarMove}
                  interactive={interactive}
                  staffCalendar={staffCalendar}
                  showHeader={false}
                  compactWeek={view === 'week'}
                  now={now}
                  viewOnly={viewOnly}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

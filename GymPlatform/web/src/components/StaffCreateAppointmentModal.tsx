import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { api } from '../api'

import { useToast } from '../toast'

import type { AppointmentRequest, AvailableSlot, StaffAvailability, User } from '../types'

import {
  STAFF_CALENDAR_APPOINTMENT_TYPES,
  appointmentTypeLabel,
} from '../utils/appointmentUtils'

import {
  appointmentsForDay,
  combineDateAndTime,
  dateInputValue,
  localTimeFromIso,
  parseDateTime,
} from '../utils/appointmentCalendarUtils'

import {
  canCreateOutsideAvailabilitySlot,
  minutesToTimeLabel,
  parseTimeToMinutes,
} from '../utils/availabilityUtils'
import { formatTimeRangeLabel } from '../utils/dateFormat'

import MemberSearchSelect from './MemberSearchSelect'
import StaffSearchSelect from './StaffSearchSelect'

import { parseDate, toIsoDate } from '../utils/calendarUtils'

type ScheduleMode = 'available' | 'custom'
type ScheduleContext = 'availability' | 'outside'

type Props = {
  openAppointment?: AppointmentRequest | null
  initialDate?: Date
  initialStartTime?: string
  initialEndTime?: string
  scheduleContext?: ScheduleContext
  availabilityBlocks?: StaffAvailability[]
  appointments?: AppointmentRequest[]
  memberUsers: User[]
  staffUsers: User[]
  onClose: () => void
  onCreated: (appointment?: AppointmentRequest) => void
}

const DEFAULT_DURATION_MINUTES = 30
const OUTSIDE_DURATION_OPTIONS = [15, 30, 45, 60] as const
type OutsideDuration = (typeof OUTSIDE_DURATION_OPTIONS)[number]

function durationFromTimeRange(startTime: string, endTime: string): OutsideDuration | null {
  const minutes = parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime)
  return (OUTSIDE_DURATION_OPTIONS as readonly number[]).includes(minutes)
    ? (minutes as OutsideDuration)
    : null
}

function defaultCustomEnd(startTime: string, durationMinutes = DEFAULT_DURATION_MINUTES): string {
  return minutesToTimeLabel(parseTimeToMinutes(startTime) + durationMinutes)
}

export default function StaffCreateAppointmentModal({
  openAppointment,
  initialDate,
  initialStartTime,
  initialEndTime,
  scheduleContext,
  availabilityBlocks = [],
  appointments = [],
  memberUsers,
  staffUsers,
  onClose,
  onCreated,
}: Props) {
  const { showApiError, showSuccess, showError } = useToast()
  const [type, setType] = useState(STAFF_CALENDAR_APPOINTMENT_TYPES[0])
  const [memberId, setMemberId] = useState<number | ''>('')
  const [staffId, setStaffId] = useState<number | ''>('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const isOpenSlotClaim = openAppointment != null
  const isCalendarPrefill = !isOpenSlotClaim
    && initialStartTime != null
    && initialEndTime != null
    && (scheduleContext === 'availability' || scheduleContext === 'outside')
  const isAvailabilityPrefill = isCalendarPrefill && scheduleContext === 'availability'
  const isOutsidePrefill = isCalendarPrefill && scheduleContext === 'outside'
  const isFixedSchedule = isOpenSlotClaim || isAvailabilityPrefill

  const openStart = openAppointment?.scheduledStart
    ? parseDateTime(openAppointment.scheduledStart)
    : initialDate ?? null

  const [date, setDate] = useState(
    openStart
      ? toIsoDate(openStart)
      : dateInputValue(initialDate ?? new Date()),
  )

  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('available')

  const [customStartTime, setCustomStartTime] = useState(
    () => initialStartTime ?? (openAppointment?.scheduledStart
      ? localTimeFromIso(openAppointment.scheduledStart)
      : '09:00'),
  )
  const [outsideDuration, setOutsideDuration] = useState<OutsideDuration>(() => {
    if (initialStartTime && initialEndTime) {
      return durationFromTimeRange(initialStartTime, initialEndTime) ?? DEFAULT_DURATION_MINUTES
    }
    return DEFAULT_DURATION_MINUTES
  })

  const customEndTime = useMemo(
    () => defaultCustomEnd(customStartTime, outsideDuration),
    [customStartTime, outsideDuration],
  )

  const [slots, setSlots] = useState<AvailableSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(() => {
    if (!isOpenSlotClaim || !openAppointment?.scheduledStart || !openAppointment.scheduledEnd) return null
    const start = localTimeFromIso(openAppointment.scheduledStart)
    const end = localTimeFromIso(openAppointment.scheduledEnd)
    return `${start}|${end}`
  })
  const [openAppointmentId, setOpenAppointmentId] = useState<number | null>(
    openAppointment?.id ?? null,
  )

  const dayAppointments = useMemo(
    () => appointmentsForDay(appointments, parseDate(date)),
    [appointments, date],
  )

  useEffect(() => {
    if (!date || !isAvailabilityPrefill || !initialStartTime || !initialEndTime) return
    api.getStaffAvailableSlots(date)
      .then((available) => {
        const match = available.find(
          (s) => s.startTime === initialStartTime
            && s.endTime === initialEndTime
            && s.available
            && s.appointmentId != null,
        )
        if (match?.appointmentId) {
          setOpenAppointmentId(match.appointmentId)
        }
      })
      .catch(() => {})
  }, [date, isAvailabilityPrefill, initialStartTime, initialEndTime])

  useEffect(() => {
    if (!date || scheduleMode !== 'available' || isFixedSchedule || isOutsidePrefill) {
      setSlots([])
      return
    }
    api.getStaffAvailableSlots(date)
      .then(setSlots)
      .catch(() => setSlots([]))
  }, [date, scheduleMode, isFixedSchedule, isOutsidePrefill])

  const customDurationMinutes = outsideDuration

  const customRangeBlocked = useMemo(() => {
    const startMin = parseTimeToMinutes(customStartTime)
    const endMin = parseTimeToMinutes(customEndTime)
    return !canCreateOutsideAvailabilitySlot(
      date,
      startMin,
      endMin,
      availabilityBlocks,
      dayAppointments,
    )
  }, [
    customStartTime,
    customEndTime,
    date,
    availabilityBlocks,
    dayAppointments,
  ])

  const fixedScheduleLabel = isOpenSlotClaim && openAppointment
    ? formatTimeRangeLabel(
      localTimeFromIso(openAppointment.scheduledStart),
      localTimeFromIso(openAppointment.scheduledEnd),
    )
    : isAvailabilityPrefill
      ? formatTimeRangeLabel(initialStartTime, initialEndTime)
      : null

  const handleCustomStartChange = (value: string) => {
    setCustomStartTime(value)
  }

  const outsideScheduleFields = (
    <fieldset className={`appointment-outside-schedule${customRangeBlocked ? ' appointment-outside-schedule--invalid' : ''}`}>
      <legend>Horario fuera de disponibilidad</legend>
      <p className="text-muted appointment-custom-duration-hint">
        Elige la hora de inicio y una duración de 15, 30, 45 o 60 minutos.
      </p>
      <div className="appointment-custom-time-row">
        <label>
          Inicio
          <input
            type="time"
            value={customStartTime}
            onChange={(e) => handleCustomStartChange(e.target.value)}
            required
          />
        </label>
        <label>
          Fin
          <input
            type="time"
            value={customEndTime}
            readOnly
            aria-readonly
            tabIndex={-1}
          />
        </label>
      </div>
      <div className="availability-duration-pills" role="group" aria-label="Duración de la cita">
        {OUTSIDE_DURATION_OPTIONS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            className={`availability-duration-pill${outsideDuration === minutes ? ' active' : ''}`}
            onClick={() => setOutsideDuration(minutes)}
            aria-pressed={outsideDuration === minutes}
          >
            {minutes} min
          </button>
        ))}
      </div>
      <p className="text-muted">
        {formatTimeRangeLabel(customStartTime, customEndTime)} · <strong>{customDurationMinutes} min</strong>
      </p>
      {customRangeBlocked && (
        <p className="form-error">
          Ese horario no está disponible (solapa disponibilidad u otra cita).
        </p>
      )}
    </fieldset>
  )

  const submitCustomOutside = (): { scheduledStart: string; scheduledEnd: string } | null => {
    if (customRangeBlocked) {
      showError('Ese horario no está disponible')
      return null
    }
    return {
      scheduledStart: combineDateAndTime(date, customStartTime),
      scheduledEnd: combineDateAndTime(date, customEndTime),
    }
  }

  const submitAvailabilityPrefill = (): {
    openAppointmentId?: number
    scheduledStart?: string
    scheduledEnd?: string
  } | null => {
    if (!initialStartTime || !initialEndTime) return null
    if (openAppointmentId != null) {
      return { openAppointmentId }
    }
    return {
      scheduledStart: combineDateAndTime(date, initialStartTime),
      scheduledEnd: combineDateAndTime(date, initialEndTime),
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!memberId || !staffId) return

    let payload: Parameters<typeof api.createAppointmentRequest>[0] = {
      memberId: Number(memberId),
      type,
      notes: notes.trim() || undefined,
      preferredStaffId: Number(staffId),
    }

    if (isOpenSlotClaim && openAppointmentId != null) {
      payload = { ...payload, openAppointmentId }
    } else if (isAvailabilityPrefill) {
      const availabilityPayload = submitAvailabilityPrefill()
      if (!availabilityPayload) return
      payload = { ...payload, ...availabilityPayload }
    } else if (isOutsidePrefill) {
      const custom = submitCustomOutside()
      if (!custom) return
      payload = { ...payload, ...custom }
    } else if (scheduleMode === 'custom') {
      const custom = submitCustomOutside()
      if (!custom) return
      payload = { ...payload, ...custom }
    } else if (selectedSlot) {
      const [startTime, endTime] = selectedSlot.split('|')
      const slotMatch = slots.find((s) => s.startTime === startTime && s.endTime === endTime)
      payload = {
        ...payload,
        openAppointmentId: openAppointmentId ?? slotMatch?.appointmentId ?? undefined,
        scheduledStart: slotMatch?.appointmentId
          ? undefined
          : combineDateAndTime(date, startTime),
        scheduledEnd: slotMatch?.appointmentId
          ? undefined
          : combineDateAndTime(date, endTime),
      }
    } else {
      return
    }

    setLoading(true)
    try {
      const created = await api.createAppointmentRequest(payload)
      showSuccess('Cita creada')
      onCreated(created)
      onClose()
    } catch (err) {
      showApiError(err, 'No se pudo crear la cita')
    } finally {
      setLoading(false)
    }
  }

  const showCustomFields = !isFixedSchedule && scheduleMode === 'custom'

  const canSubmit = memberId && staffId && (
    isFixedSchedule
    || (isOutsidePrefill && !customRangeBlocked)
    || (showCustomFields && !customRangeBlocked)
    || (scheduleMode === 'available' && !!selectedSlot)
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h2>Crear Cita</h2>
        <form onSubmit={submit} className="form-stack">
          {isFixedSchedule ? (
            <p className="text-muted">
              Horario: <strong>{fixedScheduleLabel}</strong>
            </p>
          ) : isOutsidePrefill ? (
            outsideScheduleFields
          ) : (
            <>
              <label>
                Fecha
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value)
                    setSelectedSlot(null)
                    setOpenAppointmentId(null)
                  }}
                  required
                />
              </label>

              <fieldset className="appointment-schedule-mode">
                <legend>Tipo de horario</legend>
                <label className="radio-inline">
                  <input
                    type="radio"
                    name="scheduleMode"
                    checked={scheduleMode === 'available'}
                    onChange={() => setScheduleMode('available')}
                  />
                  Espacio disponible (bloque verde)
                </label>
                <label className="radio-inline">
                  <input
                    type="radio"
                    name="scheduleMode"
                    checked={scheduleMode === 'custom'}
                    onChange={() => setScheduleMode('custom')}
                  />
                  Fuera de disponibilidad
                </label>
              </fieldset>

              {showCustomFields ? (
                outsideScheduleFields
              ) : (
                <fieldset>
                  <legend>Horario disponible</legend>
                  {slots.length === 0 ? (
                    <p className="text-muted">No hay horarios disponibles para esta fecha.</p>
                  ) : (
                    <div className="appointment-slot-grid">
                      {slots.map((slot) => {
                        const key = `${slot.startTime}|${slot.endTime}`
                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={!slot.available}
                            className={`appointment-slot-btn${selectedSlot === key ? ' active' : ''}${!slot.available ? ' disabled' : ''}`}
                            onClick={() => {
                              setSelectedSlot(key)
                              setOpenAppointmentId(slot.appointmentId)
                            }}
                          >
                            {formatTimeRangeLabel(slot.startTime, slot.endTime)}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </fieldset>
              )}
            </>
          )}

          <MemberSearchSelect
            members={memberUsers}
            value={memberId}
            onChange={setMemberId}
            required
          />

          <label>
            Motivo
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              {STAFF_CALENDAR_APPOINTMENT_TYPES.map((t) => (
                <option key={t} value={t}>{appointmentTypeLabel(t)}</option>
              ))}
            </select>
          </label>

          <StaffSearchSelect
            staffUsers={staffUsers}
            value={staffId}
            onChange={setStaffId}
            required
          />

          <label>
            Notas
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Creando…' : 'Crear Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

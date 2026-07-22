import { useEffect, useState, type FormEvent } from 'react'

import { api } from '../api'

import { useToast } from '../toast'

import type { AppointmentRequest, AvailableSlot, User } from '../types'

import { APPOINTMENT_TYPES, appointmentTypeLabel } from '../utils/appointmentUtils'

import StaffSearchSelect from './StaffSearchSelect'

import { combineDateAndTime, dateInputValue, parseDateTime } from '../utils/appointmentCalendarUtils'

import { toIsoDate } from '../utils/calendarUtils'

import { formatTimeRangeLabel } from '../utils/dateFormat'



type Props = {

  staffUsers: User[]

  initialDate?: Date

  initialHour?: number

  initialOpenAppointment?: AppointmentRequest

  onClose: () => void

  onCreated: () => void

}



export default function CreateAppointmentModal({

  staffUsers,

  initialDate,

  initialHour,

  initialOpenAppointment,

  onClose,

  onCreated,

}: Props) {

  const { showApiError, showSuccess } = useToast()

  const [type, setType] = useState(APPOINTMENT_TYPES[0])

  const [notes, setNotes] = useState('')

  const [staffId, setStaffId] = useState<number | ''>('')

  const openStart = initialOpenAppointment?.scheduledStart

    ? parseDateTime(initialOpenAppointment.scheduledStart)

    : null

  const [date, setDate] = useState(

    openStart

      ? toIsoDate(openStart)

      : dateInputValue(initialDate ?? new Date()),

  )

  const [slots, setSlots] = useState<AvailableSlot[]>([])

  const [selectedSlot, setSelectedSlot] = useState<string | null>(() => {

    if (!initialOpenAppointment?.scheduledStart || !initialOpenAppointment.scheduledEnd) return null

    const start = initialOpenAppointment.scheduledStart.slice(11, 16)

    const end = initialOpenAppointment.scheduledEnd.slice(11, 16)

    return `${start}|${end}`

  })

  const [openAppointmentId, setOpenAppointmentId] = useState<number | null>(

    initialOpenAppointment?.id ?? null,

  )

  const [loading, setLoading] = useState(false)



  useEffect(() => {

    if (!date) {

      setSlots([])

      return

    }

    api.getStaffAvailableSlots(date)

      .then(setSlots)

      .catch(() => setSlots([]))

  }, [date])



  useEffect(() => {

    if (initialOpenAppointment) return

    if (initialHour == null || !date) return

    const start = `${String(initialHour).padStart(2, '0')}:00`

    const end = `${String(initialHour + 1).padStart(2, '0')}:00`

    const match = slots.find((s) => s.available && s.startTime === start)

    if (match) {

      setSelectedSlot(`${match.startTime}|${match.endTime}`)

      setOpenAppointmentId(match.appointmentId)

    } else if (slots.some((s) => s.available && s.startTime <= start && s.endTime >= end)) {

      setSelectedSlot(`${start}|${end}`)

    }

  }, [initialHour, date, slots, initialOpenAppointment])



  const submit = async (e: FormEvent) => {

    e.preventDefault()

    if (!staffId || !selectedSlot) return

    const [startTime, endTime] = selectedSlot.split('|')

    const slotMatch = slots.find((s) => s.startTime === startTime && s.endTime === endTime)

    setLoading(true)

    try {

      await api.createAppointmentRequest({

        type,

        notes: notes.trim() || undefined,

        preferredStaffId: Number(staffId),

        openAppointmentId: openAppointmentId ?? slotMatch?.appointmentId ?? undefined,

        scheduledStart: openAppointmentId || slotMatch?.appointmentId

          ? undefined

          : combineDateAndTime(date, startTime),

        scheduledEnd: openAppointmentId || slotMatch?.appointmentId

          ? undefined

          : combineDateAndTime(date, endTime),

      })

      showSuccess('Solicitud de cita enviada')

      onCreated()

      onClose()

    } catch (err) {

      showApiError(err, 'No se pudo enviar la solicitud')

    } finally {

      setLoading(false)

    }

  }



  return (

    <div className="modal-overlay" onClick={onClose}>

      <div className="modal card" onClick={(e) => e.stopPropagation()}>

        <h2>Solicitar cita</h2>

        <form onSubmit={submit} className="form-stack">

          <label>

            Tipo

            <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>

              {APPOINTMENT_TYPES.map((t) => (

                <option key={t} value={t}>{appointmentTypeLabel(t)}</option>

              ))}

            </select>

          </label>

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

            <button type="submit" disabled={loading || !selectedSlot || !staffId}>{loading ? 'Enviando…' : 'Solicitar cita'}</button>

          </div>

        </form>

      </div>

    </div>

  )

}



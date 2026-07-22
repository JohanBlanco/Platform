import { useState, type FormEvent } from 'react'

import { api } from '../api'

import { useToast } from '../toast'

import { toIsoDate } from '../utils/calendarUtils'

import AvailabilityScheduleForm, {
  useAvailabilityScheduleSummary,
  type AvailabilityScheduleValues,
} from './AvailabilityScheduleForm'

type Props = {
  onClose: () => void
  onChanged: () => void
}

export default function StaffAvailabilityModal({ onClose, onChanged }: Props) {
  const { showApiError, showSuccess } = useToast()
  const [values, setValues] = useState<AvailabilityScheduleValues>({
    startDate: toIsoDate(new Date()),
    endDate: '',
    startTime: '09:00',
    endTime: '13:00',
    slotDurationMinutes: 30,
  })
  const [loading, setLoading] = useState(false)

  const summary = useAvailabilityScheduleSummary(values)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!summary.rangeValid) return
    setLoading(true)
    try {
      const result = await api.createStaffAvailabilityRange({
        startDate: values.startDate,
        endDate: values.endDate.trim() || null,
        startTime: values.startTime,
        endTime: values.endTime,
        slotDurationMinutes: values.slotDurationMinutes,
      })
      const skippedNote = result.daysSkipped > 0
        ? ` (${result.daysSkipped} día${result.daysSkipped === 1 ? '' : 's'} ya existían)`
        : ''
      showSuccess(
        `${result.appointmentsCreated} espacio${result.appointmentsCreated === 1 ? '' : 's'} en ${result.daysCreated} día${result.daysCreated === 1 ? '' : 's'}${skippedNote}`,
      )
      onChanged()
      onClose()
    } catch (err) {
      showApiError(err, 'No se pudo guardar la disponibilidad')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card availability-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Disponibilidad para citas</h2>
        <p className="availability-modal-subtitle">
          Define cuándo los miembros pueden solicitar cita en el calendario.
        </p>

        <form onSubmit={submit} className="availability-form">
          <AvailabilityScheduleForm
            values={values}
            onChange={(patch) => setValues((prev) => ({ ...prev, ...patch }))}
          />

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading || !summary.rangeValid}>
              {loading ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

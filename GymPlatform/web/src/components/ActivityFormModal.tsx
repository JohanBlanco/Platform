import { useEffect, useState } from 'react'
import { api } from '../api'
import AdminFormModal from './AdminFormModal'
import HorizontalSwitch from './HorizontalSwitch'
import type { Activity, ActivityReservationImpact } from '../types'
import { useToast } from '../toast'
import {
  findOverlappingActivitiesForAllDayCreate,
  formatAllDayOverlapConfirmMessage,
} from '../utils/activityOverlapUtils'
import {
  ACTIVITY_DURATION_PRESETS,
  WEEKDAY_OPTIONS,
  endTimeFromPreset,
  inferDurationPresetId,
  isAllDayPreset,
  type ActivityDurationPresetId,
  weekdayFromDate,
} from '../utils/activityDurationUtils'

export type ActivityFormDefaults = {
  startDate?: string
  startTime?: string
  durationPreset?: ActivityDurationPresetId
  recurring?: boolean
  repeatDays?: string[]
}

type Props = {
  open: boolean
  onClose: () => void
  onSaved: () => void
  defaults?: ActivityFormDefaults
}

const emptyForm = () => ({
  name: '',
  description: '',
  locationName: '',
  startDate: '',
  endDate: '',
  startTime: '09:00',
  durationPreset: '60' as ActivityDurationPresetId,
  recurring: false,
  repeatDays: [] as string[],
  unlimitedCapacity: true,
  capacity: '',
})

function formatImpactMessage(impact: ActivityReservationImpact, action: 'edit' | 'cancel'): string {
  const lines = impact.items.slice(0, 5).map(
    (item) => `· ${item.occurrenceDate} — ${item.memberName} (${item.status})`,
  )
  if (impact.items.length > 5) {
    lines.push(`· … y ${impact.items.length - 5} más`)
  }
  const intro = action === 'cancel'
    ? `Esta actividad tiene ${impact.activeReservations} reservaciones activas.`
    : `Este cambio afectará ${impact.affectedReservations} reservaciones activas.`
  return `${intro}\n\n${lines.join('\n')}\n\n¿Cancelar esas reservaciones y continuar?`
}

export default function ActivityFormModal({ open, onClose, onSaved, defaults }: Props) {
  const { showSuccess, showWarning, showApiError } = useToast()
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    const base = emptyForm()
    if (defaults?.startDate) {
      base.startDate = defaults.startDate
      base.endDate = defaults.startDate
      base.repeatDays = defaults.repeatDays ?? [weekdayFromDate(defaults.startDate)]
    }
    if (defaults?.startTime) base.startTime = defaults.startTime
    if (defaults?.durationPreset) base.durationPreset = defaults.durationPreset
    if (defaults?.recurring != null) base.recurring = defaults.recurring
    setForm(base)
  }, [open, defaults])

  const allDay = isAllDayPreset(form.durationPreset)
  const endTime = allDay ? null : endTimeFromPreset(form.startTime, form.durationPreset)

  const toggleDay = (day: string) => {
    setForm((prev) => ({
      ...prev,
      repeatDays: prev.repeatDays.includes(day)
        ? prev.repeatDays.filter((d) => d !== day)
        : [...prev.repeatDays, day],
    }))
  }

  const buildPayload = () => ({
    name: form.name,
    description: form.description,
    locationName: form.locationName,
    startDate: form.startDate,
    endDate: form.recurring ? (form.endDate || form.startDate) : form.startDate,
    startTime: allDay ? '00:00' : form.startTime,
    endTime: allDay ? '23:59' : endTime,
    allDay,
    capacity: form.unlimitedCapacity ? null : parseInt(form.capacity, 10) || null,
    recurring: form.recurring,
    repeatDays: form.recurring ? form.repeatDays : [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.recurring && !form.endDate) {
      showWarning('Indica la fecha de fin para actividades recurrentes')
      return
    }
    if (form.recurring && form.repeatDays.length === 0) {
      showWarning('Selecciona al menos un día de la semana')
      return
    }

    setSaving(true)
    try {
      if (allDay) {
        const rangeEnd = form.recurring ? form.endDate : form.startDate
        const existing = await api.getActivities(form.startDate, rangeEnd)
        const overlaps = findOverlappingActivitiesForAllDayCreate(
          form.startDate,
          rangeEnd,
          form.recurring,
          form.repeatDays,
          existing,
        )
        if (overlaps.length > 0) {
          if (!window.confirm(formatAllDayOverlapConfirmMessage(overlaps))) {
            return
          }
          const ids = [...new Set(overlaps.map((a) => a.id))]
          for (const id of ids) {
            await api.cancelActivity(id, true)
          }
        }
      }

      await api.createActivity(buildPayload())
      showSuccess('Actividad creada')
      onSaved()
      onClose()
    } catch (err) {
      showApiError(err, 'No se pudo crear la actividad')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminFormModal
      title="Nueva actividad"
      open={open}
      onClose={onClose}
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel="Crear actividad"
    >
      <div className="form-group">
        <label>Nombre</label>
        <input
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      <div className="form-group">
        <label>Ubicación</label>
        <input
          value={form.locationName}
          onChange={(e) => setForm((prev) => ({ ...prev, locationName: e.target.value }))}
          placeholder="Ej: Sala 1, Terraza"
        />
      </div>
      <div className="form-group">
        <label>Fecha de inicio</label>
        <input
          type="date"
          value={form.startDate}
          onChange={(e) => setForm((prev) => ({
            ...prev,
            startDate: e.target.value,
            endDate: prev.recurring ? prev.endDate : e.target.value,
            repeatDays: prev.repeatDays.length === 0 && e.target.value
              ? [weekdayFromDate(e.target.value)]
              : prev.repeatDays,
          }))}
          required
        />
      </div>
      <div className="form-group">
        <HorizontalSwitch
          label="Actividad recurrente"
          checked={form.recurring}
          onChange={(recurring) => setForm((prev) => ({
            ...prev,
            recurring,
            endDate: recurring ? prev.endDate || prev.startDate : prev.startDate,
            repeatDays: recurring && prev.repeatDays.length === 0 && prev.startDate
              ? [weekdayFromDate(prev.startDate)]
              : prev.repeatDays,
          }))}
        />
      </div>
      {form.recurring && (
        <>
          <div className="form-group">
            <label>Fecha de fin</label>
            <input
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>Días de la semana</label>
            <div className="activity-weekday-picker">
              {WEEKDAY_OPTIONS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={form.repeatDays.includes(day.value) ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => toggleDay(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      <div className="form-group">
        <label>Duración</label>
        <div className="activity-duration-picker">
          {ACTIVITY_DURATION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={form.durationPreset === preset.id ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setForm((prev) => ({ ...prev, durationPreset: preset.id }))}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      {!allDay && (
        <div className="form-group">
          <label>Hora inicio</label>
          <input
            type="time"
            value={form.startTime}
            onChange={(e) => setForm((prev) => ({ ...prev, startTime: e.target.value }))}
            required
          />
        </div>
      )}
      <div className="form-group">
        <label>Descripción</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          rows={2}
        />
      </div>
      <div className="form-group">
        <HorizontalSwitch
          label="Cupos"
          offLabel="Con límite"
          onLabel="Ilimitados"
          checked={form.unlimitedCapacity}
          onChange={(unlimitedCapacity) => setForm((prev) => ({ ...prev, unlimitedCapacity }))}
        />
      </div>
      {!form.unlimitedCapacity && (
        <div className="form-group">
          <label>Límite de cupos</label>
          <input
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))}
            required
          />
        </div>
      )}
    </AdminFormModal>
  )
}

export { formatImpactMessage, inferDurationPresetId }

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import AdminFormModal from '../../components/AdminFormModal'
import ConfirmDialog from '../../components/ConfirmDialog'
import HorizontalSwitch from '../../components/HorizontalSwitch'
import { useFilteredList } from '../../hooks/useFilteredList'
import { useDateFormat } from '../../preferences/useDateFormat'
import { useToast } from '../../toast'
import type { Activity } from '../../types'
import {
  ACTIVITY_DURATION_PRESETS,
  WEEKDAY_OPTIONS,
  endTimeFromPreset,
  inferDurationPresetId,
  isAllDayPreset,
  type ActivityDurationPresetId,
  weekdayFromDate,
} from '../../utils/activityDurationUtils'

type FormState = {
  name: string
  description: string
  imageUrl: string
  locationName: string
  startDate: string
  endDate: string
  startTime: string
  durationPreset: ActivityDurationPresetId
  recurring: boolean
  repeatDays: string[]
  unlimitedCapacity: boolean
  capacity: string
}

const emptyForm = (): FormState => {
  const today = new Date().toISOString().slice(0, 10)
  return {
    name: '',
    description: '',
    imageUrl: '',
    locationName: '',
    startDate: today,
    endDate: today,
    startTime: '09:00',
    durationPreset: '60',
    recurring: false,
    repeatDays: [weekdayFromDate(today)],
    unlimitedCapacity: true,
    capacity: '15',
  }
}

function formFromActivity(activity: Activity): FormState {
  const allDay = activity.allDay || (activity.startTime === '00:00' && activity.endTime === '23:59')
  return {
    name: activity.name,
    description: activity.description ?? '',
    imageUrl: activity.imageUrl ?? '',
    locationName: activity.locationName ?? '',
    startDate: activity.startDate,
    endDate: activity.endDate || activity.startDate,
    startTime: activity.startTime?.slice(0, 5) || '09:00',
    durationPreset: allDay
      ? 'all-day'
      : inferDurationPresetId(activity.allDay, activity.startTime, activity.endTime),
    recurring: activity.recurring,
    repeatDays: activity.repeatDays?.length
      ? [...activity.repeatDays]
      : [weekdayFromDate(activity.startDate)],
    unlimitedCapacity: activity.capacity == null,
    capacity: activity.capacity != null ? String(activity.capacity) : '15',
  }
}

export default function ActivitiesSection() {
  const { showApiError, showSuccess, showWarning } = useToast()
  const { formatIsoDate, formatTimeRange } = useDateFormat()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setActivities(await api.getActivitySeries(true))
    } catch (error) {
      showApiError(error, 'No se pudieron cargar las actividades')
    } finally {
      setLoading(false)
    }
  }, [showApiError])

  useEffect(() => {
    void load()
  }, [load])

  const { filtered, filterInput } = useFilteredList(
    activities,
    useCallback(
      (activity: Activity) => [
        activity.description ?? '',
        activity.locationName ?? '',
        activity.instructorName ?? '',
      ],
      [],
    ),
  )

  const allDay = isAllDayPreset(form.durationPreset)
  const endTime = allDay
    ? '23:59'
    : (endTimeFromPreset(form.startTime, form.durationPreset) ?? '10:00')

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  const openEdit = (activity: Activity) => {
    setEditing(activity)
    setForm(formFromActivity(activity))
    setModalOpen(true)
  }

  const uploadImage = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    try {
      const result = await api.uploadMarketingMedia(file)
      setForm((current) => ({ ...current, imageUrl: result.url }))
      showSuccess('Imagen subida')
    } catch (error) {
      showApiError(error, 'No se pudo subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const buildPayload = (confirmAffectedReservations = false) => ({
    name: form.name.trim(),
    description: form.description.trim() || null,
    imageUrl: form.imageUrl.trim() || '',
    locationName: form.locationName.trim() || null,
    startDate: form.startDate,
    endDate: form.recurring ? form.endDate || form.startDate : form.startDate,
    startTime: allDay ? '00:00' : form.startTime,
    endTime: allDay ? '23:59' : endTime,
    allDay,
    capacity: form.unlimitedCapacity ? null : parseInt(form.capacity, 10) || null,
    recurring: form.recurring,
    repeatDays: form.recurring ? form.repeatDays : [],
    confirmAffectedReservations,
  })

  const save = async (confirmAffectedReservations = false) => {
    if (!form.name.trim()) {
      showWarning('Indica el nombre de la actividad')
      return
    }
    if (form.recurring && form.repeatDays.length === 0) {
      showWarning('Selecciona al menos un día de la semana')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await api.updateActivity(editing.id, buildPayload(confirmAffectedReservations))
        showSuccess('Actividad actualizada')
      } else {
        await api.createActivity(buildPayload())
        showSuccess('Actividad creada')
      }
      setModalOpen(false)
      setEditing(null)
      await load()
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (
        editing
        && !confirmAffectedReservations
        && /reservacion|reservación|afect/i.test(message)
      ) {
        if (window.confirm(`${message}\n\n¿Cancelar esas reservaciones y continuar?`)) {
          setSaving(false)
          await save(true)
          return
        }
      }
      showApiError(error, 'No se pudo guardar la actividad')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.cancelActivity(deleteTarget.id, true)
      showSuccess('Actividad eliminada')
      setDeleteTarget(null)
      await load()
    } catch (error) {
      showApiError(error, 'No se pudo eliminar la actividad')
    } finally {
      setDeleting(false)
    }
  }

  const scheduleLabel = useMemo(
    () => (activity: Activity) => {
      if (activity.recurring) {
        const days = (activity.repeatDays ?? [])
          .map((day) => WEEKDAY_OPTIONS.find((option) => option.value === day)?.label ?? day)
          .join(', ')
        return `${days || 'Recurrente'} · ${formatTimeRange(activity.startTime, activity.endTime)}`
      }
      return `${formatIsoDate(activity.startDate)} · ${formatTimeRange(activity.startTime, activity.endTime)}`
    },
    [formatIsoDate, formatTimeRange],
  )

  return (
    <div className="activities-admin">
      <div className="admin-list-toolbar">
        {filterInput}
        <div className="list-toolbar-actions">
          <Link to="/agenda/actividades" className="btn-secondary">
            Ver agenda
          </Link>
          <button type="button" className="btn-primary admin-list-create-btn" onClick={openCreate}>
            + Nueva actividad
          </button>
        </div>
      </div>

      {loading ? (
        <p className="calendar-hint">Cargando actividades…</p>
      ) : filtered.length === 0 ? (
        <p className="form-hint">No hay actividades para mostrar</p>
      ) : (
        <div className="products-grid activities-admin-grid">
          {filtered.map((activity) => (
            <article key={activity.id} className="product-card activity-admin-card">
              <div className="product-card-image-wrap">
                {activity.imageUrl ? (
                  <img src={activity.imageUrl} alt="" referrerPolicy="no-referrer" loading="lazy" />
                ) : (
                  <div className="product-card-placeholder">Sin imagen</div>
                )}
              </div>
              <div className="product-card-body">
                <h3>{activity.name}</h3>
                <p className="product-card-meta">{scheduleLabel(activity)}</p>
                {activity.locationName && (
                  <p className="product-card-meta">{activity.locationName}</p>
                )}
                {activity.description?.trim() && (
                  <p className="card-desc">{activity.description}</p>
                )}
                <div className="activity-admin-card-actions">
                  <button type="button" className="btn-secondary" onClick={() => openEdit(activity)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn-danger-outline"
                    onClick={() => setDeleteTarget(activity)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AdminFormModal
        title={editing ? 'Editar actividad' : 'Nueva actividad'}
        open={modalOpen}
        onClose={() => {
          if (!saving) {
            setModalOpen(false)
            setEditing(null)
          }
        }}
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
        saving={saving}
        submitLabel={editing ? 'Guardar cambios' : 'Crear actividad'}
      >
        <div className="form-group">
          <label htmlFor="activity-admin-name">Nombre</label>
          <input
            id="activity-admin-name"
            value={form.name}
            onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="activity-admin-description">Descripción</label>
          <textarea
            id="activity-admin-description"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label>Imagen</label>
          <p className="activity-promo-size-hint">
            Recomendado: <strong>1600 × 900 px</strong> (16:9)
          </p>
          <div className="activity-promo-upload-row">
            <label className="btn-secondary activity-promo-upload-btn">
              {uploading ? 'Subiendo…' : 'Subir imagen'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  e.target.value = ''
                  void uploadImage(file)
                }}
              />
            </label>
            {form.imageUrl && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setForm((current) => ({ ...current, imageUrl: '' }))}
              >
                Quitar imagen
              </button>
            )}
          </div>
          <div className="activity-promo-preview-frame">
            <div className="activity-promo-preview-frame-label">Vista previa</div>
            {form.imageUrl ? (
              <img
                className="activity-promo-admin-preview"
                src={form.imageUrl}
                alt=""
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="activity-promo-preview-empty">
                <span>Sin imagen</span>
                <small>1600 × 900 px</small>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="activity-admin-location">Ubicación</label>
          <input
            id="activity-admin-location"
            value={form.locationName}
            onChange={(e) => setForm((current) => ({ ...current, locationName: e.target.value }))}
            placeholder="Ej: Sala 1"
          />
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="activity-admin-start">Fecha inicio</label>
            <input
              id="activity-admin-start"
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  startDate: e.target.value,
                  endDate: current.recurring ? current.endDate : e.target.value,
                  repeatDays:
                    current.repeatDays.length === 0 && e.target.value
                      ? [weekdayFromDate(e.target.value)]
                      : current.repeatDays,
                }))
              }
              required
            />
          </div>
          {form.recurring && (
            <div className="form-group">
              <label htmlFor="activity-admin-end">Fecha fin</label>
              <input
                id="activity-admin-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((current) => ({ ...current, endDate: e.target.value }))}
                required
              />
            </div>
          )}
        </div>

        <div className="form-group">
          <HorizontalSwitch
            label="Actividad recurrente"
            checked={form.recurring}
            onChange={(recurring) =>
              setForm((current) => ({
                ...current,
                recurring,
                endDate: recurring ? current.endDate || current.startDate : current.startDate,
              }))
            }
          />
        </div>

        {form.recurring && (
          <div className="form-group">
            <label>Días</label>
            <div className="activity-weekday-picker">
              {WEEKDAY_OPTIONS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={form.repeatDays.includes(day.value) ? 'btn-primary' : 'btn-secondary'}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      repeatDays: current.repeatDays.includes(day.value)
                        ? current.repeatDays.filter((value) => value !== day.value)
                        : [...current.repeatDays, day.value],
                    }))
                  }
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-row-2">
          {!allDay && (
            <div className="form-group">
              <label htmlFor="activity-admin-time">Hora inicio</label>
              <input
                id="activity-admin-time"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((current) => ({ ...current, startTime: e.target.value }))}
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="activity-admin-duration">Duración</label>
            <select
              id="activity-admin-duration"
              value={form.durationPreset}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  durationPreset: e.target.value as ActivityDurationPresetId,
                }))
              }
            >
              {ACTIVITY_DURATION_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <HorizontalSwitch
            label="Cupo ilimitado"
            checked={form.unlimitedCapacity}
            onChange={(unlimitedCapacity) => setForm((current) => ({ ...current, unlimitedCapacity }))}
          />
        </div>
        {!form.unlimitedCapacity && (
          <div className="form-group">
            <label htmlFor="activity-admin-capacity">Cupo</label>
            <input
              id="activity-admin-capacity"
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm((current) => ({ ...current, capacity: e.target.value }))}
            />
          </div>
        )}
      </AdminFormModal>

      <ConfirmDialog
        open={deleteTarget != null}
        title="Eliminar actividad"
        message={
          deleteTarget
            ? `¿Eliminar «${deleteTarget.name}»? Se cancelarán sus reservaciones activas.`
            : ''
        }
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={() => void remove()}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}

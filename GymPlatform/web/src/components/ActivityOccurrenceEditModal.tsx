import { useMemo, useState } from 'react'
import { api, ApiError } from '../api'
import type { Activity, ActivityReservationImpact } from '../types'
import HorizontalSwitch from './HorizontalSwitch'
import ActivityCapacityDisplay from './ActivityCapacityDisplay'
import { useDateFormat } from '../preferences/useDateFormat'
import { useToast } from '../toast'
import {
  formatActivityScheduleSummary,
  isActivitySeries,
} from '../utils/activityCalendarUtils'
import {
  ACTIVITY_DURATION_PRESETS,
  durationLabelForSchedule,
  endTimeFromPreset,
  inferDurationPresetId,
  isAllDayPreset,
  type ActivityDurationPresetId,
} from '../utils/activityDurationUtils'
import { findActivityOverlap, formatActivityOverlapMessage } from '../utils/activityOverlapUtils'

type Scope = 'OCCURRENCE' | 'SERIES'
type PendingOperation = 'save' | 'cancel' | 'delete' | 'restore'

type ModalView =
  | { step: 'form' }
  | { step: 'cancelled' }
  | { step: 'scope'; action: PendingOperation }
  | {
      step: 'confirm'
      action: PendingOperation
      scope: Scope
      impact: ActivityReservationImpact | null
      message: string
    }

type Props = {
  activity: Activity
  allActivities: Activity[]
  onClose: () => void
  onSaved: () => void
}

function isReservationConfirmError(err: unknown): boolean {
  return err instanceof ApiError && err.message.toLowerCase().includes('reservaciones')
}

const SCOPE_TITLES: Record<PendingOperation, { title: string; question: string }> = {
  save: {
    title: 'Guardar cambios',
    question: 'Esta actividad forma parte de una serie. ¿Dónde desea aplicar los cambios?',
  },
  cancel: {
    title: 'Cancelar clase',
    question: 'Esta actividad forma parte de una serie. ¿Qué desea cancelar?',
  },
  delete: {
    title: 'Eliminar clase',
    question: 'Esta actividad forma parte de una serie. ¿Qué desea eliminar del calendario?',
  },
  restore: {
    title: 'Reactivar clase',
    question: 'Esta actividad forma parte de una serie. ¿Qué desea reactivar?',
  },
}

export default function ActivityOccurrenceEditModal({
  activity,
  allActivities,
  onClose,
  onSaved,
}: Props) {
  const { formatIsoDate } = useDateFormat()
  const { showSuccess, showApiError, showWarning } = useToast()
  const isCancelled = activity.occurrenceCancelled === true
  const [startTime, setStartTime] = useState(activity.startTime?.slice(0, 5) ?? '09:00')
  const [durationPreset, setDurationPreset] = useState<ActivityDurationPresetId>(
    inferDurationPresetId(activity.allDay, activity.startTime, activity.endTime),
  )
  const [locationName, setLocationName] = useState(activity.locationName ?? '')
  const [unlimitedCapacity, setUnlimitedCapacity] = useState(activity.capacity == null)
  const [capacity, setCapacity] = useState(activity.capacity != null ? String(activity.capacity) : '')
  const [view, setView] = useState<ModalView>(isCancelled ? { step: 'cancelled' } : { step: 'form' })
  const [saving, setSaving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const allDay = isAllDayPreset(durationPreset)
  const endTime = allDay ? null : endTimeFromPreset(startTime, durationPreset)
  const busy = saving || cancelling || deleting || restoring
  const isSeries = useMemo(
    () => isActivitySeries(activity, allActivities),
    [activity, allActivities],
  )
  const dateLabel = formatIsoDate(activity.activityDate)

  const durationLabel = useMemo(
    () => durationLabelForSchedule(allDay, startTime, endTime, durationPreset),
    [allDay, startTime, endTime, durationPreset],
  )

  const scheduleSummary = useMemo(
    () => formatActivityScheduleSummary(
      activity.activityDate,
      allDay,
      startTime,
      endTime,
      durationLabel,
    ),
    [activity.activityDate, allDay, startTime, endTime, durationLabel],
  )

  const buildPayload = (scope: Scope, confirmAffectedReservations = false) => ({
    occurrenceDate: activity.activityDate,
    startTime: allDay ? '00:00' : startTime,
    endTime: allDay ? '23:59' : endTime,
    locationName,
    capacity: unlimitedCapacity ? null : parseInt(capacity, 10) || null,
    scope: isSeries ? scope : 'SERIES',
    confirmAffectedReservations,
  })

  const buildSeriesPreviewPayload = () => ({
    name: activity.name,
    description: activity.description,
    startDate: activity.startDate,
    endDate: activity.endDate,
    startTime: allDay ? '00:00' : startTime,
    endTime: allDay ? '23:59' : endTime,
    locationName,
    instructorId: activity.instructorId,
    capacity: unlimitedCapacity ? null : parseInt(capacity, 10) || null,
    recurring: activity.recurring,
    repeatDays: activity.repeatDays,
    allDay,
  })

  const validateOverlap = (): boolean => {
    if (allDay) return true
    const overlap = findActivityOverlap(
      {
        activityDate: activity.activityDate,
        startTime,
        endTime: endTime ?? endTimeFromPreset(startTime, '60') ?? '10:00',
        allDay: false,
      },
      allActivities,
      { activityId: activity.id, date: activity.activityDate },
    )
    if (overlap) {
      showWarning(formatActivityOverlapMessage(overlap))
      return false
    }
    return true
  }

  const startScopedAction = (action: PendingOperation) => {
    if (action === 'delete' && isCancelled) {
      void beginDelete('OCCURRENCE')
      return
    }
    if (isSeries) {
      setView({ step: 'scope', action })
      return
    }
    if (action === 'save') void performSave('SERIES')
    else if (action === 'cancel') void beginCancel('SERIES')
    else if (action === 'delete') void beginDelete('SERIES')
    else void performRestore('SERIES')
  }

  const performSave = async (scope: Scope, confirmAffectedReservations = false) => {
    setSaving(true)
    try {
      await api.editActivityOccurrence(activity.id, buildPayload(scope, confirmAffectedReservations))
      showSuccess('Actividad actualizada')
      onSaved()
      onClose()
    } catch (err) {
      if (scope === 'SERIES' && !confirmAffectedReservations && isReservationConfirmError(err)) {
        try {
          const impact = await api.previewActivityUpdateImpact(activity.id, buildSeriesPreviewPayload())
          setView({
            step: 'confirm',
            action: 'save',
            scope,
            impact,
            message: `Este cambio afectará ${impact.affectedReservations} reservación(es) activa(s). ¿Cancelar esas reservaciones y guardar?`,
          })
        } catch (previewErr) {
          showApiError(previewErr, 'No se pudo verificar las reservaciones afectadas')
        }
      } else {
        showApiError(err, 'No se pudo guardar la actividad')
      }
    } finally {
      setSaving(false)
    }
  }

  const beginCancel = async (scope: Scope) => {
    try {
      const impact = await api.getActivityCancelImpact(activity.id, activity.activityDate, scope)
      const hasReservations = impact.affectedReservations > 0
      setView({
        step: 'confirm',
        action: 'cancel',
        scope,
        impact: hasReservations ? impact : null,
        message: hasReservations
          ? isSeries
            ? scope === 'SERIES'
              ? '¿Cancelar toda la serie? Tiene reservaciones activas y seguirá visible en el calendario como cancelada.'
              : `¿Cancelar solo la clase del ${dateLabel}? Tiene reservaciones activas y seguirá visible en el calendario como cancelada.`
            : '¿Estás seguro de cancelar esta actividad? Tiene reservaciones activas.'
          : isSeries
            ? scope === 'SERIES'
              ? '¿Cancelar toda la serie? Seguirá visible en el calendario como cancelada.'
              : `¿Cancelar solo la clase del ${dateLabel}? Seguirá visible en el calendario como cancelada.`
            : '¿Estás seguro de cancelar esta actividad?',
      })
    } catch (err) {
      showApiError(err, 'No se pudo preparar la cancelación')
    }
  }

  const beginDelete = async (scope: Scope) => {
    try {
      const impact = await api.getActivityCancelImpact(activity.id, activity.activityDate, scope)
      const hasReservations = impact.affectedReservations > 0
      setView({
        step: 'confirm',
        action: 'delete',
        scope,
        impact: hasReservations ? impact : null,
        message: hasReservations
          ? isSeries
            ? scope === 'SERIES'
              ? '¿Eliminar toda la serie del calendario? Tiene reservaciones activas y desaparecerá por completo.'
              : `¿Eliminar solo la clase del ${dateLabel}? Tiene reservaciones activas y desaparecerá del calendario.`
            : '¿Estás seguro de eliminar esta actividad? Tiene reservaciones activas.'
          : isSeries
            ? scope === 'SERIES'
              ? '¿Eliminar toda la serie del calendario? Desaparecerá por completo.'
              : `¿Eliminar solo la clase del ${dateLabel}? Desaparecerá del calendario.`
            : '¿Estás seguro de eliminar esta actividad?',
      })
    } catch (err) {
      showApiError(err, 'No se pudo preparar la eliminación')
    }
  }

  const performRestore = async (scope: Scope) => {
    setRestoring(true)
    try {
      await api.restoreActivityOccurrence(activity.id, {
        occurrenceDate: activity.activityDate,
        scope,
      })
      showSuccess('Actividad reactivada')
      onSaved()
      onClose()
    } catch (err) {
      showApiError(err, 'No se pudo reactivar la actividad')
    } finally {
      setRestoring(false)
    }
  }

  const performDelete = async (scope: Scope) => {
    setDeleting(true)
    try {
      await api.deleteActivityOccurrence(activity.id, {
        occurrenceDate: activity.activityDate,
        scope,
      })
      showSuccess('Actividad eliminada')
      onSaved()
      onClose()
    } catch (err) {
      showApiError(err, 'No se pudo eliminar la actividad')
    } finally {
      setDeleting(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateOverlap()) return
    startScopedAction('save')
  }

  const handleScopeChoose = (scope: Scope) => {
    if (view.step !== 'scope') return
    const { action } = view
    if (action === 'save') void performSave(scope)
    else if (action === 'cancel') void beginCancel(scope)
    else if (action === 'delete') void beginDelete(scope)
    else void performRestore(scope)
  }

  const handleConfirm = async () => {
    if (view.step !== 'confirm') return
    if (view.action === 'save') {
      await performSave(view.scope, true)
      return
    }
    if (view.action === 'cancel') {
      setCancelling(true)
      try {
        await api.cancelActivityOccurrence(activity.id, {
          occurrenceDate: activity.activityDate,
          scope: view.scope,
          cancelReservations: (view.impact?.affectedReservations ?? 0) > 0,
        })
        showSuccess('Actividad cancelada')
        onSaved()
        onClose()
      } catch (err) {
        showApiError(err, 'No se pudo cancelar la actividad')
      } finally {
        setCancelling(false)
      }
      return
    }
    if (view.action === 'delete') {
      await performDelete(view.scope)
      return
    }
    await performRestore(view.scope)
  }

  const handleDismiss = () => {
    if (view.step === 'form' || view.step === 'cancelled') onClose()
    else if (isCancelled) setView({ step: 'cancelled' })
    else setView({ step: 'form' })
  }

  const scopeAction = view.step === 'scope' ? view.action : null
  const confirmView = view.step === 'confirm' ? view : null
  const headerTitle = view.step === 'scope' && scopeAction
    ? SCOPE_TITLES[scopeAction].title
    : view.step === 'confirm' && confirmView
      ? confirmView.action === 'save'
        ? 'Confirmar cambios'
        : confirmView.action === 'cancel'
          ? 'Confirmar cancelación'
          : confirmView.action === 'delete'
            ? 'Confirmar eliminación'
            : 'Confirmar reactivación'
      : isCancelled
        ? `${activity.name} (cancelada)`
        : activity.name

  return (
    <div className="modal-overlay" onClick={handleDismiss} role="presentation">
      <div
        className="modal card modal--scrollable activity-edit-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-scroll-header">
          <div className="modal-header-row">
            <div className="activity-edit-modal-head">
              <h3>{headerTitle}</h3>
              {(view.step === 'form' || view.step === 'cancelled') && (
                <div className="activity-edit-modal-meta">
                  <p className="text-muted modal-subtitle">
                    {dateLabel}
                    {activity.hasOccurrenceOverride && (
                      <span className="badge badge-pending" style={{ marginLeft: '0.5rem' }}>Modificada</span>
                    )}
                    {activity.allDay && (
                      <span className="badge badge-confirmed" style={{ marginLeft: '0.5rem' }}>Todo el día</span>
                    )}
                    {isSeries && (
                      <span className="badge badge-recurring" style={{ marginLeft: '0.5rem' }}>Recurrente</span>
                    )}
                    {isCancelled && (
                      <span className="badge badge-pending" style={{ marginLeft: '0.5rem' }}>Cancelada</span>
                    )}
                  </p>
                  <span className="activity-edit-schedule">{scheduleSummary}</span>
                  <ActivityCapacityDisplay activity={activity} />
                </div>
              )}
            </div>
            <button type="button" className="btn-secondary btn-icon" onClick={handleDismiss} aria-label="Cerrar">✕</button>
          </div>
        </div>

        {view.step === 'cancelled' && (
          <div className="modal-scroll-form">
            <div className="modal-scroll-body">
              <p className="confirm-dialog-message">
                Esta clase está cancelada. Puedes reactivarla o eliminarla del calendario.
              </p>
            </div>
            <div className="modal-scroll-footer modal-footer-bar">
              <button type="button" className="btn-primary" disabled={busy} onClick={() => startScopedAction('restore')}>
                {restoring ? 'Reactivando…' : 'Reactivar'}
              </button>
              <button type="button" className="btn-secondary btn-danger-outline" disabled={busy} onClick={() => startScopedAction('delete')}>
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
              <div className="modal-footer-bar-actions">
                <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {view.step === 'form' && (
          <form className="modal-scroll-form" onSubmit={handleSubmit}>
            <div className="modal-scroll-body">
              {!activity.allDay && (
                <div className="form-group">
                  <label>Duración</label>
                  <div className="activity-duration-picker activity-duration-picker--compact">
                    {ACTIVITY_DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={durationPreset === preset.id ? 'btn-primary' : 'btn-secondary'}
                        onClick={() => setDurationPreset(preset.id)}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <p className="activity-edit-schedule activity-edit-schedule--field">{scheduleSummary}</p>
                </div>
              )}

              <div className={`activity-edit-modal-row${allDay ? ' activity-edit-modal-row--single' : ''}`}>
                {!allDay && (
                  <div className="form-group">
                    <label>Hora inicio</label>
                    <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                  </div>
                )}

                <div className="form-group">
                  <label>Ubicación</label>
                  <input value={locationName} onChange={(e) => setLocationName(e.target.value)} />
                </div>
              </div>

              <div className="form-group form-group--switch">
                <HorizontalSwitch
                  label="Cupos"
                  offLabel="Con límite"
                  onLabel="Ilimitados"
                  checked={unlimitedCapacity}
                  onChange={setUnlimitedCapacity}
                />
              </div>

              {!unlimitedCapacity && (
                <div className="form-group form-group--inline-capacity">
                  <label>Cupo máximo</label>
                  <input
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>

            <div className="modal-scroll-footer modal-footer-bar activity-edit-modal-footer">
              <button type="button" className="btn-secondary btn-danger-outline" disabled={busy} onClick={() => startScopedAction('cancel')}>
                {cancelling ? 'Cancelando…' : 'Cancelar clase'}
              </button>
              <button type="button" className="btn-secondary btn-danger-outline" disabled={busy} onClick={() => startScopedAction('delete')}>
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
              <div className="modal-footer-bar-actions">
                <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>Cerrar</button>
                <button type="submit" className="btn-primary" disabled={busy}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          </form>
        )}

        {view.step === 'scope' && scopeAction && (
          <div className="modal-scroll-form">
            <div className="modal-scroll-body">
              <p className="confirm-dialog-message">{SCOPE_TITLES[scopeAction].question}</p>
              <div className="availability-scope-actions">
                <button type="button" className="btn-secondary availability-scope-btn" onClick={() => handleScopeChoose('OCCURRENCE')}>
                  <span className="availability-scope-btn-title">Solo esta clase</span>
                  <span className="availability-scope-btn-meta">{dateLabel}</span>
                </button>
                <button
                  type="button"
                  className={`${scopeAction === 'restore' || scopeAction === 'save' ? 'btn-primary' : 'btn-danger'} availability-scope-btn`}
                  onClick={() => handleScopeChoose('SERIES')}
                >
                  <span className="availability-scope-btn-title">Toda la serie</span>
                  <span className="availability-scope-btn-meta">{activity.name}</span>
                </button>
              </div>
            </div>
            <div className="modal-scroll-footer modal-footer-bar">
              <div className="modal-footer-bar-actions" style={{ marginLeft: 'auto' }}>
                <button type="button" className="btn-secondary" onClick={() => setView(isCancelled ? { step: 'cancelled' } : { step: 'form' })}>
                  Volver
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmView && (
          <div className="modal-scroll-form">
            <div className="modal-scroll-body">
              <p className="confirm-dialog-message">{confirmView.message}</p>
              {(confirmView.impact?.items.length ?? 0) > 0 && confirmView.action === 'save' && (
                <ul className="confirm-dialog-list">
                  {confirmView.impact!.items.slice(0, 5).map((item) => (
                    <li key={item.reservationId}>
                      {item.occurrenceDate} — {item.memberName} ({item.status})
                    </li>
                  ))}
                  {confirmView.impact!.items.length > 5 && (
                    <li>… y {confirmView.impact!.items.length - 5} más</li>
                  )}
                </ul>
              )}
            </div>
            <div className="modal-scroll-footer modal-footer-bar">
              <div className="modal-footer-bar-actions" style={{ marginLeft: 'auto' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    if (confirmView.action === 'delete' && isCancelled) {
                      setView({ step: 'cancelled' })
                      return
                    }
                    if (isSeries) setView({ step: 'scope', action: confirmView.action })
                    else setView(isCancelled ? { step: 'cancelled' } : { step: 'form' })
                  }}
                  disabled={busy}
                >
                  Volver
                </button>
                <button type="button" className="btn-danger" onClick={handleConfirm} disabled={busy}>
                  {busy ? 'Procesando…' : confirmView.action === 'save' ? 'Sí, guardar' : confirmView.action === 'restore' ? 'Sí, reactivar' : 'Sí, confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

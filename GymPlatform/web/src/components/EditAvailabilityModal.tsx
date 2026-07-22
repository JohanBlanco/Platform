import { useMemo, useState, type FormEvent } from 'react'

import { api } from '../api'

import { useToast } from '../toast'

import { useDateFormat } from '../preferences/useDateFormat'

import type { AppointmentRequest, StaffAvailability } from '../types'

import {
  analyzeAvailabilityUpdateImpact,
  countDaysInRange,
} from '../utils/availabilityUtils'

import AvailabilityScheduleForm, {
  useAvailabilityScheduleSummary,
  type AvailabilityScheduleValues,
} from './AvailabilityScheduleForm'

export type AvailabilityEditScope = 'range' | 'day'

export type AvailabilityChangeEvent =
  | { action: 'save' }
  | { action: 'delete'; blockIds: number[]; cancelReserved?: boolean }

type Props = {
  block: StaffAvailability
  rangeBlocks: StaffAvailability[]
  editScope: AvailabilityEditScope
  appointments: AppointmentRequest[]
  openCount: number
  reservedCount: number
  onClose: () => void
  onChanged: (event: AvailabilityChangeEvent) => void | Promise<void>
}

type ConfirmAction = 'delete' | 'save-affected' | 'save-info' | null

export default function EditAvailabilityModal({
  block,
  rangeBlocks,
  editScope,
  appointments,
  openCount,
  reservedCount,
  onClose,
  onChanged,
}: Props) {
  const { formatIsoDate, formatDateRangeLabel } = useDateFormat()
  const { showApiError, showSuccess } = useToast()

  const activeBlocks = editScope === 'day' ? [block] : rangeBlocks
  const isSingleDay = editScope === 'day'

  const initialRangeStart = rangeBlocks[0]?.availabilityDate ?? block.availabilityDate
  const initialRangeEnd = rangeBlocks[rangeBlocks.length - 1]?.availabilityDate ?? block.availabilityDate
  const initialDuration = block.slotDurationMinutes ?? 30
  const initialStartTime = block.startTime.slice(0, 5)
  const initialEndTime = block.endTime.slice(0, 5)

  const [values, setValues] = useState<AvailabilityScheduleValues>({
    startDate: isSingleDay ? block.availabilityDate : initialRangeStart,
    endDate: isSingleDay ? '' : (initialRangeEnd !== initialRangeStart ? initialRangeEnd : ''),
    startTime: initialStartTime,
    endTime: initialEndTime,
    slotDurationMinutes: initialDuration,
  })
  const [loading, setLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)

  const summary = useAvailabilityScheduleSummary(values)
  const dayCount = useMemo(
    () => (isSingleDay ? 1 : countDaysInRange(values.startDate, values.endDate || undefined)),
    [isSingleDay, values.startDate, values.endDate],
  )

  const activeBlockIds = useMemo(() => activeBlocks.map((b) => b.id), [activeBlocks])

  const scheduleChanged = values.startTime !== initialStartTime
    || values.endTime !== initialEndTime
    || values.slotDurationMinutes !== initialDuration

  const updateImpact = useMemo(
    () => analyzeAvailabilityUpdateImpact(activeBlocks, appointments, {
      startTime: values.startTime,
      endTime: values.endTime,
      slotDurationMinutes: values.slotDurationMinutes,
    }),
    [activeBlocks, appointments, values.startTime, values.endTime, values.slotDurationMinutes],
  )

  const patchValues = (patch: Partial<AvailabilityScheduleValues>) => {
    setValues((prev) => ({ ...prev, ...patch }))
  }

  const saveChanges = async (cancelAffectedReserved = false) => {
    setLoading(true)
    try {
      if (isSingleDay) {
        await api.updateStaffAvailability(block.id, {
          startTime: values.startTime,
          endTime: values.endTime,
          slotDurationMinutes: values.slotDurationMinutes,
          cancelAffectedReserved: cancelAffectedReserved || undefined,
        })
        showSuccess('Disponibilidad actualizada')
      } else {
        const result = await api.updateStaffAvailabilityRange(block.id, {
          startDate: values.startDate,
          endDate: values.endDate.trim() || null,
          startTime: values.startTime,
          endTime: values.endTime,
          slotDurationMinutes: values.slotDurationMinutes,
          cancelAffectedReserved: cancelAffectedReserved || undefined,
        })
        showSuccess(
          result.daysAffected > 1
            ? `Disponibilidad actualizada en ${result.daysAffected} días`
            : 'Disponibilidad actualizada',
        )
      }
      await onChanged({ action: 'save' })
      onClose()
    } catch (err) {
      showApiError(err, 'No se pudo actualizar la disponibilidad')
    } finally {
      setLoading(false)
    }
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!summary.rangeValid) return

    if (updateImpact.affectedCount > 0) {
      setConfirmAction('save-affected')
      return
    }

    if (scheduleChanged && reservedCount > 0) {
      setConfirmAction('save-info')
      return
    }

    await saveChanges()
  }

  const runDelete = async (cancelReserved: boolean) => {
    setLoading(true)
    try {
      if (isSingleDay) {
        await api.deleteStaffAvailability(block.id, { cancelReserved })
        showSuccess('Disponibilidad eliminada')
        await onChanged({ action: 'delete', blockIds: [block.id], cancelReserved })
      } else {
        await api.deleteStaffAvailabilityRange(block.id, { cancelReserved })
        showSuccess(
          dayCount > 1
            ? `Disponibilidad eliminada (${dayCount} días)`
            : 'Disponibilidad eliminada',
        )
        await onChanged({ action: 'delete', blockIds: activeBlockIds, cancelReserved })
      }
      onClose()
    } catch (err) {
      showApiError(err, 'No se pudo eliminar la disponibilidad')
    } finally {
      setLoading(false)
    }
  }

  const scopeLabel = isSingleDay
    ? formatIsoDate(block.availabilityDate)
    : (dayCount > 1
      ? formatDateRangeLabel(values.startDate, values.endDate || undefined)
      : formatIsoDate(values.startDate))

  const modalTitle = isSingleDay
    ? `Modificar disponibilidad · ${formatIsoDate(block.availabilityDate)}`
    : (dayCount > 1 ? `Modificar rango · ${dayCount} días` : 'Modificar disponibilidad')

  if (confirmAction === 'delete') {
    const deleteTitle = isSingleDay
      ? 'Eliminar disponibilidad de este día'
      : (dayCount > 1 ? `Eliminar rango (${dayCount} días)` : 'Eliminar disponibilidad')

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal card availability-modal" onClick={(e) => e.stopPropagation()}>
          <h2>{deleteTitle}</h2>
          {reservedCount > 0 ? (
            <>
              <p className="confirm-dialog-message">
                ¿Eliminar la disponibilidad del {scopeLabel}?
                Hay {reservedCount} cita(s) reservada(s) en {isSingleDay ? 'este día' : 'este rango'}.
                ¿Qué desea hacer con ellas?
              </p>
              <div className="modal-actions availability-delete-actions">
                <button type="button" className="btn-secondary" onClick={() => setConfirmAction(null)} disabled={loading}>
                  Volver
                </button>
                <button type="button" className="btn-secondary" onClick={() => runDelete(false)} disabled={loading}>
                  {loading ? 'Procesando…' : 'Conservar citas'}
                </button>
                <button type="button" className="btn-danger" onClick={() => runDelete(true)} disabled={loading}>
                  {loading ? 'Procesando…' : 'Cancelar citas'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="confirm-dialog-message">
                ¿Eliminar la disponibilidad del {scopeLabel}?
                {!isSingleDay && dayCount > 1 && (
                  <> Se eliminarán {dayCount} días de disponibilidad.</>
                )}
              </p>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setConfirmAction(null)} disabled={loading}>
                  No
                </button>
                <button type="button" className="btn-danger" onClick={() => runDelete(false)} disabled={loading}>
                  {loading ? 'Procesando…' : 'Sí, eliminar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (confirmAction === 'save-affected') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal card availability-modal" onClick={(e) => e.stopPropagation()}>
          <h2>Citas incompatibles con el cambio</h2>
          <p className="confirm-dialog-message">
            {updateImpact.affectedCount} cita(s) reservada(s) no encajan en el nuevo horario o cuadrícula
            ({values.slotDurationMinutes} min). No se puede guardar dejándolas como están.
          </p>
          <ul className="confirm-dialog-list">
            <li>Las citas afectadas quedarían en un estado ambiguo en el calendario.</li>
            <li>Debe cancelarlas para aplicar el cambio, o revertir la modificación.</li>
            {openCount > 0 && (
              <li>Los {openCount} espacio(s) abierto(s) se regenerarán automáticamente al guardar.</li>
            )}
          </ul>
          <div className="modal-actions availability-delete-actions">
            <button type="button" className="btn-secondary" onClick={() => setConfirmAction(null)} disabled={loading}>
              Volver
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => saveChanges(true)}
              disabled={loading}
            >
              {loading ? 'Procesando…' : `Cancelar ${updateImpact.affectedCount} cita(s) y guardar`}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (confirmAction === 'save-info') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal card availability-modal" onClick={(e) => e.stopPropagation()}>
          <h2>Confirmar cambio de disponibilidad</h2>
          <p className="confirm-dialog-message">
            Hay {updateImpact.alignedCount} cita(s) reservada(s) compatible(s) con la nueva configuración
            {isSingleDay ? ' en este día' : ''}.
          </p>
          <ul className="confirm-dialog-list">
            <li>Los espacios abiertos se regenerarán con espacios de {values.slotDurationMinutes} min.</li>
            <li>Las citas compatibles conservan su horario.</li>
            {updateImpact.multiSlotCount > 0 && (
              <li>
                {updateImpact.multiSlotCount} cita(s) ocupan más de un espacio
                (p. ej. 30 min → 2 espacios de 15 min).
              </li>
            )}
            {updateImpact.multiSlotSummaries.slice(0, 3).map((item) => (
              <li key={`${item.memberName}-${item.durationMinutes}`}>
                {item.memberName}: {item.durationMinutes} min → {item.slotsSpanned} espacio(s) de {values.slotDurationMinutes} min
              </li>
            ))}
          </ul>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={() => setConfirmAction(null)} disabled={loading}>
              Cancelar
            </button>
            <button type="button" className="btn-primary" onClick={() => saveChanges()} disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card availability-modal" onClick={(e) => e.stopPropagation()}>
        <div className="availability-modal-header">
          <h2>{modalTitle}</h2>
          {(openCount > 0 || reservedCount > 0) && (
            <div className="availability-status-badges">
              {openCount > 0 && (
                <span className="availability-status-badge availability-status-badge--open">
                  {openCount} abierta{openCount === 1 ? '' : 's'}
                </span>
              )}
              {reservedCount > 0 && (
                <span className="availability-status-badge availability-status-badge--reserved">
                  {reservedCount} reservada{reservedCount === 1 ? '' : 's'}
                </span>
              )}
            </div>
          )}
        </div>

        <form onSubmit={submit} className="availability-form">
          <AvailabilityScheduleForm
            values={values}
            onChange={patchValues}
            singleDayMode={isSingleDay}
            singleDayLabel={formatIsoDate(block.availabilityDate)}
          />

          {scheduleChanged && reservedCount > 0 && updateImpact.affectedCount > 0 && (
            <p className="availability-duration-warning availability-duration-warning--error">
              {updateImpact.affectedCount} cita(s) reservada(s) incompatible(s). Al guardar deberá cancelarlas
              o revertir el cambio de horario/duración.
            </p>
          )}

          {scheduleChanged && reservedCount > 0 && updateImpact.affectedCount === 0 && updateImpact.multiSlotCount > 0 && (
            <p className="availability-duration-warning">
              {updateImpact.multiSlotCount} cita(s) de mayor duración ocuparán varios espacios de {values.slotDurationMinutes} min.
            </p>
          )}

          <div className="modal-actions availability-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button
              type="button"
              className="btn-danger availability-delete-btn"
              onClick={() => setConfirmAction('delete')}
              disabled={loading}
            >
              {isSingleDay ? 'Eliminar este día' : (dayCount > 1 ? 'Eliminar rango' : 'Eliminar disponibilidad')}
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !summary.rangeValid}>
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

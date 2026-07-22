import { useState } from 'react'

import type { AppointmentRequest } from '../types'

import { appointmentTypeLabel } from '../utils/appointmentUtils'

import { formatTimeRange } from '../utils/appointmentCalendarUtils'

type Props = {
  appointment: AppointmentRequest
  mode: 'staff' | 'member'
  intervalOpenCount?: number
  onClose: () => void
  onCancel?: () => void | Promise<void>
  onCancelAllInInterval?: () => void | Promise<void>
}

function isCancellable(appointment: AppointmentRequest, mode: 'staff' | 'member'): boolean {
  if (['CANCELLED', 'REJECTED', 'COMPLETED'].includes(appointment.status)) return false
  if (mode === 'staff') return true
  return appointment.status === 'SCHEDULED' || appointment.status === 'PENDING'
}

export default function AppointmentDetailModal({
  appointment,
  mode,
  intervalOpenCount = 0,
  onClose,
  onCancel,
  onCancelAllInInterval,
}: Props) {
  const [confirmAction, setConfirmAction] = useState<'single' | 'interval' | null>(null)
  const [loading, setLoading] = useState(false)

  const isOpen = appointment.status === 'OPEN'
  const canCancel = onCancel != null && isCancellable(appointment, mode)
  const canCancelAll = mode === 'staff'
    && onCancelAllInInterval != null
    && intervalOpenCount > 1

  const runConfirm = async () => {
    const action = confirmAction === 'interval' ? onCancelAllInInterval : onCancel
    if (!action) return
    setLoading(true)
    try {
      await action()
    } finally {
      setLoading(false)
      setConfirmAction(null)
    }
  }

  const cancelMessage = confirmAction === 'interval'
    ? `¿Cancelar las ${intervalOpenCount} citas disponibles de este intervalo?`
    : isOpen
      ? '¿Cancelar este espacio disponible?'
      : '¿Cancelar esta cita? Dejará de mostrarse en el calendario.'

  const cancelTitle = confirmAction === 'interval'
    ? 'Cancelar citas del intervalo'
    : isOpen
      ? 'Cancelar espacio'
      : 'Cancelar cita'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        {confirmAction ? (
          <>
            <h2>{cancelTitle}</h2>
            <p className="confirm-dialog-message">{cancelMessage}</p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setConfirmAction(null)}
                disabled={loading}
              >
                No
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={runConfirm}
                disabled={loading}
              >
                {loading ? 'Cancelando…' : 'Sí, cancelar'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>{isOpen ? 'Cita disponible' : appointmentTypeLabel(appointment.type)}</h2>

            <dl className="detail-list">
              {!isOpen && (
                <div><dt>Miembro</dt><dd>{appointment.memberName ?? '—'}</dd></div>
              )}
              {appointment.preferredStaffName && (
                <div><dt>Preferencia</dt><dd>{appointment.preferredStaffName}</dd></div>
              )}
              {appointment.assignedStaffName && (
                <div><dt>Atiende</dt><dd>{appointment.assignedStaffName}</dd></div>
              )}
              <div><dt>Horario</dt><dd>{formatTimeRange(appointment.scheduledStart, appointment.scheduledEnd)}</dd></div>
              {appointment.notes && <div><dt>Notas</dt><dd>{appointment.notes}</dd></div>}
            </dl>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button>
              {canCancel && (
                <button type="button" className="btn-danger" onClick={() => setConfirmAction('single')}>
                  {isOpen ? 'Cancelar espacio' : 'Cancelar cita'}
                </button>
              )}
              {canCancelAll && (
                <button type="button" className="btn-danger" onClick={() => setConfirmAction('interval')}>
                  Cancelar todas del intervalo ({intervalOpenCount})
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

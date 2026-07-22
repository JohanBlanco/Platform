import type { ActivityReservationImpact } from '../types'

type Props = {
  title: string
  message: string
  impact?: ActivityReservationImpact | null
  confirmLabel: string
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

export default function ActivityReservationConfirmModal({
  title,
  message,
  impact,
  confirmLabel,
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  const items = impact?.items ?? []

  return (
    <div className="modal-overlay confirm-dialog-overlay" onClick={onClose} role="presentation">
      <div
        className="modal card availability-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2>{title}</h2>
        <p className="confirm-dialog-message">{message}</p>
        {items.length > 0 && (
          <ul className="confirm-dialog-list">
            {items.slice(0, 5).map((item) => (
              <li key={item.reservationId}>
                {item.occurrenceDate} — {item.memberName} ({item.status})
              </li>
            ))}
            {items.length > 5 && (
              <li>… y {items.length - 5} más</li>
            )}
          </ul>
        )}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            No
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

import { formatTimeRangeLabel } from '../utils/dateFormat'

type Props = {
  startTime: string
  endTime: string
  onClose: () => void
  onCreate: () => void
  onBlock: () => void
  blocking?: boolean
}

export default function AvailabilitySlotActionModal({
  startTime,
  endTime,
  onClose,
  onCreate,
  onBlock,
  blocking = false,
}: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card availability-slot-action-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Espacio disponible</h2>
        <p className="text-muted availability-slot-action-time">
          {formatTimeRangeLabel(startTime, endTime)}
        </p>
        <p className="availability-slot-action-prompt">¿Qué deseas hacer con este horario?</p>
        <div className="availability-slot-action-options">
          <button
            type="button"
            className="availability-slot-action-btn availability-slot-action-btn--create"
            onClick={onCreate}
            disabled={blocking}
          >
            <span className="availability-slot-action-btn-title">Crear cita</span>
            <span className="availability-slot-action-btn-desc">Agendar con un miembro</span>
          </button>
          <button
            type="button"
            className="availability-slot-action-btn availability-slot-action-btn--block"
            onClick={onBlock}
            disabled={blocking}
          >
            <span className="availability-slot-action-btn-title">No disponible</span>
            <span className="availability-slot-action-btn-desc">Bloquear este espacio en el calendario</span>
          </button>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={blocking}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

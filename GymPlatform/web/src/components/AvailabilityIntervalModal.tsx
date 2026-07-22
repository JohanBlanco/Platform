import type { StaffAvailability } from '../types'
import { useDateFormat } from '../preferences/useDateFormat'
import { formatTimeShort } from '../utils/availabilityUtils'

type Props = {
  block: StaffAvailability
  openCount: number
  onClose: () => void
  onCancelAll: () => void
}

export default function AvailabilityIntervalModal({ block, openCount, onClose, onCancelAll }: Props) {
  const { formatIsoDate } = useDateFormat()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h2>Intervalo de disponibilidad</h2>
        <dl className="detail-list">
          <div><dt>Fecha</dt><dd>{formatIsoDate(block.availabilityDate)}</dd></div>
          <div>
            <dt>Horario</dt>
            <dd>{formatTimeShort(block.startTime)} – {formatTimeShort(block.endTime)}</dd>
          </div>
          <div><dt>Citas disponibles</dt><dd>{openCount}</dd></div>
        </dl>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button>
          {openCount > 0 && (
            <button type="button" className="btn-danger" onClick={onCancelAll}>
              Cancelar todas las citas del intervalo ({openCount})
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

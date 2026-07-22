import { useDateFormat } from '../preferences/useDateFormat'

import type { StaffAvailability } from '../types'

type Props = {
  block: StaffAvailability
  rangeBlocks: StaffAvailability[]
  onChoose: (scope: 'range' | 'day') => void
  onClose: () => void
}

export default function AvailabilityEditScopeModal({
  block,
  rangeBlocks,
  onChoose,
  onClose,
}: Props) {
  const { formatIsoDate, formatDateRangeLabel } = useDateFormat()

  const rangeStart = rangeBlocks[0]?.availabilityDate ?? block.availabilityDate
  const rangeEnd = rangeBlocks[rangeBlocks.length - 1]?.availabilityDate ?? block.availabilityDate
  const rangeLabel = formatDateRangeLabel(rangeStart, rangeEnd)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card availability-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Modificar disponibilidad</h2>
        <p className="confirm-dialog-message">
          Este día forma parte de un rango de {rangeBlocks.length} días ({rangeLabel}).
          ¿Qué desea modificar?
        </p>
        <div className="availability-scope-actions">
          <button
            type="button"
            className="btn-secondary availability-scope-btn"
            onClick={() => onChoose('day')}
          >
            <span className="availability-scope-btn-title">Solo este día</span>
            <span className="availability-scope-btn-meta">{formatIsoDate(block.availabilityDate)}</span>
          </button>
          <button
            type="button"
            className="btn-primary availability-scope-btn"
            onClick={() => onChoose('range')}
          >
            <span className="availability-scope-btn-title">Todo el rango</span>
            <span className="availability-scope-btn-meta">{rangeBlocks.length} días · {rangeLabel}</span>
          </button>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

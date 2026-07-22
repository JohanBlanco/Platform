import { useDateFormat } from '../preferences/useDateFormat'
import type { Activity } from '../types'

type Scope = 'OCCURRENCE' | 'SERIES'

type Props = {
  activity: Activity
  action: 'save' | 'cancel'
  onChoose: (scope: Scope) => void
  onClose: () => void
}

export default function ActivityActionScopeModal({
  activity,
  action,
  onChoose,
  onClose,
}: Props) {
  const { formatIsoDate } = useDateFormat()
  const dateLabel = formatIsoDate(activity.activityDate)
  const isSave = action === 'save'

  return (
    <div className="modal-overlay confirm-dialog-overlay" onClick={onClose} role="presentation">
      <div
        className="modal card availability-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2>{isSave ? 'Guardar cambios' : 'Cancelar clase'}</h2>
        <p className="confirm-dialog-message">
          {isSave
            ? 'Esta actividad forma parte de una serie recurrente. ¿Dónde desea aplicar los cambios?'
            : 'Esta actividad forma parte de una serie recurrente. ¿Qué desea cancelar?'}
        </p>
        <div className="availability-scope-actions">
          <button
            type="button"
            className="btn-secondary availability-scope-btn"
            onClick={() => onChoose('OCCURRENCE')}
          >
            <span className="availability-scope-btn-title">Solo esta clase</span>
            <span className="availability-scope-btn-meta">{dateLabel}</span>
          </button>
          <button
            type="button"
            className={`${isSave ? 'btn-primary' : 'btn-danger'} availability-scope-btn`}
            onClick={() => onChoose('SERIES')}
          >
            <span className="availability-scope-btn-title">Toda la serie</span>
            <span className="availability-scope-btn-meta">{activity.name}</span>
          </button>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Volver</button>
        </div>
      </div>
    </div>
  )
}

import type { FormEvent, ReactNode } from 'react'

type Props = {
  title: string
  open: boolean
  onClose: () => void
  onSubmit: (e: FormEvent) => void
  saving?: boolean
  submitLabel: string
  submitDisabled?: boolean
  children: ReactNode
  footerExtra?: ReactNode
  intro?: ReactNode
  className?: string
}

export default function AdminFormModal({
  title,
  open,
  onClose,
  onSubmit,
  saving = false,
  submitLabel,
  submitDisabled = false,
  children,
  footerExtra,
  intro,
  className,
}: Props) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`modal card admin-form-modal${className ? ` ${className}` : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-form-modal-title"
      >
        <div className="admin-form-modal-header">
          <h3 id="admin-form-modal-title">{title}</h3>
          <button
            type="button"
            className="modal-icon-close"
            onClick={onClose}
            disabled={saving}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        {intro}
        <form onSubmit={onSubmit}>
          {children}
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving || submitDisabled}>
              {saving ? 'Guardando...' : submitLabel}
            </button>
          </div>
          {footerExtra}
        </form>
      </div>
    </div>
  )
}

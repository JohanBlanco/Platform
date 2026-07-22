import { useEffect, useId, useRef, useState } from 'react'
import type { BroadcastMessageTemplate, MembershipPackage } from '../types'
import HorizontalSwitch from './HorizontalSwitch'
import {
  hasWhatsAppOutboundSelection,
  summarizeWhatsAppOutbound,
  type WhatsAppOutboundSelection,
} from '../utils/whatsappOutbound'

type Props = {
  templates: BroadcastMessageTemplate[]
  packages?: MembershipPackage[]
  value: WhatsAppOutboundSelection
  onChange: (value: WhatsAppOutboundSelection) => void
  disabled?: boolean
  label?: string
  hint?: string
  /** Id del plan para destacar plantillas de bienvenida asociadas */
  membershipPackageId?: string | number | null
}

export default function WhatsAppOutboundPicker({
  templates,
  packages = [],
  value,
  onChange,
  disabled = false,
  label = 'Mensajes de WhatsApp',
  hint,
  membershipPackageId,
}: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const packageLabel = (template: BroadcastMessageTemplate) => (
    template.membershipPackageName
      ?? packages.find((p) => p.id === template.membershipPackageId)?.name
      ?? null
  )

  const pkgIdNum =
    membershipPackageId === '' || membershipPackageId == null
      ? null
      : Number(membershipPackageId)

  const sortedTemplates = [...templates].sort((a, b) => {
    const aWelcome = a.purpose === 'WELCOME' ? 0 : 1
    const bWelcome = b.purpose === 'WELCOME' ? 0 : 1
    if (aWelcome !== bWelcome) return aWelcome - bWelcome
    const aMatch = pkgIdNum != null && a.membershipPackageId === pkgIdNum ? 0 : 1
    const bMatch = pkgIdNum != null && b.membershipPackageId === pkgIdNum ? 0 : 1
    if (aMatch !== bMatch) return aMatch - bMatch
    return a.name.localeCompare(b.name, 'es')
  })

  const summary = summarizeWhatsAppOutbound(value, templates)
  const selected = hasWhatsAppOutboundSelection(value)

  return (
    <div className={`wa-outbound-picker${disabled ? ' is-disabled' : ''}`} ref={rootRef}>
      <span className="wa-outbound-picker-label" id={`${listId}-label`}>
        {label}
      </span>
      <button
        type="button"
        className={`wa-outbound-picker-trigger${open ? ' is-open' : ''}${selected ? ' has-selection' : ''}`}
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${listId}-label`}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="wa-outbound-picker-summary">{summary}</span>
        <span className="wa-outbound-picker-chevron" aria-hidden="true">▾</span>
      </button>
      {open && !disabled && (
        <div className="wa-outbound-picker-menu" id={listId} role="group" aria-labelledby={`${listId}-label`}>
          <div className="wa-outbound-picker-row">
            <div className="wa-outbound-picker-row-text">
              <strong>Formulario de registro</strong>
              <span className="text-muted">Enlace para completar el alta del miembro</span>
            </div>
            <HorizontalSwitch
              compact
              label="Formulario de registro"
              checked={value.sendRegistrationForm}
              onChange={(checked) => onChange({ ...value, sendRegistrationForm: checked })}
            />
          </div>
          {sortedTemplates.length > 0 ? (
            sortedTemplates.map((template) => {
              const pkgLabel = packageLabel(template)
              const checked = value.templateIds.includes(template.id)
              const matchesPlan =
                pkgIdNum != null && template.membershipPackageId === pkgIdNum && template.purpose === 'WELCOME'
              return (
                <div
                  key={template.id}
                  className={`wa-outbound-picker-row${matchesPlan ? ' is-plan-default' : ''}`}
                >
                  <div className="wa-outbound-picker-row-text">
                    <strong>
                      {template.name}
                      {template.purpose === 'WELCOME' && (
                        <span className="badge badge-recurring" style={{ marginLeft: '0.35rem' }}>
                          Bienvenida
                        </span>
                      )}
                      {pkgLabel && (
                        <span className="badge badge-active" style={{ marginLeft: '0.35rem' }}>
                          {pkgLabel}
                        </span>
                      )}
                    </strong>
                    {matchesPlan && (
                      <span className="text-muted">Sugerida para el plan seleccionado</span>
                    )}
                  </div>
                  <HorizontalSwitch
                    compact
                    label={template.name}
                    checked={checked}
                    onChange={(next) => {
                      onChange({
                        ...value,
                        templateIds: next
                          ? [...value.templateIds, template.id]
                          : value.templateIds.filter((id) => id !== template.id),
                      })
                    }}
                  />
                </div>
              )
            })
          ) : (
            <p className="wa-outbound-picker-empty text-muted">
              No hay plantillas. Créalas en Configuración → WhatsApp → Mensajes de difusión.
            </p>
          )}
        </div>
      )}
      {hint && <p className="form-hint" style={{ marginTop: '0.35rem' }}>{hint}</p>}
    </div>
  )
}

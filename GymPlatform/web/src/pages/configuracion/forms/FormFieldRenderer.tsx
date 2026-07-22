import SignaturePad from '../../../components/SignaturePad'
import type { FormField, FormFieldType } from '../../../types'

/** Opciones tipo "12:Mensual" muestran solo la etiqueta. */
function formatOptionLabel(option: string): string {
  const colon = option.indexOf(':')
  if (colon > 0 && /^\d+$/.test(option.slice(0, colon))) {
    return option.slice(colon + 1)
  }
  return option
}

type Props = {
  field: FormField
  preview?: boolean
  value?: string | boolean
  onChange?: (value: string | boolean) => void
  enforceRequired?: boolean
}

export default function FormFieldRenderer({
  field,
  preview = false,
  value,
  onChange,
  enforceRequired = true,
}: Props) {
  if (field.type === 'HEADING') {
    return <h3 className="public-form-heading">{field.label}</h3>
  }

  const inputId = `field-${field.id}`
  const isRequired = field.required && enforceRequired && !preview

  if (field.type === 'SIGNATURE') {
    return (
      <div className={`form-group${preview ? ' form-group--preview' : ''}`}>
        <label htmlFor={inputId}>
          {field.label}
          {isRequired && <span className="required-mark"> *</span>}
        </label>
        <SignaturePad
          value={typeof value === 'string' ? value : ''}
          onChange={(next) => onChange?.(next)}
          disabled={preview}
        />
        {field.helpText && <p className="form-hint">{field.helpText}</p>}
      </div>
    )
  }

  return (
    <div className={`form-group${preview ? ' form-group--preview' : ''}`}>
      <label htmlFor={inputId}>
        {field.label}
        {isRequired && <span className="required-mark"> *</span>}
      </label>
      {renderControl(field, inputId, preview, isRequired, value, onChange)}
      {field.helpText && <p className="form-hint">{field.helpText}</p>}
    </div>
  )
}

function renderControl(
  field: FormField,
  inputId: string,
  preview: boolean,
  required: boolean,
  value: string | boolean | undefined,
  onChange: ((value: string | boolean) => void) | undefined,
) {
  const disabled = preview
  const common = {
    id: inputId,
    disabled,
    required,
    placeholder: field.placeholder ?? undefined,
  }

  switch (field.type as FormFieldType) {
    case 'TEXTAREA':
      return (
        <textarea
          {...common}
          rows={4}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )
    case 'SELECT':
      return (
        <select
          {...common}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange?.(e.target.value)}
        >
          <option value="" disabled>Seleccionar…</option>
          {field.options.map((option) => (
            <option key={option} value={option}>{formatOptionLabel(option)}</option>
          ))}
        </select>
      )
    case 'RADIO':
      return (
        <div className="form-radio-group">
          {field.options.map((option) => (
            <label key={option} className="form-radio-option">
              <input
                type="radio"
                name={inputId}
                value={option}
                disabled={disabled}
                checked={value === option}
                onChange={() => onChange?.(option)}
              />
              <span>{formatOptionLabel(option)}</span>
            </label>
          ))}
        </div>
      )
    case 'CHECKBOX':
      return (
        <label className="form-checkbox-option">
          <input
            type="checkbox"
            id={inputId}
            disabled={disabled}
            checked={Boolean(value)}
            onChange={(e) => onChange?.(e.target.checked)}
          />
          <span>{field.placeholder || field.label}</span>
        </label>
      )
    case 'DATE':
      return (
        <input
          {...common}
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )
    case 'EMAIL':
      return (
        <input
          {...common}
          type="email"
          autoComplete="email"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )
    case 'PHONE':
      return (
        <input
          {...common}
          type="tel"
          inputMode="tel"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )
    case 'NUMBER':
      return (
        <input
          {...common}
          type="number"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )
    default:
      return (
        <input
          {...common}
          type={field.id === 'u-password' ? 'password' : 'text'}
          autoComplete={field.id === 'u-password' ? 'new-password' : undefined}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange?.(e.target.value)}
        />
      )
  }
}

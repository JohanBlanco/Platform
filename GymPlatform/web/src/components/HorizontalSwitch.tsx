type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  offLabel?: string
  onLabel?: string
  compact?: boolean
  disabled?: boolean
  id?: string
}

export default function HorizontalSwitch({
  checked,
  onChange,
  label,
  offLabel,
  onLabel,
  compact = false,
  disabled = false,
  id,
}: Props) {
  const switchId = id ?? `switch-${label.replace(/\s+/g, '-').toLowerCase()}`
  const showSideLabels = !compact && offLabel != null && onLabel != null

  if (compact) {
    return (
      <button
        type="button"
        role="switch"
        id={switchId}
        className={`horizontal-switch${checked ? ' is-on' : ''}`}
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
      >
        <span className="horizontal-switch-track" aria-hidden="true">
          <span className="horizontal-switch-thumb" />
        </span>
      </button>
    )
  }

  return (
    <div className={`horizontal-switch-field${compact ? ' horizontal-switch-field--compact' : ''}`}>
      <span className="horizontal-switch-label" id={`${switchId}-label`}>
        {label}
      </span>
      <div
        className={`horizontal-switch-control${showSideLabels ? ' horizontal-switch-control--labeled' : ''}`}
        role="group"
        aria-labelledby={`${switchId}-label`}
      >
        {showSideLabels && (
          <span className={`horizontal-switch-side${!checked ? ' is-active' : ''}`}>{offLabel}</span>
        )}
        <button
          type="button"
          role="switch"
          id={switchId}
          className={`horizontal-switch${checked ? ' is-on' : ''}`}
          aria-checked={checked}
          aria-labelledby={`${switchId}-label`}
          disabled={disabled}
          onClick={() => onChange(!checked)}
        >
          <span className="horizontal-switch-track" aria-hidden="true">
            <span className="horizontal-switch-thumb" />
          </span>
        </button>
        {showSideLabels && (
          <span className={`horizontal-switch-side${checked ? ' is-active' : ''}`}>{onLabel}</span>
        )}
      </div>
    </div>
  )
}

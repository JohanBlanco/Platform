import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react'

export type TagOption<T extends string | number = string | number> = {
  value: T
  label: string
  hint?: string
}

type SuggestionItem<T extends string | number> =
  | { type: 'existing'; option: TagOption<T> }
  | { type: 'create'; name: string }

type Props<T extends string | number> = {
  options: TagOption<T>[]
  value: T[]
  onChange: (value: T[]) => void
  placeholder?: string
  disabled?: boolean
  maxSuggestions?: number
  /** Si se provee, Enter/crear agrega una opción nueva. */
  onCreate?: (name: string) => Promise<TagOption<T>> | TagOption<T>
  createLabel?: (name: string) => ReactNode
  /** Filtrado custom; por defecto matchea label/hint. */
  filterOption?: (option: TagOption<T>, query: string) => boolean
  /** Alternativa a options+filter: control total de sugerencias. */
  getSuggestions?: (query: string, selected: T[]) => TagOption<T>[]
  noResultsMessage?: string
  creatingMessage?: string
}

function defaultFilter<T extends string | number>(option: TagOption<T>, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    option.label.toLowerCase().includes(q)
    || (option.hint?.toLowerCase().includes(q) ?? false)
  )
}

export default function TagMultiSelect<T extends string | number>({
  options,
  value,
  onChange,
  placeholder = 'Escribe y pulsa Enter…',
  disabled = false,
  maxSuggestions = 8,
  onCreate,
  createLabel = (name) => (
    <>
      Crear <strong>«{name}»</strong>
    </>
  ),
  filterOption = defaultFilter,
  getSuggestions,
  noResultsMessage = 'Sin coincidencias',
  creatingMessage = 'Creando…',
}: Props<T>) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const [creating, setCreating] = useState(false)

  const selected = useMemo(() => {
    const byValue = new Map(options.map((o) => [o.value, o]))
    return value
      .map((v) => byValue.get(v))
      .filter((o): o is TagOption<T> => o != null)
  }, [options, value])

  const suggestions = useMemo((): SuggestionItem<T>[] => {
    const matched = getSuggestions
      ? getSuggestions(query, value)
      : options
        .filter((o) => !value.includes(o.value))
        .filter((o) => filterOption(o, query))
        .slice(0, maxSuggestions)

    const items: SuggestionItem<T>[] = matched.map((option) => ({ type: 'existing', option }))
    const trimmed = query.trim()
    if (onCreate && trimmed) {
      const exactExists = options.some(
        (o) => o.label.toLowerCase() === trimmed.toLowerCase(),
      )
      if (!exactExists) {
        items.push({ type: 'create', name: trimmed })
      }
    }
    return items
  }, [options, value, query, maxSuggestions, filterOption, getSuggestions, onCreate])

  useEffect(() => {
    setHighlight(0)
  }, [query, open])

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const addValue = (next: T) => {
    if (!value.includes(next)) onChange([...value, next])
    setQuery('')
    setOpen(true)
    inputRef.current?.focus()
  }

  const remove = (id: T) => {
    onChange(value.filter((v) => v !== id))
    inputRef.current?.focus()
  }

  const commitCreate = async (name: string) => {
    if (!onCreate || creating) return
    const trimmed = name.trim()
    if (!trimmed) return
    const existing = options.find((o) => o.label.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      addValue(existing.value)
      return
    }
    setCreating(true)
    try {
      const created = await onCreate(trimmed)
      if (!value.includes(created.value)) onChange([...value, created.value])
      setQuery('')
      setOpen(true)
      inputRef.current?.focus()
    } catch {
      // el padre muestra el error
    } finally {
      setCreating(false)
    }
  }

  const commitHighlighted = async () => {
    if (suggestions.length === 0) return
    const item = suggestions[Math.min(highlight, suggestions.length - 1)]
    if (item.type === 'existing') addValue(item.option.value)
    else await commitCreate(item.name)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && query === '' && value.length > 0) {
      e.preventDefault()
      onChange(value.slice(0, -1))
      return
    }
    if (e.key === 'Escape') {
      setOpen(false)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => (suggestions.length === 0 ? 0 : (h + 1) % suggestions.length))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) =>
        suggestions.length === 0 ? 0 : (h - 1 + suggestions.length) % suggestions.length,
      )
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!query.trim() || suggestions.length === 0) return
      void commitHighlighted()
    }
  }

  return (
    <div className="tag-multi-select" ref={rootRef}>
      <div
        className={`tag-multi-select-box${disabled ? ' is-disabled' : ''}`}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus()
            setOpen(true)
          }
        }}
      >
        {selected.map((o) => (
          <span key={String(o.value)} className="tag-multi-chip">
            {o.label}
            <button
              type="button"
              className="tag-multi-chip-remove"
              aria-label={`Quitar ${o.label}`}
              disabled={disabled || creating}
              onClick={(e) => {
                e.stopPropagation()
                remove(o.value)
              }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="tag-multi-select-field"
          value={query}
          disabled={disabled || creating}
          placeholder={selected.length === 0 ? placeholder : ''}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </div>

      {open && !disabled && suggestions.length > 0 && (
        <ul className="tag-multi-suggestions" role="listbox" id={listId}>
          {suggestions.map((item, index) => {
            const key = item.type === 'existing'
              ? `e-${String(item.option.value)}`
              : `c-${item.name}`
            const active = index === highlight
            return (
              <li key={key} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`tag-multi-suggestion${active ? ' is-active' : ''}${
                    item.type === 'create' ? ' is-create' : ''
                  }`}
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (item.type === 'existing') addValue(item.option.value)
                    else void commitCreate(item.name)
                  }}
                >
                  {item.type === 'existing' ? (
                    <span className="tag-multi-suggestion-text">
                      <span className="tag-multi-suggestion-label">{item.option.label}</span>
                      {item.option.hint && (
                        <span className="tag-multi-suggestion-hint">{item.option.hint}</span>
                      )}
                    </span>
                  ) : (
                    createLabel(item.name)
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {open && !disabled && query.trim() && suggestions.length === 0 && (
        <p className="tag-multi-empty">{noResultsMessage}</p>
      )}
      {creating && <small className="form-hint">{creatingMessage}</small>}
    </div>
  )
}

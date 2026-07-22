import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { User } from '../types'
import {
  filterUsers,
  findUserById,
  formatUserHint,
  userFullName,
  type UserSearchMode,
} from '../utils/userSearch'

type Props = {
  users: User[]
  value: number | ''
  onChange: (userId: number | '') => void
  mode?: UserSearchMode
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  emptyQueryMessage?: string
  noResultsMessage?: string
}

export default function UserSearchSelect({
  users,
  value,
  onChange,
  mode = 'staff',
  label = 'Usuario',
  placeholder,
  required = false,
  disabled = false,
  emptyQueryMessage,
  noResultsMessage,
}: Props) {
  const inputId = useId()
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const defaultPlaceholder = mode === 'member'
    ? 'Escribe un miembro y pulsa Enter…'
    : 'Escribe un instructor y pulsa Enter…'

  const defaultEmptyMessage = mode === 'member'
    ? 'Escribe para buscar miembros'
    : 'Escribe para buscar instructores'

  const defaultNoResultsMessage = mode === 'member'
    ? 'Ningún miembro coincide con la búsqueda'
    : 'Ningún instructor coincide con la búsqueda'

  const selected = useMemo(() => findUserById(users, value), [users, value])
  const suggestions = useMemo(
    () => filterUsers(
      users.filter((u) => u.id !== value),
      query,
      mode,
      8,
    ),
    [users, query, mode, value],
  )

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    setHighlight(0)
  }, [query, open])

  const pickUser = (user: User) => {
    onChange(user.id)
    setQuery('')
    setOpen(false)
  }

  const clearSelection = () => {
    onChange('')
    setQuery('')
    setOpen(true)
    inputRef.current?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && query === '' && selected) {
      event.preventDefault()
      clearSelection()
      return
    }
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setHighlight((h) => (suggestions.length === 0 ? 0 : (h + 1) % suggestions.length))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      setHighlight((h) =>
        suggestions.length === 0 ? 0 : (h - 1 + suggestions.length) % suggestions.length,
      )
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      if (!query.trim() || suggestions.length === 0) return
      pickUser(suggestions[Math.min(highlight, suggestions.length - 1)])
    }
  }

  return (
    <div className="form-group tag-multi-select user-search" ref={rootRef}>
      <label htmlFor={inputId}>{label}</label>
      <div
        className={`tag-multi-select-box${disabled ? ' is-disabled' : ''}`}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus()
            setOpen(true)
          }
        }}
      >
        {selected && (
          <span className="tag-multi-chip">
            {userFullName(selected)}
            {!disabled && (
              <button
                type="button"
                className="tag-multi-chip-remove"
                aria-label="Quitar selección"
                onClick={(e) => {
                  e.stopPropagation()
                  clearSelection()
                }}
              >
                ×
              </button>
            )}
          </span>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          className="tag-multi-select-field"
          value={query}
          placeholder={selected ? '' : (placeholder ?? defaultPlaceholder)}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-required={required}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </div>

      {open && !disabled && (
        suggestions.length > 0 ? (
          <ul className="tag-multi-suggestions" role="listbox" id={listId}>
            {suggestions.map((user, index) => (
              <li key={user.id} role="option" aria-selected={index === highlight}>
                <button
                  type="button"
                  className={`tag-multi-suggestion${index === highlight ? ' is-active' : ''}`}
                  onMouseEnter={() => setHighlight(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pickUser(user)}
                >
                  <span className="tag-multi-suggestion-text">
                    <span className="tag-multi-suggestion-label">{userFullName(user)}</span>
                    <span className="tag-multi-suggestion-hint">{formatUserHint(user, mode)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="tag-multi-empty">
            {query.trim()
              ? (noResultsMessage ?? defaultNoResultsMessage)
              : (emptyQueryMessage ?? defaultEmptyMessage)}
          </p>
        )
      )}
    </div>
  )
}

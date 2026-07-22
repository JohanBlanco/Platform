import type { RefObject } from 'react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

export type VariableSuggestion = {
  token: string
  label: string
  description: string
}

type Props = {
  textareaRef: RefObject<HTMLTextAreaElement | null>
  value: string
  suggestions: VariableSuggestion[]
  onInsert: (token: string, rangeStart: number, rangeEnd: number) => void
}

/** Detecta `{{consulta` abierto antes del cursor (sin `}}` cerrado). */
export function getOpenVariableQuery(
  text: string,
  caret: number,
): { start: number; query: string } | null {
  const before = text.slice(0, caret)
  const match = before.match(/\{\{([a-zA-Z0-9:_-]*)$/)
  if (!match) return null
  return { start: caret - match[0].length, query: match[1] ?? '' }
}

/**
 * Autocompletado al escribir {{…}} en el textarea del mensaje.
 */
export default function WhatsAppVariableAutocomplete({
  textareaRef,
  value,
  suggestions,
  onInsert,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [range, setRange] = useState<{ start: number; end: number } | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    if (!q) return suggestions
    return suggestions.filter(
      (s) =>
        s.label.toLowerCase().includes(q)
        || s.token.toLowerCase().includes(q)
        || s.description.toLowerCase().includes(q),
    )
  }, [suggestions, query])

  const refresh = () => {
    const el = textareaRef.current
    if (!el) {
      setOpen(false)
      return
    }
    const caret = el.selectionStart ?? 0
    const found = getOpenVariableQuery(value, caret)
    if (!found) {
      setOpen(false)
      setRange(null)
      return
    }
    setQuery(found.query)
    setRange({ start: found.start, end: caret })
    setOpen(true)
    setActiveIndex(0)
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync with caret via events below
  }, [value])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    const onMove = () => refresh()
    el.addEventListener('keyup', onMove)
    el.addEventListener('click', onMove)
    el.addEventListener('select', onMove)
    return () => {
      el.removeEventListener('keyup', onMove)
      el.removeEventListener('click', onMove)
      el.removeEventListener('select', onMove)
    }
  }, [textareaRef, value])

  useLayoutEffect(() => {
    if (!open || !range) {
      setCoords(null)
      return
    }
    const el = textareaRef.current
    if (!el) return
    const mirror = document.createElement('div')
    const style = window.getComputedStyle(el)
    const props = [
      'boxSizing', 'width', 'padding', 'border', 'font', 'fontSize', 'fontFamily',
      'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'wordSpacing',
      'whiteSpace', 'wordWrap', 'overflowWrap',
    ] as const
    mirror.style.position = 'absolute'
    mirror.style.visibility = 'hidden'
    mirror.style.whiteSpace = 'pre-wrap'
    mirror.style.wordWrap = 'break-word'
    mirror.style.overflow = 'hidden'
    mirror.style.top = '0'
    mirror.style.left = '-9999px'
    for (const prop of props) {
      mirror.style[prop] = style[prop]
    }
    mirror.style.width = `${el.clientWidth}px`
    const textBefore = value.slice(0, range.end)
    mirror.textContent = textBefore
    const marker = document.createElement('span')
    marker.textContent = '|'
    mirror.appendChild(marker)
    document.body.appendChild(mirror)
    const rect = el.getBoundingClientRect()
    const markerRect = marker.getBoundingClientRect()
    const mirrorRect = mirror.getBoundingClientRect()
    document.body.removeChild(mirror)
    setCoords({
      top: rect.top + (markerRect.top - mirrorRect.top) - el.scrollTop + 20,
      left: rect.left + (markerRect.left - mirrorRect.left) - el.scrollLeft,
    })
  }, [open, range, value, textareaRef])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (!filtered.length) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % filtered.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        if (range && filtered[activeIndex]) {
          e.preventDefault()
          onInsert(filtered[activeIndex].token, range.start, range.end)
          setOpen(false)
        }
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    const el = textareaRef.current
    el?.addEventListener('keydown', onKey)
    return () => el?.removeEventListener('keydown', onKey)
  }, [open, filtered, activeIndex, range, onInsert, textareaRef])

  if (!open || !coords || filtered.length === 0) return null

  return (
    <ul
      ref={listRef}
      className="broadcast-var-autocomplete"
      style={{ top: coords.top, left: coords.left }}
      role="listbox"
    >
      {filtered.map((item, index) => (
        <li key={item.token}>
          <button
            type="button"
            className={`broadcast-var-autocomplete-item${index === activeIndex ? ' is-active' : ''}`}
            role="option"
            aria-selected={index === activeIndex}
            onMouseDown={(e) => {
              e.preventDefault()
              if (range) {
                onInsert(item.token, range.start, range.end)
                setOpen(false)
              }
            }}
          >
            <code>{item.token}</code>
            <span>{item.description}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

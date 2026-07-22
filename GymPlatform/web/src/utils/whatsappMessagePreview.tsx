import type { ReactNode } from 'react'

/** Emojis frecuentes para mensajes de difusión WhatsApp (Unicode nativo). */
export const BROADCAST_EMOJI_PICKER = [
  '💪', '🎉', '🏋️‍♀️', '🏋️‍♂️', '🔥', '🌟', '💯', '🙌', '📅', '🚀',
  '😊', '😎', '🏆', '🎯', '👋', '❤️', '✨', '✅', '⏰', '📍',
  '💬', '🙏', '👏', '⭐', '🆕', '🔔', '🏃', '🧘', '💦', '🥇',
] as const

const URL_SPLIT = /(https?:\/\/[^\s<>"']+)/gi
const MD_BOLD = /\*\*(.+?)\*\*/g
const WA_BOLD = /(?<!\*)\*(?!\*)([^*\n]+?)\*(?!\*)/g
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp)(\?.*)?$/i

function renderInlineFormatting(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const parts = text.split(MD_BOLD)
  let i = 0
  for (let part = 0; part < parts.length; part++) {
    const chunk = parts[part]
    if (part % 2 === 1) {
      nodes.push(<strong key={`${keyPrefix}-b${i++}`}>{chunk}</strong>)
      continue
    }
    const waParts = chunk.split(WA_BOLD)
    for (let w = 0; w < waParts.length; w++) {
      const waChunk = waParts[w]
      if (w % 2 === 1) {
        nodes.push(<strong key={`${keyPrefix}-w${i++}`}>{waChunk}</strong>)
      } else if (waChunk) {
        nodes.push(<span key={`${keyPrefix}-t${i++}`}>{waChunk}</span>)
      }
    }
  }
  return nodes
}

function filenameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname
    const name = path.split('/').filter(Boolean).pop()
    return name ? decodeURIComponent(name) : 'Archivo'
  } catch {
    return 'Archivo'
  }
}

function isImageUrl(url: string): boolean {
  try {
    return IMAGE_EXT.test(new URL(url).pathname)
  } catch {
    return IMAGE_EXT.test(url)
  }
}

/** Tarjetas de adjunto estilo burbuja WhatsApp. */
export function WhatsAppAttachmentCards({ urls }: { urls: string[] }) {
  if (!urls.length) return null
  return (
    <div className="broadcast-wa-attachments">
      {urls.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="broadcast-wa-attachment"
          onClick={(e) => e.stopPropagation()}
        >
          {isImageUrl(url) ? (
            <span className="broadcast-wa-attachment-thumb" style={{ backgroundImage: `url(${url})` }} />
          ) : (
            <span className="broadcast-wa-attachment-file-icon" aria-hidden>📄</span>
          )}
          <span className="broadcast-wa-attachment-meta">
            <span className="broadcast-wa-attachment-name">{filenameFromUrl(url)}</span>
            <span className="broadcast-wa-attachment-url">{url}</span>
          </span>
        </a>
      ))}
    </div>
  )
}

/**
 * Vista previa: emojis, negrita WA y links azules (como en WhatsApp).
 * Los adjuntos se muestran aparte como tarjetas.
 */
export function WhatsAppMessagePreview({
  text,
  mediaUrls = [],
  className,
  clamp,
}: {
  text: string
  mediaUrls?: string[]
  className?: string
  clamp?: boolean
}) {
  if (!text && mediaUrls.length === 0) {
    return <p className={className} />
  }

  const mediaSet = new Set(mediaUrls.map((u) => u.toLowerCase()))
  const parts = text ? text.split(URL_SPLIT) : []
  const nodes: ReactNode[] = []
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (!part) continue
    if (/^https?:\/\//i.test(part)) {
      if (mediaSet.has(part.toLowerCase())) {
        continue
      }
      nodes.push(
        <a
          key={`u${i}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="broadcast-msg-link"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>,
      )
    } else {
      nodes.push(...renderInlineFormatting(part, `p${i}`))
    }
  }

  return (
    <div
      className={[
        'broadcast-msg-preview',
        clamp ? 'broadcast-msg-preview--clamp' : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
    >
      {nodes.length > 0 && <div className="broadcast-msg-preview-text">{nodes}</div>}
        <WhatsAppAttachmentCards urls={mediaUrls} />
    </div>
  )
}

/** Inserta texto en un textarea en la posición del cursor. */
export function insertAtCursor(
  el: HTMLTextAreaElement | null,
  current: string,
  insertion: string,
): { next: string; caret: number } {
  if (!el) {
    const next = current + insertion
    return { next, caret: next.length }
  }
  const start = el.selectionStart ?? current.length
  const end = el.selectionEnd ?? current.length
  const next = current.slice(0, start) + insertion + current.slice(end)
  return { next, caret: start + insertion.length }
}

export function replaceRange(
  current: string,
  start: number,
  end: number,
  insertion: string,
): { next: string; caret: number } {
  const next = current.slice(0, start) + insertion + current.slice(end)
  return { next, caret: start + insertion.length }
}

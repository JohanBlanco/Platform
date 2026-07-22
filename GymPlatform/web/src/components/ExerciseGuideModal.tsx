import { useEffect, useState, type ReactNode } from 'react'
import { api } from '../api'

type Props = {
  title: string
  exerciseId?: number | null
  guideUrl?: string | null
  videoUrl?: string | null
  imageUrl?: string | null
  onClose: () => void
}

function renderMarkdownLite(md: string): ReactNode[] {
  const lines = md.split(/\r?\n/)
  const nodes: ReactNode[] = []
  let listItems: ReactNode[] = []
  let listTag: 'ol' | 'ul' | null = null
  let listKey = 0

  const flushList = () => {
    if (!listTag) return
    const Tag = listTag
    nodes.push(<Tag key={`list-${listKey++}`}>{listItems}</Tag>)
    listItems = []
    listTag = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd()
    if (!line.trim()) {
      flushList()
      continue
    }
    if (line.startsWith('## ')) {
      flushList()
      nodes.push(<h2 key={i}>{line.slice(3).trim()}</h2>)
      continue
    }
    if (line.startsWith('### ')) {
      flushList()
      nodes.push(<h3 key={i}>{line.slice(4).trim()}</h3>)
      continue
    }
    const ol = line.match(/^\d+\.\s+(.*)$/)
    if (ol) {
      if (listTag !== 'ol') { flushList(); listTag = 'ol' }
      listItems.push(<li key={`li-${i}`}>{ol[1]}</li>)
      continue
    }
    const ul = line.match(/^[-*]\s+(.*)$/)
    if (ul) {
      if (listTag !== 'ul') { flushList(); listTag = 'ul' }
      listItems.push(<li key={`li-${i}`}>{ul[1]}</li>)
      continue
    }
    flushList()
    nodes.push(<p key={i}>{line.replace(/^#\s+/, '')}</p>)
  }
  flushList()
  return nodes
}

/**
 * Guía desde foro persistido (DB) + media referenciada.
 * Si no hay tema de foro, muestra video y enlace a fuente.
 */
export default function ExerciseGuideModal({
  title,
  exerciseId,
  guideUrl,
  videoUrl,
  imageUrl,
  onClose,
}: Props) {
  const [bodyMarkdown, setBodyMarkdown] = useState<string | null>(null)
  const [resolvedVideo, setResolvedVideo] = useState(videoUrl ?? null)
  const [resolvedImage, setResolvedImage] = useState(imageUrl ?? null)
  const [sourceUrl, setSourceUrl] = useState(guideUrl ?? null)
  const [loading, setLoading] = useState(Boolean(exerciseId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (exerciseId == null) {
      setLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const topic = await api.getForumTopicByExercise(exerciseId)
        if (cancelled) return
        setBodyMarkdown(topic.bodyMarkdown)
        setResolvedVideo(topic.videoUrl ?? videoUrl ?? null)
        setResolvedImage(topic.imageUrl ?? imageUrl ?? null)
        setSourceUrl(topic.sourceUrl ?? guideUrl ?? null)
      } catch {
        if (!cancelled) {
          setError('Guía de foro no encontrada; se muestra la referencia externa.')
          setBodyMarkdown(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [exerciseId, guideUrl, imageUrl, videoUrl])

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="card modal-card exercise-guide-modal"
        role="dialog"
        aria-labelledby="exercise-guide-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="exercise-guide-modal-header">
          <h3 id="exercise-guide-title">{title}</h3>
          <button type="button" className="btn-secondary" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        {loading ? (
          <p className="exercise-guide-loading">Cargando guía…</p>
        ) : (
          <>
            {resolvedVideo ? (
              <div className="exercise-guide-video-wrap">
                <video
                  className="exercise-guide-video"
                  src={resolvedVideo}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                />
              </div>
            ) : resolvedImage ? (
              <img className="exercise-guide-hero" src={resolvedImage} alt="" />
            ) : null}

            <div className="exercise-guide-body">
              {error && <p className="exercise-guide-error">{error}</p>}
              {bodyMarkdown ? (
                renderMarkdownLite(bodyMarkdown)
              ) : (
                <p>No hay contenido persistido todavía para este ejercicio.</p>
              )}
            </div>

            {sourceUrl && (
              <p className="exercise-guide-credit">
                Fuente:{' '}
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer">EresFitness</a>
                {' '}· texto en GymPlatform · media por referencia
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

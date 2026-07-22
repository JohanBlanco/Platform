import { useEffect, useState, type ReactNode } from 'react'
import { api } from '../../api'
import type { Forum, ForumTopicDetail, ForumTopicSummary, MuscleGroup } from '../../types'
import { CATALOG_MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from '../../types'
import { ExerciseMediaThumb } from '../../components/ExerciseMediaThumb'
import { useToast } from '../../toast'

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

export default function ForumsSection() {
  const { showApiError } = useToast()
  const [forums, setForums] = useState<Forum[]>([])
  const [activeSlug, setActiveSlug] = useState('exercises')
  const [topics, setTopics] = useState<ForumTopicSummary[]>([])
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | ''>('')
  const [selected, setSelected] = useState<ForumTopicDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingTopic, setLoadingTopic] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const list = await api.getForums()
        setForums(list)
        if (list.length && !list.some((f) => f.slug === activeSlug)) {
          setActiveSlug(list[0].slug)
        }
      } catch (err) {
        showApiError(err, 'No se pudieron cargar los foros')
      } finally {
        setLoading(false)
      }
    })()
  }, [showApiError])

  useEffect(() => {
    if (!activeSlug) return
    void (async () => {
      try {
        const list = await api.getForumTopics(activeSlug, muscleFilter || undefined)
        setTopics(list)
        setSelected(null)
      } catch (err) {
        showApiError(err, 'No se pudieron cargar los temas')
      }
    })()
  }, [activeSlug, muscleFilter, showApiError])

  const openTopic = async (topicId: number) => {
    setLoadingTopic(true)
    try {
      const detail = await api.getForumTopic(topicId)
      setSelected(detail)
    } catch (err) {
      showApiError(err, 'No se pudo abrir el tema')
    } finally {
      setLoadingTopic(false)
    }
  }

  const activeForum = forums.find((f) => f.slug === activeSlug)

  if (loading) return <p>Cargando foros…</p>

  return (
    <div className="forums-section">
      <div className="forums-tabs">
        {forums.map((f) => (
          <button
            key={f.id}
            type="button"
            className={f.slug === activeSlug ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveSlug(f.slug)}
          >
            {f.title} ({f.topicCount})
          </button>
        ))}
      </div>

      {activeForum && (
        <p className="forums-description">{activeForum.description}</p>
      )}

      {activeSlug === 'exercises' && (
        <div className="exercise-filter-chips">
          <button
            type="button"
            className={muscleFilter === '' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.55rem' }}
            onClick={() => setMuscleFilter('')}
          >
            Todos
          </button>
          {CATALOG_MUSCLE_GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              className={muscleFilter === g ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.8rem', padding: '0.3rem 0.55rem' }}
              onClick={() => setMuscleFilter(g)}
            >
              {MUSCLE_GROUP_LABELS[g]}
            </button>
          ))}
        </div>
      )}

      <div className="forums-layout">
        <div className="forums-topic-list">
          {topics.length === 0 ? (
            <p className="exercise-list-empty">No hay temas en este foro</p>
          ) : topics.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`forums-topic-row${selected?.id === t.id ? ' active' : ''}`}
              onClick={() => void openTopic(t.id)}
            >
              <ExerciseMediaThumb
                name={t.title}
                imageUrl={t.imageUrl}
                videoUrl={t.videoUrl}
                muscleGroup={t.muscleGroup ?? undefined}
              />
              <span>{t.title}</span>
            </button>
          ))}
        </div>

        <div className="forums-topic-detail card">
          {loadingTopic ? (
            <p>Cargando tema…</p>
          ) : !selected ? (
            <p className="exercise-list-empty">Selecciona un ejercicio para ver la guía persistida</p>
          ) : (
            <>
              <h2>{selected.title}</h2>
              {selected.videoUrl && (
                <video
                  className="forums-topic-video"
                  src={selected.videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                />
              )}
              {!selected.videoUrl && selected.imageUrl && (
                <img className="forums-topic-hero" src={selected.imageUrl} alt="" />
              )}
              <div className="forums-topic-body">
                {renderMarkdownLite(selected.bodyMarkdown)}
              </div>
              {selected.sourceUrl && (
                <p className="forums-topic-source">
                  Fuente:{' '}
                  <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer">
                    EresFitness
                  </a>
                  {' '}(texto en DB; media por referencia)
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

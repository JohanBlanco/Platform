import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDateFormat } from '../preferences/useDateFormat'
import type { ActivityPromotion } from '../types'

type Props = {
  promotions: ActivityPromotion[]
}

export default function ActivityPromotionCarousel({ promotions }: Props) {
  const { formatIsoDate, formatTimeRange } = useDateFormat()
  const [activeIndex, setActiveIndex] = useState(0)
  const [brokenImages, setBrokenImages] = useState<Set<number>>(() => new Set())

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, promotions.length - 1)))
  }, [promotions.length])

  useEffect(() => {
    if (promotions.length < 2) return
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mediaQuery.matches) return
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % promotions.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [promotions.length])

  if (promotions.length === 0) return null

  const active = promotions[activeIndex]
  const hasImage = Boolean(active.imageUrl) && !brokenImages.has(activeIndex)
  const move = (direction: -1 | 1) => {
    setActiveIndex((current) => (current + direction + promotions.length) % promotions.length)
  }

  return (
    <section className="member-promo" aria-labelledby="member-promo-title">
      <header className="member-home-section-head member-home-section-head--row">
        <div>
          <p className="member-promo-kicker">Elegida por tu gimnasio</p>
          <h2 id="member-promo-title">Tu próxima clase empieza aquí</h2>
        </div>
        {promotions.length > 1 && (
          <div className="member-promo-controls">
            <button type="button" aria-label="Promoción anterior" onClick={() => move(-1)}>
              ←
            </button>
            <span aria-live="polite">
              {activeIndex + 1} / {promotions.length}
            </span>
            <button type="button" aria-label="Promoción siguiente" onClick={() => move(1)}>
              →
            </button>
          </div>
        )}
      </header>

      <div className="member-promo-stage">
        <div className={`member-promo-media${hasImage ? ' has-image' : ''}`}>
          {hasImage ? (
            <img
              key={active.imageUrl}
              src={active.imageUrl ?? ''}
              alt=""
              referrerPolicy="no-referrer"
              onError={() =>
                setBrokenImages((current) => new Set(current).add(activeIndex))
              }
            />
          ) : (
            <span className="member-promo-monogram" aria-hidden>
              {active.name?.slice(0, 2).toUpperCase() || 'GO'}
            </span>
          )}
          <span className="member-promo-shade" aria-hidden />
        </div>

        <div className="member-promo-content">
          <div className="member-promo-topline">
            <span>Destacada</span>
          </div>
          <h3>{active.name}</h3>
          <p className="member-promo-description">
            {active.description || 'Muévete, disfruta y reserva tu lugar en esta clase.'}
          </p>
          <p className="member-promo-meta">
            {active.nextOccurrenceDate && formatIsoDate(active.nextOccurrenceDate)}
            {active.startTime && active.endTime
              ? ` · ${formatTimeRange(active.startTime, active.endTime)}`
              : ''}
            {active.locationName ? ` · ${active.locationName}` : ''}
          </p>
          {active.instructorName && (
            <p className="member-promo-instructor">Con {active.instructorName}</p>
          )}
          <Link to="/servicios/actividades" className="member-promo-action">
            Ver y reservar <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      {promotions.length > 1 && (
        <div className="member-promo-dots" role="tablist" aria-label="Promociones">
          {promotions.map((promotion, index) => (
            <button
              key={`${promotion.activityId}-${index}`}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Ver ${promotion.name}`}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

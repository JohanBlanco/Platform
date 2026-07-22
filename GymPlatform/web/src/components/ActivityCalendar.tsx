import { useEffect, useMemo, useState } from 'react'
import type { Activity } from '../types'
import { useDateFormat } from '../preferences/useDateFormat'
import ActivityTimeline from './ActivityTimeline'
import ActivityCapacityDisplay from './ActivityCapacityDisplay'
import { formatActivityScheduleFromActivity, isAllDayActivity, isActivityFull } from '../utils/activityCalendarUtils'
import {
  type CalendarView,
  WEEKDAY_LABELS,
  MONTH_LABELS,
  activitiesForDay,
  activitiesForRange,
  addDays,
  getRangeForView,
  isSameDay,
  shiftAnchor,
  startOfWeek,
  toIsoDate,
} from '../utils/calendarUtils'

type Props = {
  activities: Activity[]
  editable?: boolean
  onActivityEdit?: (activity: Activity) => void
  /** Click sin modo edición (miembro: reservar / cancelar). */
  onActivitySelect?: (activity: Activity) => void
  isReserved?: (activity: Activity) => boolean
  onCreateActivity?: () => void
  onCreateSlot?: (dateIso: string, startMin: number, endMin: number) => void
  onMoveOccurrence?: (
    activity: Activity,
    dateIso: string,
    startMin: number,
    endMin: number,
  ) => void
  onScheduleConflict?: () => void
  onRangeChange?: (from: string, to: string) => void
  /** Vistas disponibles; por defecto todas. */
  views?: CalendarView[]
  defaultView?: CalendarView
}

const DEFAULT_VIEWS: { id: CalendarView; label: string }[] = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'year', label: 'Año' },
]

function activityKey(a: Activity): string {
  return `${a.id}-${a.activityDate}`
}

export default function ActivityCalendar({
  activities,
  editable = false,
  onActivityEdit,
  onActivitySelect,
  isReserved,
  onCreateActivity,
  onCreateSlot,
  onMoveOccurrence,
  onScheduleConflict,
  onRangeChange,
  views,
  defaultView = 'week',
}: Props) {
  const { formatPeriodLabel } = useDateFormat()
  const viewOptions = useMemo(
    () => (views?.length
      ? DEFAULT_VIEWS.filter((v) => views.includes(v.id))
      : DEFAULT_VIEWS),
    [views],
  )
  const [view, setView] = useState<CalendarView>(
    () => viewOptions.find((v) => v.id === defaultView)?.id ?? viewOptions[0]?.id ?? 'week',
  )
  const [anchor, setAnchor] = useState(() => new Date())

  const range = useMemo(() => getRangeForView(view, anchor), [view, anchor])
  const inRange = useMemo(
    () => activitiesForRange(activities, range.from, range.to),
    [activities, range.from, range.to],
  )

  useEffect(() => {
    onRangeChange?.(toIsoDate(range.from), toIsoDate(range.to))
  }, [range.from, range.to, onRangeChange])

  const goToday = () => setAnchor(new Date())
  const activityClick = onActivityEdit ?? onActivitySelect

  const pillClass = (a: Activity) => {
    const reserved = isReserved?.(a) === true
    return {
      allDay: `activity-all-day-pill${isActivityFull(a) ? ' activity-all-day-pill--full' : ''}${a.occurrenceCancelled ? ' activity-all-day-pill--cancelled' : ''}${reserved ? ' activity-all-day-pill--reserved' : ''}`,
      timed: `appointment-month-pill activity-month-pill${a.hasOccurrenceOverride ? ' activity-month-pill--override' : ''}${isActivityFull(a) ? ' activity-month-pill--full' : ''}${a.occurrenceCancelled ? ' activity-month-pill--cancelled' : ''}${reserved ? ' activity-month-pill--reserved' : ''}`,
    }
  }

  return (
    <div className="appointment-calendar card appointment-calendar--gcal">
      <div className="calendar-toolbar appointment-gcal-toolbar">
        <div className="calendar-view-tabs">
          {viewOptions.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`calendar-tab${view === v.id ? ' active' : ''}`}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="calendar-nav">
          <button type="button" className="btn-secondary" onClick={() => setAnchor((d) => shiftAnchor(view, d, -1))}>‹</button>
          <span className="calendar-period">{formatPeriodLabel(view, anchor)}</span>
          <button type="button" className="btn-secondary" onClick={() => setAnchor((d) => shiftAnchor(view, d, 1))}>›</button>
          <button type="button" className="btn-secondary" onClick={goToday}>Hoy</button>
          {editable && onCreateActivity && (
            <button type="button" className="btn-primary" onClick={onCreateActivity}>
              Nueva actividad
            </button>
          )}
        </div>
      </div>

      {editable && (view === 'day' || view === 'week') && (
        <p className="calendar-hint">
          Doble clic en un espacio vacío para crear, o usa «Nueva actividad». Arrastra para cambiar el horario.
        </p>
      )}

      {!editable && onActivitySelect && (view === 'day' || view === 'week' || view === 'month') && (
        <p className="calendar-hint">
          Toca una actividad para reservar o cancelar tu asistencia.
        </p>
      )}

      {(view === 'day' || view === 'week') && (
        <ActivityTimeline
          activities={activities}
          view={view}
          anchor={anchor}
          editable={editable}
          onActivityEdit={onActivityEdit}
          onActivitySelect={onActivitySelect}
          isReserved={isReserved}
          onCreateSlot={editable ? onCreateSlot : undefined}
          onMoveOccurrence={editable ? onMoveOccurrence : undefined}
          onScheduleConflict={onScheduleConflict}
        />
      )}

      {view === 'month' && (
        <div className="calendar-month-scroll">
          <div className="calendar-month">
            <div className="calendar-month-head">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <div className="calendar-month-grid">
              {(() => {
                const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
                const start = startOfWeek(first)
                const cells = []
                for (let i = 0; i < 42; i++) {
                  const day = addDays(start, i)
                  const inMonth = day.getMonth() === anchor.getMonth()
                  const dayActs = activitiesForDay(activities, day)
                  cells.push(
                    <div
                      key={toIsoDate(day)}
                      className={`calendar-month-cell${inMonth ? '' : ' muted'}${isSameDay(day, new Date()) ? ' today' : ''}${dayActs.some(isAllDayActivity) ? ' calendar-month-cell--all-day' : ''}`}
                    >
                      <span className="calendar-day-num">{day.getDate()}</span>
                      {dayActs.filter(isAllDayActivity).map((a) => {
                        const cls = pillClass(a).allDay
                        return activityClick ? (
                          <button
                            key={activityKey(a)}
                            type="button"
                            className={cls}
                            onClick={() => activityClick(a)}
                          >
                            <span className="activity-all-day-pill-name">{a.name}</span>
                            <ActivityCapacityDisplay activity={a} compact className="activity-month-pill-capacity" />
                          </button>
                        ) : (
                          <span key={activityKey(a)} className={cls}>
                            <span className="activity-all-day-pill-name">{a.name}</span>
                            <ActivityCapacityDisplay activity={a} compact className="activity-month-pill-capacity" />
                          </span>
                        )
                      })}
                      {dayActs.filter((a) => !isAllDayActivity(a)).map((a) => {
                        const cls = pillClass(a).timed
                        return activityClick ? (
                          <button
                            key={activityKey(a)}
                            type="button"
                            className={cls}
                            onClick={() => activityClick(a)}
                          >
                            <span className="activity-month-pill-time">{formatActivityScheduleFromActivity(a)}</span>
                            <span className="activity-month-pill-name">
                              {a.name}
                              {a.hasOccurrenceOverride && '*'}
                            </span>
                            <ActivityCapacityDisplay activity={a} compact className="activity-month-pill-capacity" />
                          </button>
                        ) : (
                          <span key={activityKey(a)} className={cls}>
                            <span className="activity-month-pill-time">{formatActivityScheduleFromActivity(a)}</span>
                            <span className="activity-month-pill-name">{a.name}</span>
                            <ActivityCapacityDisplay activity={a} compact className="activity-month-pill-capacity" />
                          </span>
                        )
                      })}
                    </div>,
                  )
                }
                return cells
              })()}
            </div>
          </div>
          {inRange.length > 0 && (
            <p className="calendar-summary">{inRange.length} actividad{inRange.length === 1 ? '' : 'es'} en el periodo</p>
          )}
        </div>
      )}

      {view === 'year' && (
        <div className="calendar-year-grid">
          {MONTH_LABELS.map((label, monthIndex) => {
            const monthStart = new Date(anchor.getFullYear(), monthIndex, 1)
            const monthEnd = new Date(anchor.getFullYear(), monthIndex + 1, 0)
            const monthActs = activitiesForRange(activities, monthStart, monthEnd)
            return (
              <button
                key={label}
                type="button"
                className="calendar-year-month"
                onClick={() => {
                  setAnchor(monthStart)
                  setView('month')
                }}
              >
                <strong>{label}</strong>
                <span>{monthActs.length} actividad{monthActs.length === 1 ? '' : 'es'}</span>
              </button>
            )
          })}
        </div>
      )}

    </div>
  )
}

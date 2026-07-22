import { useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type RefObject } from 'react'
import type { Activity } from '../types'
import CalendarCurrentTimeLine from './CalendarCurrentTimeLine'
import { useLiveNow } from '../hooks/useLiveNow'
import {
  TIMELINE_END_HOUR,
  TIMELINE_START_HOUR,
} from '../utils/appointmentCalendarUtils'
import ActivityCapacityDisplay from './ActivityCapacityDisplay'
import {
  activityTimelineStyle,
  allDayActivitiesForDay,
  formatActivityScheduleFromActivity,
  formatActivityMinutesRange,
  isActivityFull,
  sortedActivitiesForDay,
} from '../utils/activityCalendarUtils'
import {
  activityEndMinutes,
  activityStartMinutes,
  defaultCreateSlotEnd,
  minutesFromActivityGridClick,
  startActivityCalendarMove,
} from '../utils/activityCalendarDragUtils'
import { timelineStyleFromMinutes, scheduleScrollTimelineToNow } from '../utils/timelineResizeUtils'
import { WEEKDAY_LABELS, addDays, isSameDay, startOfWeek, toIsoDate } from '../utils/calendarUtils'

export type ActivityTimelineView = 'day' | 'week'

export type ActivityCalendarDrag = {
  activityId: number
  occurrenceDate: string
  previewDateIso: string
  previewStart: number
  previewEnd: number
  invalid: boolean
} | null

type Props = {
  activities: Activity[]
  view: ActivityTimelineView
  anchor: Date
  editable?: boolean
  onActivityEdit?: (activity: Activity) => void
  /** Click de solo lectura (p. ej. miembro reserva/cancela). */
  onActivitySelect?: (activity: Activity) => void
  isReserved?: (activity: Activity) => boolean
  onCreateSlot?: (dateIso: string, startMin: number, endMin: number) => void
  onMoveOccurrence?: (
    activity: Activity,
    dateIso: string,
    startMin: number,
    endMin: number,
  ) => void
  onScheduleConflict?: () => void
  scrollToNow?: boolean
  compact?: boolean
  /** Cambia cuando el contenido termina de cargar para re-centrar la hora actual. */
  scrollToNowKey?: number | string
}

function activityKey(a: Activity): string {
  return `${a.id}-${a.activityDate}`
}

function formatHourLabel(hour: number): string {
  const date = new Date(2000, 0, 1, hour, 0)
  return date.toLocaleTimeString('es-CR', { hour: 'numeric', hour12: true })
}

function ActivityBlock({
  activity,
  editable,
  onEdit,
  onSelect,
  onMove,
  compactWeek,
  draggingHidden,
  reserved,
}: {
  activity: Activity
  editable?: boolean
  onEdit?: (activity: Activity) => void
  onSelect?: (activity: Activity) => void
  onMove?: (activity: Activity, e: MouseEvent<HTMLElement>) => void
  compactWeek?: boolean
  draggingHidden?: boolean
  reserved?: boolean
}) {
  const style = activityTimelineStyle(activity)
  if (!style) return null

  const timeRange = formatActivityScheduleFromActivity(activity)

  const full = isActivityFull(activity)
  const cancelled = activity.occurrenceCancelled === true
  const blockClass = `appointment-block activity-block${activity.hasOccurrenceOverride ? ' activity-block--override' : ''}${full ? ' activity-block--full' : ''}${cancelled ? ' activity-block--cancelled' : ''}${reserved ? ' activity-block--reserved' : ''}`

  const content = (
    <>
      <span className="appointment-block-time appointment-block-time--lead">{timeRange}</span>
      <strong className="appointment-block-title">
        {activity.name}
        {activity.hasOccurrenceOverride && (
          <span className="calendar-override-dot" title="Horario modificado" />
        )}
      </strong>
      {!compactWeek && (
        <span className="appointment-block-meta">{activity.locationName}</span>
      )}
      <ActivityCapacityDisplay
        activity={activity}
        compact={compactWeek}
        className="activity-capacity-badge--block"
      />
    </>
  )

  if (editable && onEdit && onMove && !cancelled) {
    return (
      <div
        className={`appointment-block-wrap appointment-block-wrap--movable${draggingHidden ? ' appointment-block-wrap--source-hidden' : ''}`}
        style={style}
      >
        <button
          type="button"
          className={blockClass}
          onMouseDown={(e) => {
            if (e.button !== 0) return
            e.preventDefault()
            onMove(activity, e)
          }}
        >
          {content}
        </button>
      </div>
    )
  }

  const handleClick = onEdit ?? onSelect
  if (handleClick) {
    return (
      <div className="appointment-block-wrap" style={style}>
        <button
          type="button"
          className={blockClass}
          onClick={() => handleClick(activity)}
        >
          {content}
        </button>
      </div>
    )
  }

  return (
    <div className="appointment-block-wrap" style={style}>
      <div className={blockClass}>
        {content}
      </div>
    </div>
  )
}

function DayColumn({
  day,
  activities,
  allDayActivities,
  editable,
  onActivityEdit,
  onActivitySelect,
  isReserved,
  onCreateSlot,
  onMoveOccurrence,
  onScheduleConflict,
  calendarMove,
  compactWeek,
  now,
}: {
  day: Date
  activities: Activity[]
  allDayActivities: Activity[]
  editable?: boolean
  onActivityEdit?: (activity: Activity) => void
  onActivitySelect?: (activity: Activity) => void
  isReserved?: (activity: Activity) => boolean
  onCreateSlot?: (dateIso: string, startMin: number, endMin: number) => void
  onMoveOccurrence?: (
    activity: Activity,
    dateIso: string,
    startMin: number,
    endMin: number,
  ) => void
  onScheduleConflict?: () => void
  calendarMove?: {
    scrollRef: RefObject<HTMLDivElement | null>
    drag: ActivityCalendarDrag
    setDrag: (drag: ActivityCalendarDrag) => void
    allActivities: Activity[]
  }
  compactWeek?: boolean
  now: Date
}) {
  const dateIso = toIsoDate(day)
  const isToday = isSameDay(day, new Date())
  const totalHours = TIMELINE_END_HOUR - TIMELINE_START_HOUR
  const dayActivities = useMemo(
    () => sortedActivitiesForDay(activities, day),
    [activities, day],
  )
  const hasAllDay = allDayActivities.length > 0

  const beginDrag = (activity: Activity, e: MouseEvent<HTMLElement>) => {
    const scrollEl = calendarMove?.scrollRef.current
    if (!scrollEl || !onMoveOccurrence || !calendarMove) return

    startActivityCalendarMove({
      scrollEl,
      activity,
      startDateIso: activity.activityDate,
      startMinutes: activityStartMinutes(activity),
      endMinutes: activityEndMinutes(activity),
      startClientX: e.clientX,
      startClientY: e.clientY,
      allActivities: calendarMove.allActivities,
      allowDateChange: !activity.recurring,
      onDragStart: () => {
        calendarMove.setDrag({
          activityId: activity.id,
          occurrenceDate: activity.activityDate,
          previewDateIso: activity.activityDate,
          previewStart: activityStartMinutes(activity),
          previewEnd: activityEndMinutes(activity),
          invalid: false,
        })
      },
      onPreview: (previewDateIso, start, end, valid) => {
        calendarMove.setDrag({
          activityId: activity.id,
          occurrenceDate: activity.activityDate,
          previewDateIso,
          previewStart: start,
          previewEnd: end,
          invalid: !valid,
        })
      },
      onCommit: (previewDateIso, start, end) => {
        calendarMove.setDrag(null)
        onMoveOccurrence(activity, previewDateIso, start, end)
      },
      onClick: () => onActivityEdit?.(activity),
      onInvalid: () => {
        calendarMove.setDrag(null)
        onScheduleConflict?.()
      },
    })
  }

  const draggingKey = calendarMove?.drag
    ? `${calendarMove.drag.activityId}-${calendarMove.drag.occurrenceDate}`
    : null

  const handleGridDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!editable || !onCreateSlot) return
    if ((e.target as HTMLElement).closest('.appointment-block-wrap')) return
    const grid = e.currentTarget
    const startMin = minutesFromActivityGridClick(e.clientY, grid)
    const endMin = defaultCreateSlotEnd(startMin)
    onCreateSlot(dateIso, startMin, endMin)
  }

  const dragPreview = calendarMove?.drag?.previewDateIso === dateIso ? calendarMove.drag : null
  const dragActivity = dragPreview
    ? dayActivities.find(
      (a) => a.id === dragPreview.activityId && a.activityDate === dragPreview.occurrenceDate,
    ) ?? activities.find(
      (a) => a.id === dragPreview.activityId && a.activityDate === dragPreview.occurrenceDate,
    )
    : undefined

  return (
    <div className={`appointment-gcal-day${isToday ? ' today' : ''}${hasAllDay ? ' appointment-gcal-day--all-day' : ''}`}>
      <div
        className={`appointment-gcal-day-grid${hasAllDay ? ' appointment-gcal-day-grid--all-day' : ''}`}
        data-date-iso={dateIso}
        onDoubleClick={handleGridDoubleClick}
        role="presentation"
      >
        {Array.from({ length: totalHours }, (_, i) => (
          <div
            key={i}
            className="appointment-gcal-hour-line"
            style={{ top: `${(i / totalHours) * 100}%` }}
          />
        ))}
        {dayActivities.map((activity) => (
          <ActivityBlock
            key={activityKey(activity)}
            activity={activity}
            editable={editable}
            onEdit={onActivityEdit}
            onSelect={onActivitySelect}
            onMove={editable && onMoveOccurrence ? beginDrag : undefined}
            compactWeek={compactWeek}
            draggingHidden={draggingKey === activityKey(activity)}
            reserved={isReserved?.(activity) === true}
          />
        ))}
        {dragPreview && dragActivity && (
          <div
            className={`appointment-drag-overlay${dragPreview.invalid ? ' appointment-drag-overlay--invalid' : ''}`}
            style={timelineStyleFromMinutes(dragPreview.previewStart, dragPreview.previewEnd)}
          >
            <div className="appointment-block activity-block activity-block--preview">
              <span className="appointment-block-time appointment-block-time--lead">
                {formatActivityMinutesRange(dragPreview.previewStart, dragPreview.previewEnd)}
              </span>
              <strong className="appointment-block-title">{dragActivity.name}</strong>
            </div>
          </div>
        )}
        <CalendarCurrentTimeLine day={day} now={now} />
      </div>
    </div>
  )
}

export default function ActivityTimeline({
  activities,
  view,
  anchor,
  editable = false,
  onActivityEdit,
  onActivitySelect,
  isReserved,
  onCreateSlot,
  onMoveOccurrence,
  onScheduleConflict,
  scrollToNow = true,
  compact = false,
  scrollToNowKey,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollTopRef = useRef(0)
  const [drag, setDrag] = useState<ActivityCalendarDrag>(null)
  const now = useLiveNow()
  const totalHours = TIMELINE_END_HOUR - TIMELINE_START_HOUR

  const days = useMemo(() => {
    if (view === 'day') return [anchor]
    return Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i))
  }, [view, anchor])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const saveScroll = () => {
      scrollTopRef.current = el.scrollTop
    }
    el.addEventListener('scroll', saveScroll, { passive: true })
    return () => el.removeEventListener('scroll', saveScroll)
  }, [])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = scrollTopRef.current
  }, [activities])

  useEffect(() => {
    if (!scrollToNow || !scrollRef.current) return
    const current = new Date()
    const includesToday = days.some((d) => isSameDay(d, current))
    if (!includesToday) return
    return scheduleScrollTimelineToNow(scrollRef.current, { watchResize: false }) ?? undefined
  }, [days, scrollToNow, view, anchor, scrollToNowKey])

  const calendarMove = editable && onMoveOccurrence
    ? { scrollRef, drag, setDrag, allActivities: activities }
    : undefined

  return (
    <div className={`appointment-gcal${compact ? ' appointment-gcal--compact' : ''}`}>
      <div className="appointment-gcal-shell">
        <div className={`appointment-gcal-header-row${view === 'week' ? ' appointment-gcal-header-row--week' : ''}`}>
          <div className="appointment-gcal-time-gutter appointment-gcal-time-gutter--header" aria-hidden />
          {days.map((day) => {
            const allDay = allDayActivitiesForDay(activities, day)
            const hasAllDay = allDay.length > 0
            return (
              <div
                key={toIsoDate(day)}
                className={`appointment-gcal-day-header-slot${isSameDay(day, new Date()) ? ' today' : ''}${hasAllDay ? ' appointment-gcal-day-header-slot--all-day' : ''}`}
              >
                <span className="appointment-gcal-weekday">{WEEKDAY_LABELS[(day.getDay() + 6) % 7]}</span>
                <span className={`appointment-gcal-date${isSameDay(day, new Date()) ? ' appointment-gcal-date--today' : ''}`}>
                  {day.getDate()}
                </span>
                {hasAllDay && (
                  <div className="activity-all-day-strip">
                    {allDay.map((activity) => {
                      const reserved = isReserved?.(activity) === true
                      const bannerClass = `activity-all-day-banner${isActivityFull(activity) ? ' activity-all-day-banner--full' : ''}${activity.occurrenceCancelled ? ' activity-all-day-banner--cancelled' : ''}${reserved ? ' activity-all-day-banner--reserved' : ''}`
                      const click = onActivityEdit ?? onActivitySelect
                      return click ? (
                        <button
                          key={activityKey(activity)}
                          type="button"
                          className={bannerClass}
                          onClick={() => click(activity)}
                        >
                          <span className="activity-all-day-banner-name">{activity.name}</span>
                          <ActivityCapacityDisplay activity={activity} compact />
                        </button>
                      ) : (
                        <span key={activityKey(activity)} className={bannerClass}>
                          <span className="activity-all-day-banner-name">{activity.name}</span>
                          <ActivityCapacityDisplay activity={activity} compact />
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="appointment-gcal-scroll" ref={scrollRef}>
          <div className={`appointment-gcal-body${view === 'week' ? ' appointment-gcal-body--week' : ''}`}>
            <div className="appointment-gcal-time-gutter appointment-gcal-time-gutter--timeline">
              {Array.from({ length: totalHours }, (_, i) => {
                const hour = TIMELINE_START_HOUR + i
                return (
                  <div key={hour} className="appointment-gcal-time-label">
                    <span>{formatHourLabel(hour)}</span>
                  </div>
                )
              })}
            </div>

            <div className={`appointment-gcal-columns${view === 'week' ? ' appointment-gcal-columns--week' : ''}`}>
              {days.map((day) => (
                <DayColumn
                  key={toIsoDate(day)}
                  day={day}
                  activities={activities}
                  allDayActivities={allDayActivitiesForDay(activities, day)}
                  editable={editable}
                  onActivityEdit={onActivityEdit}
                  onActivitySelect={onActivitySelect}
                  isReserved={isReserved}
                  onCreateSlot={onCreateSlot}
                  onMoveOccurrence={onMoveOccurrence}
                  onScheduleConflict={onScheduleConflict}
                  calendarMove={calendarMove}
                  compactWeek={view === 'week'}
                  now={now}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

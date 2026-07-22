import {
  TIMELINE_DAY_MINUTES,
  minutesFromTimelineStart,
  minutesToTimelinePercent,
} from '../utils/appointmentCalendarUtils'
import { isSameDay } from '../utils/calendarUtils'

type Props = {
  day: Date
  now: Date
}

export default function CalendarCurrentTimeLine({ day, now }: Props) {
  if (!isSameDay(day, now)) return null
  const minutes = minutesFromTimelineStart(now)
  if (minutes < 0 || minutes > TIMELINE_DAY_MINUTES) return null
  const top = minutesToTimelinePercent(minutes)

  return (
    <div className="appointment-now-line" style={{ top: `${top}%` }} aria-hidden>
      <span className="appointment-now-dot" />
    </div>
  )
}

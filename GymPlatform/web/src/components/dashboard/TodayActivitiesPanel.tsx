import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../api'
import { useDateFormat } from '../../preferences/useDateFormat'
import type { Activity } from '../../types'
import ActivityTimeline from '../ActivityTimeline'
import { toIsoDate } from '../../utils/calendarUtils'

type Props = {
  onChanged?: () => void
}

export default function TodayActivitiesPanel({ onChanged: _onChanged }: Props) {
  const { formatPeriodLabel } = useDateFormat()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const today = useMemo(() => new Date(), [])
  const todayIso = useMemo(() => toIsoDate(today), [today])

  const load = useCallback(() => {
    setLoading(true)
    api.getActivities(todayIso, todayIso)
      .then((items) => setActivities(items.filter((a) => a.active !== false)))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false))
  }, [todayIso])

  useEffect(() => { load() }, [load])

  const todayActivities = useMemo(
    () => activities.filter((a) => a.activityDate === todayIso),
    [activities, todayIso],
  )

  if (loading) {
    return (
      <div className="dashboard-today-calendar appointment-calendar appointment-calendar--gcal">
        <p className="calendar-hint">Cargando actividades del día…</p>
      </div>
    )
  }

  return (
    <div className="dashboard-today-calendar appointment-calendar appointment-calendar--gcal">
      <div className="dashboard-today-calendar-head">
        <span className="calendar-period">{formatPeriodLabel('day', today)}</span>
        <span className="calendar-hint calendar-hint--dashboard">
          {todayActivities.length === 0
            ? 'No hay actividades programadas para hoy.'
            : `${todayActivities.length} actividad${todayActivities.length === 1 ? '' : 'es'} hoy`}
        </span>
      </div>

      <ActivityTimeline
        activities={activities}
        view="day"
        anchor={today}
        compact
        scrollToNow
        scrollToNowKey={`${loading}-${todayActivities.length}`}
      />
    </div>
  )
}

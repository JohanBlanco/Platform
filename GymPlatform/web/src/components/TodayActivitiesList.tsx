import { useMemo } from 'react'
import type { Activity } from '../types'
import ActivityCapacityDisplay from './ActivityCapacityDisplay'
import { useFilteredList } from '../hooks/useFilteredList'
import { useDateFormat } from '../preferences/useDateFormat'
import { toIsoDate } from '../utils/calendarUtils'

type Props = {
  activities: Activity[]
}

export default function TodayActivitiesList({ activities }: Props) {
  const { formatTimeRange } = useDateFormat()
  const todayIso = toIsoDate(new Date())
  const todayActivities = useMemo(
    () => activities.filter((a) => a.activityDate === todayIso),
    [activities, todayIso],
  )
  const { filtered, filterInput } = useFilteredList(todayActivities)

  return (
    <>
      {filterInput}
      <div className="grid grid-2">
        {todayActivities.length === 0 ? (
          <div className="empty-state card">No hay actividades programadas para hoy</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state card">Ningún resultado coincide con la búsqueda</div>
        ) : filtered.map((a) => (
        <div key={`${a.id}-${a.activityDate}`} className="card">
          <h3>{a.name}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {formatTimeRange(a.startTime, a.endTime)} · {a.locationName}
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <ActivityCapacityDisplay activity={a} />
          </p>
        </div>
        ))}
      </div>
    </>
  )
}

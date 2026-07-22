import { useEffect, useState } from 'react'
import { api } from '../../api'
import TodayActivitiesList from '../../components/TodayActivitiesList'
import { toIsoDate } from '../../utils/calendarUtils'
import type { Activity } from '../../types'

export default function TodayActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const todayIso = toIsoDate(new Date())
    api.getActivities(todayIso, todayIso)
      .then(setActivities)
      .catch(() => setActivities([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Cargando...</p>

  return <TodayActivitiesList activities={activities} />
}

import type { Activity } from '../types'
import { activityRemainingCapacity, isActivityFull } from '../utils/activityCalendarUtils'

type Props = {
  activity: Activity
  /** Texto más corto en píldoras del calendario */
  compact?: boolean
  className?: string
}

export default function ActivityCapacityDisplay({
  activity,
  compact = false,
  className = '',
}: Props) {
  if (activity.occurrenceCancelled) {
    return (
      <span className={`activity-capacity-badge activity-capacity-badge--cancelled ${className}`.trim()}>
        Cancelada
      </span>
    )
  }

  if (activity.capacity != null && isActivityFull(activity)) {
    return (
      <span className={`activity-capacity-badge activity-capacity-badge--full ${className}`.trim()}>
        Sin cupos
      </span>
    )
  }

  const remaining = activity.capacity != null ? activityRemainingCapacity(activity) ?? 0 : null
  const text = remaining != null
    ? compact
      ? `${remaining} disp.`
      : `${remaining} cupo${remaining === 1 ? '' : 's'} disponible${remaining === 1 ? '' : 's'}`
    : compact
      ? 'Disponible'
      : 'Cupos disponibles'

  return (
    <span className={`activity-capacity-badge activity-capacity-badge--available ${className}`.trim()}>
      {text}
    </span>
  )
}

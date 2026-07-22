import { routineRequestBadgeClass, routineRequestStatusLabel } from '../utils/routineRequest'

type Props = {
  status: string
}

export default function RoutineRequestStatusBadge({ status }: Props) {
  return (
    <span className={`badge ${routineRequestBadgeClass(status)}`}>
      {routineRequestStatusLabel(status)}
    </span>
  )
}

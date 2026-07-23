import { useEffect, useState } from 'react'
import { api } from '../../api'
import RoutineRequestStatusBadge from '../RoutineRequestStatusBadge'
import { useFilteredList } from '../../hooks/useFilteredList'
import type { RoutineRequest } from '../../types'
import { isRoutineRequestOpen } from '../../utils/routineRequest'

type Props = {
  onChanged?: () => void
}

export default function RoutineRequestsPanel(_props: Props) {
  const [requests, setRequests] = useState<RoutineRequest[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.getRoutineRequests()
      .then((items) => setRequests(items.filter((r) => isRoutineRequestOpen(r.status))))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const searchExtras = (r: RoutineRequest) => [
    r.preferredInstructorName ?? '',
    r.assignedInstructorName ?? '',
    r.goals,
    r.description,
  ]

  const { filtered, filterInput } = useFilteredList(requests, searchExtras)

  if (loading) return <p className="text-muted">Cargando…</p>

  return (
    <>
      {filterInput}
      {requests.length === 0 ? (
        <p className="empty-state">Sin solicitudes pendientes</p>
      ) : filtered.length === 0 ? (
        <p className="empty-state">Ningún resultado coincide con la búsqueda</p>
      ) : (
        <ul className="staff-home-item-list">
          {filtered.map((r) => (
            <li key={r.id} className="staff-home-item-card routine-request-card">
              <span className="staff-home-item-aside">Rutina</span>
              <div className="staff-home-item-main">
                <div className="staff-home-item-head">
                  <h3 className="staff-home-item-title">{r.memberName}</h3>
                  <RoutineRequestStatusBadge status={r.status} />
                </div>
                <p className="staff-home-item-meta">
                  Instructor preferido: {r.preferredInstructorName ?? 'Cualquier instructor'}
                  {r.assignedInstructorName ? ` · Atendiendo: ${r.assignedInstructorName}` : ''}
                </p>
                <p className="staff-home-item-meta staff-home-item-meta--clamp" title={r.description}>
                  {r.description}
                </p>
                <p className="staff-home-item-meta staff-home-item-meta--clamp" title={r.goals}>
                  Objetivos: {r.goals}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

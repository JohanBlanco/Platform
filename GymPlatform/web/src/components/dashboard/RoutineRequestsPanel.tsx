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

  const { filtered, filterInput } = useFilteredList(requests)

  if (loading) return <p>Cargando...</p>

  return (
    <>
      {filterInput}
      <div className="grid grid-2">
        {requests.length === 0 ? (
          <div className="empty-state card">Sin solicitudes pendientes</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state card">Ningún resultado coincide con la búsqueda</div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="card routine-request-card">
              <div className="card-list-header">
                <div className="card-list-header-main">
                  <h3>{r.memberName}</h3>
                  <p className="card-list-meta">
                    Instructor preferido: {r.preferredInstructorName ?? 'Cualquier instructor'}
                    {r.assignedInstructorName ? ` · Atendiendo: ${r.assignedInstructorName}` : ''}
                  </p>
                </div>
                <RoutineRequestStatusBadge status={r.status} />
              </div>
              <p className="card-list-body" title={r.description}>
                {r.description}
              </p>
              <p className="card-list-meta card-list-meta--clamp" title={r.goals}>
                Objetivos: {r.goals}
              </p>
            </div>
          ))
        )}
      </div>
    </>
  )
}

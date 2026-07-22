import { useEffect, useState } from 'react'
import { api } from '../../api'
import { useFilteredList } from '../../hooks/useFilteredList'
import RoutineRequestStatusBadge from '../../components/RoutineRequestStatusBadge'
import type { RoutineRequest } from '../../types'

export default function RoutineRequestsPage() {
  const [requests, setRequests] = useState<RoutineRequest[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    api.getRoutineRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const { filtered, filterInput } = useFilteredList(requests)

  if (loading) return <p>Cargando...</p>

  return (
    <>
      {filterInput}
      <div className="grid grid-2">
        {requests.length === 0 ? (
          <div className="empty-state card">Sin solicitudes</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state card">Ningún resultado coincide con la búsqueda</div>
        ) : filtered.map((r) => (
        <div key={r.id} className="card routine-request-card">
          <div className="card-list-header">
            <h3>{r.memberName}</h3>
            <RoutineRequestStatusBadge status={r.status} />
          </div>
          <p className="card-list-body" title={r.description}>
            {r.description}
          </p>
          <p className="card-list-meta card-list-meta--clamp" title={r.goals}>
            Objetivos: {r.goals}
          </p>
        </div>
        ))}
      </div>
    </>
  )
}

import { useEffect, useState } from 'react'
import { api, ApiError } from '../../api'
import { useFilteredList } from '../../hooks/useFilteredList'
import { useDateFormat } from '../../preferences/useDateFormat'
import { useToast } from '../../toast'
import type { Reservation } from '../../types'

export default function ReceptionPagosSection() {
  const { formatDateTime } = useDateFormat()
  const { showSuccess, showApiError } = useToast()
  const [pending, setPending] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    api.getPendingPaymentReservations()
      .then(setPending)
      .catch(() => setPending([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const { filtered, filterInput } = useFilteredList(pending)

  const handleMarkPaid = async (id: number) => {
    setMarkingId(id)
    try {
      await api.markReservationPaid(id)
      showSuccess('Pago registrado correctamente')
      load()
    } catch (e) {
      showApiError(e, 'Error al registrar pago')
    } finally {
      setMarkingId(null)
    }
  }

  if (loading) return <p>Cargando...</p>

  return (
    <>
      {filterInput}
      <div className="grid grid-2">
        {pending.length === 0 ? (
          <div className="empty-state card">No hay pagos pendientes</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state card">Ningún resultado coincide con la búsqueda</div>
        ) : filtered.map((r) => (
        <div key={r.id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3>{r.activityName}</h3>
            <span className="badge badge-pending">Pago pendiente</span>
          </div>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Miembro: <strong>{r.memberName}</strong>
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Estado: {r.status === 'CONFIRMED' ? 'Confirmada' : 'Cancelada'} · Reservado: {formatDateTime(r.createdAt)}
          </p>
          <button
            className="btn-primary"
            style={{ marginTop: '0.75rem' }}
            disabled={markingId === r.id}
            onClick={() => handleMarkPaid(r.id)}
          >
            {markingId === r.id ? 'Registrando...' : 'Marcar como pagado'}
          </button>
        </div>
        ))}
      </div>
    </>
  )
}

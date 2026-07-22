import { useEffect, useState } from 'react'
import { api } from '../../api'
import { useFilteredList } from '../../hooks/useFilteredList'
import { useDateFormat } from '../../preferences/useDateFormat'
import { MEMBERSHIP_STATUS_LABELS, membershipStatusBadgeClass } from '../../roles'
import type { User } from '../../types'

export default function PendingPaymentsPanel() {
  const { formatDate } = useDateFormat()
  const [pending, setPending] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.getPendingMembershipPayment()
      .then(setPending)
      .catch(() => setPending([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const searchExtras = (u: User) => [
    u.email,
    u.membershipPackageName ?? '',
    u.nextPaymentDate ? formatDate(u.nextPaymentDate) : '',
  ]

  const { filtered, filterInput } = useFilteredList(pending, searchExtras)

  if (loading) return <p>Cargando...</p>

  return (
    <>
      {filterInput}
      <div className="grid grid-2">
        {pending.length === 0 ? (
          <div className="empty-state card">No hay miembros pendientes de pago</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state card">Ningún resultado coincide con la búsqueda</div>
        ) : filtered.map((u) => (
          <div key={u.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3>{u.firstName} {u.lastName}</h3>
              <span className={`badge ${membershipStatusBadgeClass(u.membershipStatus)}`}>
                {MEMBERSHIP_STATUS_LABELS[u.membershipStatus ?? 'PAYMENT_PENDING'] ?? 'Pendiente de pago'}
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
              {u.email}
            </p>
            {u.nextPaymentDate && (
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>
                Venció el {formatDate(u.nextPaymentDate)}
              </p>
            )}
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem', marginBottom: 0 }}>
              Plan: {u.membershipPackageName ?? 'Sin plan asignado'}
            </p>
          </div>
        ))}
      </div>
    </>
  )
}

import { useEffect, useState } from 'react'
import { api } from '../../api'
import { useFilteredList } from '../../hooks/useFilteredList'
import { useDateFormat } from '../../preferences/useDateFormat'
import { MEMBERSHIP_STATUS_LABELS, membershipStatusBadgeClass } from '../../roles'
import type { User } from '../../types'

function paymentAsideLabel(user: User, formatDate: (iso: string) => string): string {
  if (user.nextPaymentDate) {
    return formatDate(user.nextPaymentDate)
  }
  return 'Pago'
}

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

  if (loading) return <p className="text-muted">Cargando…</p>

  return (
    <>
      {filterInput}
      {pending.length === 0 ? (
        <p className="empty-state">No hay miembros pendientes de pago</p>
      ) : filtered.length === 0 ? (
        <p className="empty-state">Ningún resultado coincide con la búsqueda</p>
      ) : (
        <ul className="staff-home-item-list">
          {filtered.map((u) => (
            <li key={u.id} className="staff-home-item-card">
              <span className="staff-home-item-aside">{paymentAsideLabel(u, formatDate)}</span>
              <div className="staff-home-item-main">
                <div className="staff-home-item-head">
                  <h3 className="staff-home-item-title">
                    {u.firstName} {u.lastName}
                  </h3>
                  <span className={`badge staff-home-item-badge ${membershipStatusBadgeClass(u.membershipStatus)}`}>
                    {MEMBERSHIP_STATUS_LABELS[u.membershipStatus ?? 'PAYMENT_PENDING'] ?? 'Pendiente de pago'}
                  </span>
                </div>
                <p className="staff-home-item-meta">{u.email}</p>
                <p className="staff-home-item-meta staff-home-item-meta--clamp">
                  {u.nextPaymentDate ? `Venció el ${formatDate(u.nextPaymentDate)} · ` : ''}
                  Plan: {u.membershipPackageName ?? 'Sin plan asignado'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

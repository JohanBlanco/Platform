import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../api'
import ConfirmDialog from '../../components/ConfirmDialog'
import type { CashDayReport, CashSession, PaymentMethod, StoreSale, StoreSalesSummary } from '../../types'
import { toIsoDate } from '../../utils/calendarUtils'
import { formatMoney } from '../../utils/money'
import { formatSalePaymentsSummary, readImageFileAsDataUrl, saleHasSinpePayment } from '../../utils/paymentProof'
import { useToast } from '../../toast'

type Period = 'day' | 'month' | 'year'
type ManualKind = 'MANUAL_INCOME' | 'MANUAL_EXPENSE'
type PaymentFilter = '' | PaymentMethod

type HistoryFilters = {
  dateFrom: string
  dateTo: string
  client: string
  item: string
  paymentMethod: PaymentFilter
}

type SaleGroup = {
  key: string
  title: string
  subtitle?: string
  meta?: string
  badge?: string
  badgeTone?: 'open' | 'closed' | 'neutral'
  totalsHint?: string
  summary: StoreSalesSummary
  sales: StoreSale[]
  session?: CashSession
}

const emptyFilters = (): HistoryFilters => ({
  dateFrom: '',
  dateTo: '',
  client: '',
  item: '',
  paymentMethod: '',
})

function todayIso() {
  return toIsoDate(new Date())
}

function monthInputValue(isoDate: string) {
  return isoDate.slice(0, 7)
}

function yearInputValue(isoDate: string) {
  return isoDate.slice(0, 4)
}

function typeLabel(type: StoreSale['type']) {
  if (type === 'SALE') return 'Venta'
  if (type === 'MANUAL_INCOME') return 'Ingreso'
  return 'Gasto'
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDayHeading(isoOrDate: string) {
  const d = isoOrDate.length === 10 ? `${isoOrDate}T12:00:00` : isoOrDate
  return new Date(d).toLocaleDateString('es-CR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatMonthHeading(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0, 1).toLocaleDateString('es-CR', {
    month: 'long',
    year: 'numeric',
  })
}

function sessionRangeLabel(session: CashSession) {
  const open = formatDateTime(session.openedAt)
  if (session.status === 'OPEN' || !session.closedAt) {
    return `${open} → abierta`
  }
  return `${open} → ${formatDateTime(session.closedAt)}`
}

function summarizeSales(sales: StoreSale[]): StoreSalesSummary {
  let salesTotal = 0
  let incomeTotal = 0
  let expenseTotal = 0
  for (const sale of sales) {
    if (sale.type === 'SALE') salesTotal += sale.total
    else if (sale.type === 'MANUAL_INCOME') incomeTotal += sale.total
    else expenseTotal += sale.total
  }
  return {
    salesTotal,
    incomeTotal,
    expenseTotal,
    netTotal: salesTotal + incomeTotal - expenseTotal,
    saleCount: sales.length,
  }
}

function saleLocalDate(sale: StoreSale) {
  const d = new Date(sale.createdAt)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function saleMatchesFilters(sale: StoreSale, filters: HistoryFilters): boolean {
  const day = saleLocalDate(sale)
  if (filters.dateFrom && day < filters.dateFrom) return false
  if (filters.dateTo && day > filters.dateTo) return false

  const clientQ = filters.client.trim().toLowerCase()
  if (clientQ) {
    const name = (sale.memberName ?? '').toLowerCase()
    if (!name.includes(clientQ)) return false
  }

  const itemQ = filters.item.trim().toLowerCase()
  if (itemQ) {
    const hit = sale.items.some((it) =>
      `${it.description} ${it.kind}`.toLowerCase().includes(itemQ),
    )
    if (!hit) return false
  }

  if (filters.paymentMethod) {
    const methods = sale.payments?.map((p) => p.method) ?? []
    if (methods.length === 0) {
      if ((sale.paymentMethod ?? 'CASH') !== filters.paymentMethod) return false
    } else if (!methods.includes(filters.paymentMethod)) {
      return false
    }
  }

  return true
}

function SummaryCards({ summary }: { summary: StoreSalesSummary }) {
  return (
    <div className="store-history-summary">
      <div><span>Ventas</span><strong>{formatMoney(summary.salesTotal)}</strong></div>
      <div><span>Ingresos</span><strong>{formatMoney(summary.incomeTotal)}</strong></div>
      <div><span>Gastos</span><strong>{formatMoney(summary.expenseTotal)}</strong></div>
      <div><span>Neto</span><strong>{formatMoney(summary.netTotal)}</strong></div>
      <div><span>Movimientos</span><strong>{summary.saleCount}</strong></div>
    </div>
  )
}

function SaleCard({
  sale,
  onUpdated,
  onDeleted,
}: {
  sale: StoreSale
  onUpdated?: (sale: StoreSale) => void
  onDeleted?: (saleId: number) => void
}) {
  const { showApiError, showSuccess, showWarning } = useToast()
  const [uploading, setUploading] = useState(false)
  const [viewingProof, setViewingProof] = useState<string | null>(null)
  const [loadingProof, setLoadingProof] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const canAttachSinpe = sale.type === 'SALE' && saleHasSinpePayment(sale)
  const canDelete = sale.deletable === true

  const viewProof = async () => {
    setLoadingProof(true)
    try {
      const res = await api.getStoreSalePaymentProof(sale.id)
      setViewingProof(res.paymentProofData)
    } catch (err) {
      showApiError(err, 'No se pudo cargar el comprobante')
    } finally {
      setLoadingProof(false)
    }
  }

  const uploadProof = async (file: File) => {
    setUploading(true)
    try {
      const data = await readImageFileAsDataUrl(file)
      const updated = await api.attachStoreSalePaymentProof(sale.id, data)
      onUpdated?.(updated)
      showSuccess('Comprobante SINPE guardado')
    } catch (err) {
      if (err instanceof Error && err.message.includes('imagen')) {
        showWarning(err.message)
      } else {
        showApiError(err, 'No se pudo subir el comprobante')
      }
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.deleteStoreSale(sale.id)
      showSuccess('Movimiento eliminado. Stock y totales de caja actualizados.')
      setConfirmDelete(false)
      onDeleted?.(sale.id)
    } catch (err) {
      showApiError(err, 'No se pudo eliminar el movimiento')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <article className={`store-history-item card type-${sale.type.toLowerCase()}`}>
      <header>
        <div>
          <strong>{typeLabel(sale.type)}</strong>
          <span>
            {formatDateTime(sale.createdAt)}
            {sale.memberName ? ` · ${sale.memberName}` : ''}
            {` · ${sale.createdByName}`}
            {sale.type === 'SALE'
              ? ` · ${formatSalePaymentsSummary(sale.payments, sale.paymentMethod, sale.total)}`
              : ''}
            {sale.hasPaymentProof ? ' · Comprobante' : ''}
          </span>
        </div>
        <strong className={sale.type === 'MANUAL_EXPENSE' ? 'is-expense' : ''}>
          {sale.type === 'MANUAL_EXPENSE' ? '−' : ''}
          {formatMoney(sale.total)}
        </strong>
      </header>
      <ul>
        {sale.items.map((item) => (
          <li key={item.id}>
            {item.quantity}× {item.description}
            <span>{formatMoney(item.lineTotal)}</span>
          </li>
        ))}
      </ul>
      {sale.notes && <p className="form-hint">{sale.notes}</p>}
      <div className="store-history-proof-actions">
        {canAttachSinpe && (
          <>
            {sale.hasPaymentProof ? (
              <button type="button" className="btn-secondary" disabled={loadingProof} onClick={() => void viewProof()}>
                {loadingProof ? 'Cargando…' : 'Ver comprobante'}
              </button>
            ) : null}
            <label className="btn-secondary store-history-proof-upload">
              {uploading ? 'Subiendo…' : sale.hasPaymentProof ? 'Reemplazar comprobante' : 'Subir comprobante SINPE'}
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file) void uploadProof(file)
                }}
              />
            </label>
          </>
        )}
        {canDelete && (
          <button
            type="button"
            className="btn-secondary btn-danger-outline"
            onClick={() => setConfirmDelete(true)}
          >
            Eliminar
          </button>
        )}
      </div>
      {viewingProof && (
        <div
          className="modal-overlay confirm-dialog-overlay"
          onClick={() => setViewingProof(null)}
          role="presentation"
        >
          <div className="modal card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <h2>Comprobante SINPE · venta #{sale.id}</h2>
            <img className="store-history-proof-img" src={viewingProof} alt="Comprobante SINPE" />
            <div className="modal-actions">
              <button type="button" className="btn-primary" onClick={() => setViewingProof(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar movimiento"
        message={
          sale.type === 'SALE'
            ? `Se eliminará la venta #${sale.id} (${formatMoney(sale.total)}). Se devolverá el stock y, si aplica, se anulará la membresía asignada. Solo es posible mientras la caja siga abierta.`
            : `Se eliminará este movimiento (${formatMoney(sale.total)}). Solo es posible mientras la caja siga abierta.`
        }
        confirmLabel="Eliminar"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => !deleting && setConfirmDelete(false)}
      />
    </article>
  )
}

function CollapsibleGroup({
  group,
  expanded,
  onToggle,
  onSaleUpdated,
  onSaleDeleted,
}: {
  group: SaleGroup
  expanded: boolean
  onToggle: () => void
  onSaleUpdated?: (sale: StoreSale) => void
  onSaleDeleted?: (saleId: number) => void
}) {
  return (
    <section className={`store-history-session card${expanded ? ' is-expanded' : ''}`}>
      <button
        type="button"
        className="store-history-session-head store-history-session-toggle"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <div className="store-history-session-toggle-main">
          <span className="store-history-chevron" aria-hidden>
            {expanded ? '▾' : '▸'}
          </span>
          <div>
            <strong>
              {group.title}
              {group.badge && (
                <span className={`store-history-badge store-history-badge--${group.badgeTone ?? 'neutral'}`}>
                  {group.badge}
                </span>
              )}
            </strong>
            {group.subtitle && <span>{group.subtitle}</span>}
            {group.meta && <span>{group.meta}</span>}
          </div>
        </div>
        <div className="store-history-session-totals">
          <span>{group.totalsHint ?? 'Neto'}</span>
          <strong>{formatMoney(group.summary.netTotal)}</strong>
          <small>{group.summary.saleCount} mov.</small>
        </div>
      </button>

      {expanded && (
        <div className="store-history-session-body">
          {group.session?.id != null && (
            <div className="store-history-session-meta">
              <span>Apertura {formatMoney(group.session.openingTotal)}</span>
              {group.session.status === 'CLOSED' && group.session.closingTotal != null && (
                <span>
                  Cierre {formatMoney(group.session.closingTotal)}
                  {group.session.expectedClosingTotal != null &&
                    ` (esperado ${formatMoney(group.session.expectedClosingTotal)})`}
                </span>
              )}
            </div>
          )}
          {group.sales.length === 0 ? (
            <p className="form-hint">Sin movimientos en este grupo.</p>
          ) : (
            <div className="store-history-list">
              {group.sales.map((sale) => (
                <SaleCard
                  key={sale.id}
                  sale={sale}
                  onUpdated={onSaleUpdated}
                  onDeleted={onSaleDeleted}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function groupsFromDayReport(report: CashDayReport, filters: HistoryFilters): SaleGroup[] {
  return report.sessions.map((block, index) => {
    const session = block.session
    const filtered = block.sales.filter((s) => saleMatchesFilters(s, filters))
    const key = session.id != null ? `session-${session.id}` : `orphan-${index}`
    const isOpen = session.status === 'OPEN'
    const isClosed = session.status === 'CLOSED'
    return {
      key,
      title: session.id != null ? `Caja #${session.id}` : 'Sin caja',
      badge: isOpen ? 'Abierta' : isClosed ? 'Cerrada' : undefined,
      badgeTone: isOpen ? 'open' : isClosed ? 'closed' : 'neutral',
      subtitle: session.openedAt ? sessionRangeLabel(session) : 'Movimientos sin sesión de caja',
      meta: [
        session.openedByName,
        session.closedByName ? `→ ${session.closedByName}` : null,
        session.notes,
      ]
        .filter(Boolean)
        .join(' · '),
      totalsHint: 'Neto turno',
      summary: summarizeSales(filtered),
      sales: filtered,
      session,
    }
  })
}

function groupsByDay(sales: StoreSale[]): SaleGroup[] {
  const map = new Map<string, StoreSale[]>()
  for (const sale of sales) {
    const key = saleLocalDate(sale)
    const list = map.get(key)
    if (list) list.push(sale)
    else map.set(key, [sale])
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([day, daySales]) => ({
      key: `day-${day}`,
      title: formatDayHeading(day),
      subtitle: day,
      totalsHint: 'Neto del día',
      summary: summarizeSales(daySales),
      sales: daySales,
    }))
}

function groupsByMonth(sales: StoreSale[]): SaleGroup[] {
  const map = new Map<string, StoreSale[]>()
  for (const sale of sales) {
    const d = new Date(sale.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const list = map.get(key)
    if (list) list.push(sale)
    else map.set(key, [sale])
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([ym, monthSales]) => {
      const [y, m] = ym.split('-').map(Number)
      return {
        key: `month-${ym}`,
        title: formatMonthHeading(y, m - 1),
        subtitle: ym,
        totalsHint: 'Neto del mes',
        summary: summarizeSales(monthSales),
        sales: monthSales,
      }
    })
}

export default function TiendaHistorialSection() {
  const { showApiError, showSuccess, showWarning } = useToast()
  const [period, setPeriod] = useState<Period>('day')
  const [date, setDate] = useState(todayIso())
  const [sales, setSales] = useState<StoreSale[]>([])
  const [dayReport, setDayReport] = useState<CashDayReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<HistoryFilters>(emptyFilters)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [manualKind, setManualKind] = useState<ManualKind | null>(null)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (period === 'day') {
        const report = await api.getCashDayReport(date)
        setDayReport(report)
        setSales([])
      } else {
        const list = await api.getStoreSales(period, date)
        setSales(list)
        setDayReport(null)
      }
    } catch (err) {
      showApiError(err, 'No se pudo cargar el historial')
    } finally {
      setLoading(false)
    }
  }, [period, date, showApiError])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setFilters(emptyFilters())
  }, [period, date])

  const filteredSales = useMemo(
    () => sales.filter((s) => saleMatchesFilters(s, filters)),
    [sales, filters],
  )

  const groups = useMemo((): SaleGroup[] => {
    if (period === 'day' && dayReport) {
      return groupsFromDayReport(dayReport, filters)
    }
    if (period === 'month') return groupsByDay(filteredSales)
    if (period === 'year') return groupsByMonth(filteredSales)
    return []
  }, [period, dayReport, filters, filteredSales])

  const groupKeysSignature = useMemo(
    () => groups.map((g) => g.key).join('\0'),
    [groups],
  )

  // Al cargar (o cambiar periodo/fecha/datos), días/meses/cajas quedan abiertos
  useEffect(() => {
    if (loading) return
    const keys = groupKeysSignature ? groupKeysSignature.split('\0').filter(Boolean) : []
    const next: Record<string, boolean> = {}
    for (const key of keys) next[key] = true
    setExpanded(next)
  }, [loading, period, date, groupKeysSignature])

  const visibleSummary = useMemo(() => {
    if (period === 'day') {
      const all = groups.flatMap((g) => g.sales)
      return summarizeSales(all)
    }
    return summarizeSales(filteredSales)
  }, [period, groups, filteredSales])

  const hasActiveFilters =
    !!filters.dateFrom ||
    !!filters.dateTo ||
    !!filters.client.trim() ||
    !!filters.item.trim() ||
    !!filters.paymentMethod

  const patchSale = useCallback((updated: StoreSale) => {
    setSales((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    setDayReport((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sessions: prev.sessions.map((block) => ({
          ...block,
          sales: block.sales.map((s) => (s.id === updated.id ? updated : s)),
        })),
      }
    })
  }, [])

  const handleSaleDeleted = useCallback((_saleId: number) => {
    void load()
  }, [load])

  const displayGroups = useMemo(() => {
    if (!hasActiveFilters) return groups
    return groups.filter((g) => g.sales.length > 0)
  }, [groups, hasActiveFilters])

  const dayEmpty =
    period === 'day' &&
    dayReport != null &&
    dayReport.sessions.length === 0 &&
    dayReport.daySummary.saleCount === 0

  const listEmpty = !loading && !dayEmpty && displayGroups.length === 0

  const toggleGroup = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }))
  }

  const expandAll = () => {
    const next: Record<string, boolean> = {}
    for (const g of groups) next[g.key] = true
    setExpanded(next)
  }

  const collapseAll = () => {
    const next: Record<string, boolean> = {}
    for (const g of groups) next[g.key] = false
    setExpanded(next)
  }

  const closeManual = () => {
    if (saving) return
    setManualKind(null)
    setAmount('')
    setNotes('')
  }

  const submitManual = async () => {
    if (!manualKind) return
    const value = parseFloat(amount)
    if (!Number.isFinite(value) || value <= 0) {
      showWarning('Indica un monto válido')
      return
    }
    if (!notes.trim()) {
      showWarning('Describe el movimiento')
      return
    }
    setSaving(true)
    try {
      await api.createStoreManualEntry({ type: manualKind, amount: value, notes: notes.trim() })
      showSuccess(manualKind === 'MANUAL_INCOME' ? 'Ingreso registrado' : 'Gasto registrado')
      closeManual()
      await load()
    } catch (err) {
      showApiError(err, 'No se pudo registrar el movimiento')
    } finally {
      setSaving(false)
    }
  }

  const onPeriodChange = (next: Period) => {
    setPeriod(next)
    if (next === 'month') {
      setDate((d) => `${monthInputValue(d)}-01`)
    } else if (next === 'year') {
      setDate((d) => `${yearInputValue(d)}-01-01`)
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date.endsWith('-01') && period !== 'day') {
      setDate(todayIso())
    }
  }

  return (
    <div className="store-history">
      <div className="store-history-toolbar">
        <div className="product-manage-tabs" role="tablist">
          {([
            ['day', 'Día'],
            ['month', 'Mes'],
            ['year', 'Año'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`product-manage-tab${period === id ? ' active' : ''}`}
              onClick={() => onPeriodChange(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {period === 'day' && (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value || todayIso())}
            aria-label="Fecha del día"
          />
        )}
        {period === 'month' && (
          <input
            type="month"
            value={monthInputValue(date)}
            onChange={(e) => {
              const v = e.target.value
              setDate(v ? `${v}-01` : `${monthInputValue(todayIso())}-01`)
            }}
            aria-label="Mes"
          />
        )}
        {period === 'year' && (
          <input
            type="number"
            min={2000}
            max={2100}
            step={1}
            value={yearInputValue(date)}
            onChange={(e) => {
              const y = parseInt(e.target.value, 10)
              if (Number.isFinite(y) && y >= 2000) setDate(`${y}-01-01`)
            }}
            aria-label="Año"
            style={{ width: '6.5rem' }}
          />
        )}

        <div className="store-history-actions">
          <button type="button" className="btn-secondary" onClick={() => setManualKind('MANUAL_INCOME')}>
            + Ingreso
          </button>
          <button type="button" className="btn-secondary" onClick={() => setManualKind('MANUAL_EXPENSE')}>
            + Gasto
          </button>
        </div>
      </div>

      <div className="store-history-filters card">
        <div className="store-history-filters-grid">
          <label className="form-group">
            Desde
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
            />
          </label>
          <label className="form-group">
            Hasta
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
            />
          </label>
          <label className="form-group">
            Cliente
            <input
              type="search"
              placeholder="Nombre del miembro"
              value={filters.client}
              onChange={(e) => setFilters((f) => ({ ...f, client: e.target.value }))}
            />
          </label>
          <label className="form-group">
            Producto o membresía
            <input
              type="search"
              placeholder="Buscar en el detalle"
              value={filters.item}
              onChange={(e) => setFilters((f) => ({ ...f, item: e.target.value }))}
            />
          </label>
          <label className="form-group">
            Método de pago
            <select
              value={filters.paymentMethod}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  paymentMethod: e.target.value as PaymentFilter,
                }))
              }
            >
              <option value="">Todos</option>
              <option value="CASH">Efectivo</option>
              <option value="CARD">Tarjeta</option>
              <option value="SINPE">SINPE</option>
            </select>
          </label>
        </div>
        <div className="store-history-filters-actions">
          <button
            type="button"
            className="btn-secondary"
            disabled={!hasActiveFilters}
            onClick={() => setFilters(emptyFilters())}
          >
            Limpiar filtros
          </button>
          {groups.length > 0 && (
            <>
              <button type="button" className="btn-secondary" onClick={expandAll}>
                Expandir todo
              </button>
              <button type="button" className="btn-secondary" onClick={collapseAll}>
                Colapsar todo
              </button>
            </>
          )}
        </div>
      </div>

      {!loading && (
        <div>
          <p className="form-hint store-history-day-hint">
            {period === 'day' && (
              <>
                Total del día
                {dayReport && dayReport.sessions.length > 0
                  ? ` · ${dayReport.sessions.length} caja${dayReport.sessions.length === 1 ? '' : 's'}`
                  : ''}
              </>
            )}
            {period === 'month' && <>Total del mes · agrupado por día</>}
            {period === 'year' && <>Total del año · agrupado por mes</>}
            {hasActiveFilters ? ' · filtrado' : ''}
          </p>
          <SummaryCards summary={visibleSummary} />
        </div>
      )}

      {loading ? (
        <div className="empty-state card">Cargando historial…</div>
      ) : dayEmpty ? (
        <div className="empty-state card">No hay cajas ni movimientos en este día.</div>
      ) : listEmpty ? (
        <div className="empty-state card">
          {hasActiveFilters
            ? 'Ningún movimiento coincide con los filtros.'
            : 'No hay movimientos en este periodo.'}
        </div>
      ) : (
        <div className="store-history-sessions">
          {displayGroups.map((group) => (
            <CollapsibleGroup
              key={group.key}
              group={group}
              expanded={expanded[group.key] ?? true}
              onToggle={() => toggleGroup(group.key)}
              onSaleUpdated={patchSale}
              onSaleDeleted={handleSaleDeleted}
            />
          ))}
        </div>
      )}

      {manualKind != null && (
        <div className="modal-overlay confirm-dialog-overlay" onClick={closeManual} role="presentation">
          <div
            className="modal card availability-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2>{manualKind === 'MANUAL_INCOME' ? 'Registrar ingreso' : 'Registrar gasto'}</h2>
            <p className="confirm-dialog-message">
              Requiere caja abierta. El monto afecta el cierre del turno actual.
            </p>
            <label className="form-group">
              Monto (₡)
              <input
                type="number"
                min={0}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </label>
            <label className="form-group">
              Descripción
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={manualKind === 'MANUAL_INCOME' ? 'Ej. fondo extra' : 'Ej. compra de insumos'}
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={closeManual} disabled={saving}>
                Cancelar
              </button>
              <button
                type="button"
                className={manualKind === 'MANUAL_EXPENSE' ? 'btn-danger' : 'btn-primary'}
                onClick={() => void submitManual()}
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

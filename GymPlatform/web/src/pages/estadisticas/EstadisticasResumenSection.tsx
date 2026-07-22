import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, ApiError } from '../../api'
import { useAuth } from '../../auth'
import { useToast } from '../../toast'
import type { StatisticsDashboard } from '../../types'
import { toIsoDate } from '../../utils/calendarUtils'
import { formatMoney, formatMoneyAxis } from '../../utils/money'
import {
  clearStatsUnlock,
  writeStatsUnlock,
} from '../../utils/statsUnlock'

type Period = 'day' | 'month' | 'year'

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#0ea5e9', '#8b5cf6', '#14b8a6', '#e11d48']

function todayIso() {
  return toIsoDate(new Date())
}

function monthInputValue(isoDate: string) {
  return isoDate.slice(0, 7)
}

function yearInputValue(isoDate: string) {
  return isoDate.slice(0, 4)
}

function ChangeHint({ value, goodWhenUp = true }: { value: number; goodWhenUp?: boolean }) {
  const n = Number(value) || 0
  if (n === 0) {
    return <span className="stats-kpi-change is-flat">Casi igual que la vez anterior</span>
  }
  const up = n > 0
  const positive = goodWhenUp ? up : !up
  const abs = Math.abs(n)
  const howMuch = abs >= 10 ? 'bastante' : 'un poco'
  const direction = up ? 'más' : 'menos'
  return (
    <span className={`stats-kpi-change ${positive ? 'is-up' : 'is-down'}`}>
      {howMuch} {direction} que la vez anterior
    </span>
  )
}

function ChartTooltipMoney({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="stats-chart-tooltip">
      {label && <strong>{label}</strong>}
      {payload.map((p) => (
        <div key={String(p.name)} style={{ color: p.color }}>
          {p.name}: {formatMoney(Number(p.value) || 0)}
        </div>
      ))}
    </div>
  )
}

export default function EstadisticasResumenSection() {
  const { user } = useAuth()
  const { showApiError, showSuccess } = useToast()
  const orgId = user?.organizationId ?? null

  const [gateReady, setGateReady] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [unlockToken, setUnlockToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [unlocking, setUnlocking] = useState(false)

  const [period, setPeriod] = useState<Period>('month')
  const [date, setDate] = useState(todayIso())
  const [dashboard, setDashboard] = useState<StatisticsDashboard | null>(null)
  const [loadingDash, setLoadingDash] = useState(false)
  const showApiErrorRef = useRef(showApiError)
  showApiErrorRef.current = showApiError

  // Siempre pedir contraseña al entrar a Estadísticas (no reutilizar sesión previa).
  useEffect(() => {
    clearStatsUnlock(orgId)
    setUnlockToken(null)
    setDashboard(null)
    setGateReady(false)
    let cancelled = false
    void (async () => {
      try {
        const access = await api.getStatisticsAccess()
        if (!cancelled) setConfigured(access.configured)
      } catch (err) {
        if (!cancelled) {
          setConfigured(false)
          showApiErrorRef.current(err, 'No se pudo verificar el acceso a estadísticas')
        }
      } finally {
        if (!cancelled) setGateReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [orgId])

  useEffect(() => {
    if (!unlockToken) return
    let cancelled = false
    void (async () => {
      setLoadingDash(true)
      try {
        const data = await api.getStatisticsDashboard(period, date, unlockToken)
        if (!cancelled) setDashboard(data)
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : ''
        const status = err instanceof ApiError ? err.status : 0
        const needsRelock = status === 400
          || msg.includes('desbloquear')
          || msg.includes('expirada')
          || msg.includes('inválida')
          || msg.includes('administrador debe definir')
        if (needsRelock) {
          clearStatsUnlock(orgId)
          setUnlockToken(null)
          setDashboard(null)
          if (msg.includes('administrador debe definir')) {
            setConfigured(false)
          }
        }
        showApiErrorRef.current(err, 'No se pudo cargar el dashboard')
      } finally {
        if (!cancelled) setLoadingDash(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [unlockToken, period, date, orgId])

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    const pwd = password.trim()
    if (pwd.length < 4) {
      showApiError(new Error('Mínimo 4 caracteres'), 'Contraseña muy corta')
      return
    }
    setUnlocking(true)
    try {
      if (!configured) {
        await api.setStatisticsAccess(pwd)
        setConfigured(true)
        showSuccess('Contraseña de áreas privadas guardada')
      }
      const result = await api.unlockStatistics(pwd)
      writeStatsUnlock(orgId, { token: result.unlockToken, expiresAt: result.expiresAt })
      setUnlockToken(result.unlockToken)
      setPassword('')
      setShowPassword(false)
      showSuccess('Área privada desbloqueada')
    } catch (err) {
      if (err instanceof ApiError && err.message.includes('administrador debe definir')) {
        setConfigured(false)
      }
      showApiError(err, configured ? 'No se pudo desbloquear' : 'No se pudo guardar la contraseña')
    } finally {
      setUnlocking(false)
    }
  }

  const lockAgain = () => {
    clearStatsUnlock(orgId)
    setUnlockToken(null)
    setDashboard(null)
  }

  const changePeriod = (next: Period) => {
    setPeriod(next)
    if (next === 'month') {
      setDate((d) => `${monthInputValue(d)}-01`)
    } else if (next === 'year') {
      setDate((d) => `${yearInputValue(d)}-01-01`)
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setDate(todayIso())
    }
  }

  const pieCategory = useMemo(
    () => (dashboard?.byCategory ?? []).map((c) => ({ name: c.name, value: Number(c.amount) })),
    [dashboard],
  )
  const piePayments = useMemo(
    () => (dashboard?.byPaymentMethod ?? []).map((c) => ({ name: c.name, value: Number(c.amount) })),
    [dashboard],
  )
  const topProducts = useMemo(
    () => (dashboard?.topProducts ?? []).map((c) => ({
      name: c.name.length > 28 ? `${c.name.slice(0, 26)}…` : c.name,
      fullName: c.name,
      amount: Number(c.amount),
    })),
    [dashboard],
  )
  const compareBars = useMemo(
    () => (dashboard?.incomeVsExpense ?? []).map((c) => ({
      name: c.name,
      amount: Number(c.amount),
    })),
    [dashboard],
  )

  if (!gateReady) {
    return <p className="text-muted">Verificando acceso…</p>
  }

  if (!unlockToken) {
    return (
      <div className="stats-lock-card card">
        <div className="stats-lock-icon" aria-hidden>🔒</div>
        <h2>Área privada</h2>
        <p>
          {configured
            ? 'Escribe la contraseña de áreas privadas para ver ingresos, gastos y ventas.'
            : 'Aún no hay contraseña. Créala ahora para proteger Estadísticas (mínimo 4 caracteres).'}
        </p>
        <form onSubmit={(e) => void handleUnlock(e)} className="stats-lock-form">
          <label htmlFor="stats-unlock-password">
            {configured ? 'Contraseña' : 'Nueva contraseña'}
          </label>
          <div className="statistics-access-password-row">
            <input
              id="stats-unlock-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={configured ? 'Contraseña' : 'Ej. 12345678'}
              autoComplete={configured ? 'current-password' : 'new-password'}
              autoFocus
              required
              minLength={4}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Ocultar' : 'Ver'}
            </button>
          </div>
          <button type="submit" className="btn-primary" disabled={unlocking}>
            {unlocking
              ? (configured ? 'Entrando…' : 'Guardando…')
              : (configured ? 'Entrar' : 'Crear y entrar')}
          </button>
        </form>
      </div>
    )
  }

  const kpis = dashboard?.kpis

  return (
    <div className="stats-dashboard">
      <div className="stats-dashboard-toolbar">
        <div className="product-manage-tabs" role="tablist">
          {([
            ['day', 'Día'],
            ['month', 'Mes'],
            ['year', 'Año'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              className={`product-manage-tab${period === id ? ' active' : ''}`}
              aria-selected={period === id}
              onClick={() => changePeriod(id)}
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
          />
        )}
        {period === 'year' && (
          <input
            type="number"
            min={2000}
            max={2100}
            value={yearInputValue(date)}
            onChange={(e) => {
              const y = Number(e.target.value)
              if (Number.isFinite(y) && y >= 2000) setDate(`${y}-01-01`)
            }}
          />
        )}
        <button type="button" className="btn-secondary" onClick={lockAgain}>
          Bloquear
        </button>
      </div>

      {loadingDash && !dashboard ? (
        <p className="text-muted">Cargando dashboard…</p>
      ) : dashboard && kpis ? (
        <>
          <header className="stats-story-header">
            <h2>{dashboard.periodLabel}</h2>
            <p>
              Un vistazo amable a cómo le fue al gimnasio: cuánto dinero entró, cuánto salió
              y qué se vendió más. Los montos están en colones.
            </p>
          </header>

          <section className="stats-kpi-grid">
            <article className="card stats-kpi-card">
              <span className="stats-kpi-label">Dinero que entró</span>
              <strong>{formatMoney(Number(kpis.incomeTotal))}</strong>
              <ChangeHint value={Number(kpis.incomeChangePct)} />
            </article>
            <article className="card stats-kpi-card">
              <span className="stats-kpi-label">Dinero que salió</span>
              <strong>{formatMoney(Number(kpis.expenseTotal))}</strong>
              <ChangeHint value={Number(kpis.expenseChangePct)} goodWhenUp={false} />
            </article>
            <article className="card stats-kpi-card stats-kpi-card--net">
              <span className="stats-kpi-label">Lo que quedó</span>
              <strong>{formatMoney(Number(kpis.netTotal))}</strong>
              <ChangeHint value={Number(kpis.netChangePct)} />
            </article>
            <article className="card stats-kpi-card">
              <span className="stats-kpi-label">Ventas en tienda</span>
              <strong>{formatMoney(Number(kpis.salesTotal))}</strong>
              <span className="stats-kpi-change is-flat">
                {kpis.saleCount === 1 ? '1 cobro' : `${kpis.saleCount} cobros`}
              </span>
            </article>
            <article className="card stats-kpi-card">
              <span className="stats-kpi-label">Promedio por venta</span>
              <strong>{formatMoney(Number(kpis.averageTicket))}</strong>
              <span className="stats-kpi-change is-flat">Si divides todo entre los cobros</span>
            </article>
          </section>

          <section className="card stats-chart-card">
            <h3>Cómo se movió el dinero día a día</h3>
            <p className="form-hint">
              Cada punto es un día (o mes). Verde = entró, azul = ventas, rojo = salió.
              Pasa el mouse para ver el monto exacto.
            </p>
            <div className="stats-chart-wrap">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={dashboard.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} width={72} tickFormatter={(v) => formatMoneyAxis(Number(v))} />
                  <Tooltip content={<ChartTooltipMoney />} />
                  <Legend />
                  <Area type="monotone" dataKey="income" name="Entró" stroke="#10b981" fill="#10b98155" />
                  <Area type="monotone" dataKey="sales" name="Ventas" stroke="#6366f1" fill="#6366f155" />
                  <Area type="monotone" dataKey="expense" name="Salió" stroke="#f43f5e" fill="#f43f5e44" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="stats-charts-row">
            <section className="card stats-chart-card">
              <h3>Ingresos vs gastos</h3>
              <p className="form-hint">Comparación directa del periodo. Pasa el mouse para ver colones exactos.</p>
              <div className="stats-chart-wrap">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={compareBars}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis width={72} tickFormatter={(v) => formatMoneyAxis(Number(v))} />
                    <Tooltip content={<ChartTooltipMoney />} />
                    <Bar dataKey="amount" name="Monto" radius={[8, 8, 0, 0]}>
                      {compareBars.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.name === 'Gastos' ? '#f43f5e' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="card stats-chart-card">
              <h3>¿En qué se vende?</h3>
              <p className="form-hint">Por categoría de producto (y membresías).</p>
              {pieCategory.length === 0 ? (
                <p className="empty-state">Aún no hay ventas en este periodo.</p>
              ) : (
                <div className="stats-chart-wrap">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={pieCategory}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {pieCategory.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatMoney(Number(v) || 0)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>

          <div className="stats-charts-row">
            <section className="card stats-chart-card">
              <h3>Productos que más venden</h3>
              <p className="form-hint">Top 8 por monto. Pasa el mouse para ver el nombre completo y colones.</p>
              {topProducts.length === 0 ? (
                <p className="empty-state">Sin productos vendidos en este periodo.</p>
              ) : (
                <div className="stats-chart-wrap">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topProducts} layout="vertical" margin={{ left: 8, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis type="number" tickFormatter={(v) => formatMoneyAxis(Number(v))} />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(v) => formatMoney(Number(v) || 0)}
                        labelFormatter={(_, payload) => {
                          const row = payload?.[0]?.payload as { fullName?: string } | undefined
                          return row?.fullName ?? ''
                        }}
                      />
                      <Bar dataKey="amount" name="Ventas" fill="#6366f1" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="card stats-chart-card">
              <h3>Cómo pagan los clientes</h3>
              <p className="form-hint">Efectivo, tarjeta y SINPE.</p>
              {piePayments.length === 0 ? (
                <p className="empty-state">Sin cobros registrados.</p>
              ) : (
                <div className="stats-chart-wrap">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={piePayments}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                      >
                        {piePayments.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatMoney(Number(v) || 0)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>
          </div>
        </>
      ) : (
        <div className="empty-state card">No hay datos para mostrar.</div>
      )}
    </div>
  )
}

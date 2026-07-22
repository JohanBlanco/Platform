import { useEffect, useMemo, useState } from 'react'
import type { CashDenomination, CashSession } from '../types'
import { formatDateTime } from '../utils/dateFormat'
import { formatMoney } from '../utils/money'

type Props = {
  mode: 'open' | 'close'
  denominations: CashDenomination[]
  session?: CashSession | null
  /** Fondo configurado; al abrir el conteo debe coincidir. */
  expectedOpeningFloat?: number | null
  saving?: boolean
  onClose: () => void
  onSubmit: (counts: Array<{ valueColones: number; quantity: number }>, notes: string) => void
}

type BalanceTone = 'ok' | 'short' | 'over'

function balanceFromDiff(diff: number): { tone: BalanceTone; label: string } {
  if (diff === 0) return { tone: 'ok', label: 'Cuadra' }
  if (diff < 0) return { tone: 'short', label: `Falta ${formatMoney(Math.abs(diff))}` }
  return { tone: 'over', label: `Sobra ${formatMoney(diff)}` }
}

export default function CashSessionModal({
  mode,
  denominations,
  session,
  expectedOpeningFloat = null,
  saving = false,
  onClose,
  onSubmit,
}: Props) {
  const [qtyByValue, setQtyByValue] = useState<Record<number, string>>({})
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const next: Record<number, string> = {}
    for (const d of denominations) next[d.valueColones] = '0'
    setQtyByValue(next)
    setNotes('')
  }, [denominations, mode])

  const coins = denominations.filter((d) => d.kind === 'COIN')
  const bills = denominations.filter((d) => d.kind === 'BILL')

  const total = useMemo(() => {
    return denominations.reduce((sum, d) => {
      const q = Math.max(0, parseInt(qtyByValue[d.valueColones] ?? '0', 10) || 0)
      return sum + d.valueColones * q
    }, 0)
  }, [denominations, qtyByValue])

  const expectedClose = session
    ? (session.expectedClosingTotal ?? session.openingTotal + session.salesNetTotal)
    : 0
  /** Fondo que debe quedar en la caja para el siguiente turno. */
  const leaveInDrawer = session?.openingTotal ?? 0
  /** Efectivo a retirar (fuera de la caja) una vez cuadrado el conteo. */
  const takeOutOfDrawer = Math.max(0, expectedClose - leaveInDrawer)
  const openBalance = expectedOpeningFloat != null
    ? balanceFromDiff(total - expectedOpeningFloat)
    : null
  const closeBalance = mode === 'close' && session != null
    ? balanceFromDiff(total - expectedClose)
    : null
  const openMatches = openBalance?.tone === 'ok'

  const renderGroup = (title: string, items: CashDenomination[]) => (
    <div className="cash-count-group">
      <h4>{title}</h4>
      <div className="cash-count-rows">
        {items.map((d) => (
          <label key={d.valueColones} className="cash-count-row">
            <span>{formatMoney(d.valueColones)}</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={qtyByValue[d.valueColones] ?? '0'}
              onChange={(e) => setQtyByValue((prev) => ({ ...prev, [d.valueColones]: e.target.value }))}
            />
            <strong>
              {formatMoney(d.valueColones * (Math.max(0, parseInt(qtyByValue[d.valueColones] ?? '0', 10) || 0)))}
            </strong>
          </label>
        ))}
      </div>
    </div>
  )

  return (
    <div className="modal-overlay confirm-dialog-overlay" onClick={onClose} role="presentation">
      <div
        className="modal card availability-modal cash-session-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h2>{mode === 'open' ? 'Abrir caja' : 'Cerrar caja'}</h2>
        <p className="confirm-dialog-message">
          {mode === 'open'
            ? `Se registrará la apertura con la fecha y hora actuales (${formatDateTime(new Date(), 'es')}). El total debe coincidir con el fondo configurado.`
            : session?.openedAt
              ? `Turno abierto el ${formatDateTime(session.openedAt, 'es')}. Al cerrar se guarda la fecha y hora actuales.`
              : 'Cuenta el efectivo al cerrar. El sistema compara con el esperado y registra la hora de cierre.'}
        </p>

        {mode === 'open' && expectedOpeningFloat != null && openBalance && (
          <div className="cash-session-summary">
            <div><span>Fondo esperado</span><strong>{formatMoney(expectedOpeningFloat)}</strong></div>
            <div><span>Contado</span><strong>{formatMoney(total)}</strong></div>
            <div>
              <span>Estado</span>
              <strong className={`cash-balance cash-balance--${openBalance.tone}`}>
                {openBalance.label}
              </strong>
            </div>
          </div>
        )}

        {mode === 'close' && session && (
          <>
            <div className="cash-session-summary">
              <div>
                <span>Abierta</span>
                <strong>
                  {session.openedAt
                    ? formatDateTime(session.openedAt, 'es')
                    : '—'}
                </strong>
              </div>
              <div><span>Apertura</span><strong>{formatMoney(session.openingTotal)}</strong></div>
            <div><span>Movimientos neto en efectivo</span><strong>{formatMoney(session.salesNetTotal)}</strong></div>
            <div><span>Esperado en caja</span><strong>{formatMoney(expectedClose)}</strong></div>
            </div>

            <div className="cash-close-guide" role="status">
              <p className="cash-close-guide-intro">
                Cuenta todo el efectivo. Debe haber <strong>{formatMoney(expectedClose)}</strong> en total.
                Luego quita las ventas del día y deja la base en la caja.
              </p>
              <div className="cash-close-guide-grid">
                <div className="cash-close-guide-card cash-close-guide-card--keep">
                  <span>Base en la caja</span>
                  <strong>{formatMoney(leaveInDrawer)}</strong>
                  <small>Debe quedar esta cantidad</small>
                </div>
                <div className="cash-close-guide-card cash-close-guide-card--take">
                  <span>Ventas del día (efectivo)</span>
                  <strong>{formatMoney(takeOutOfDrawer)}</strong>
                  <small>Se quita de la caja · SINPE/tarjeta no entran</small>
                </div>
              </div>
              {closeBalance && (
                <p className={`cash-close-guide-status cash-balance cash-balance--${closeBalance.tone}`}>
                  {closeBalance.tone === 'ok' && (
                    <>
                      Cuadra. Quita las ventas del día (
                      <strong>{formatMoney(takeOutOfDrawer)}</strong>
                      ) y deja la base (
                      <strong>{formatMoney(leaveInDrawer)}</strong>
                      ) en la caja.
                    </>
                  )}
                  {closeBalance.tone === 'short' && (
                    <>
                      Falta <strong>{formatMoney(Math.abs(total - expectedClose))}</strong> para cuadrar
                      con el esperado ({formatMoney(expectedClose)}). Contado: {formatMoney(total)}.
                    </>
                  )}
                  {closeBalance.tone === 'over' && (
                    <>
                      Sobra <strong>{formatMoney(total - expectedClose)}</strong> respecto al esperado
                      ({formatMoney(expectedClose)}). Contado: {formatMoney(total)}.
                    </>
                  )}
                </p>
              )}
            </div>
          </>
        )}

        <div className="cash-count-columns">
          {coins.length > 0 && renderGroup('Monedas', coins)}
          {bills.length > 0 && renderGroup('Billetes', bills)}
        </div>

        <div className="cash-count-total">
          Total contado: <strong>{formatMoney(total)}</strong>
          {mode === 'open' && openBalance && (
            <span className={`cash-balance cash-balance--${openBalance.tone}`}>
              {openMatches ? ' · Listo para abrir' : ` · ${openBalance.label}`}
            </span>
          )}
          {mode === 'close' && closeBalance && (
            <span className={`cash-balance cash-balance--${closeBalance.tone}`}>
              {' · '}{closeBalance.label}
            </span>
          )}
        </div>

        <label className="form-group">
          Nota (opcional)
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. turno mañana" />
        </label>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={
              saving
              || denominations.length === 0
              || (mode === 'open' && expectedOpeningFloat != null && !openMatches)
            }
            onClick={() => {
              const counts = denominations.map((d) => ({
                valueColones: d.valueColones,
                quantity: Math.max(0, parseInt(qtyByValue[d.valueColones] ?? '0', 10) || 0),
              }))
              onSubmit(counts, notes.trim())
            }}
          >
            {saving ? 'Guardando…' : mode === 'open' ? 'Abrir caja' : 'Cerrar caja'}
          </button>
        </div>
      </div>
    </div>
  )
}

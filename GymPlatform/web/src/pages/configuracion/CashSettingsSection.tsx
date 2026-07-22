import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'
import HorizontalSwitch from '../../components/HorizontalSwitch'
import type { CashDenomination, CashDenominationKind } from '../../types'
import { formatMoney } from '../../utils/money'
import { useToast } from '../../toast'

type Draft = {
  key: string
  id?: number
  valueColones: string
  kind: CashDenominationKind
  active: boolean
}

function toDraft(d: CashDenomination): Draft {
  return {
    key: `id-${d.id}`,
    id: d.id,
    valueColones: String(d.valueColones),
    kind: d.kind,
    active: d.active,
  }
}

export default function CashSettingsSection() {
  const { showApiError, showSuccess, showWarning } = useToast()
  const [openingFloat, setOpeningFloat] = useState('45000')
  const [systemIvaPercent, setSystemIvaPercent] = useState('13')
  const [rows, setRows] = useState<Draft[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const settings = await api.getCashSettings()
      setOpeningFloat(String(Math.round(Number(settings.openingFloatColones) || 45000)))
      setSystemIvaPercent(String(Number(settings.systemIvaPercent ?? 13)))
      setRows(settings.denominations.map(toDraft))
    } catch (err) {
      showApiError(err, 'No se pudo cargar la configuración de caja')
    } finally {
      setLoading(false)
    }
  }, [showApiError])

  useEffect(() => {
    void load()
  }, [load])

  const coins = rows.filter((r) => r.kind === 'COIN')
  const bills = rows.filter((r) => r.kind === 'BILL')

  const addRow = (kind: CashDenominationKind) => {
    setRows((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}-${kind}`,
        valueColones: '',
        kind,
        active: true,
      },
    ])
  }

  const updateRow = (key: string, patch: Partial<Draft>) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key))
  }

  const save = async () => {
    const floatValue = parseInt(openingFloat, 10)
    if (!Number.isFinite(floatValue) || floatValue < 0) {
      showWarning('Indica un fondo de caja válido')
      return
    }
    const ivaValue = parseFloat(systemIvaPercent)
    if (!Number.isFinite(ivaValue) || ivaValue < 0 || ivaValue > 100) {
      showWarning('Indica un I.V.A. del sistema entre 0 y 100')
      return
    }
    const ordered = [...coins, ...bills]
    const payload = ordered.map((row, index) => {
      const value = parseInt(row.valueColones, 10)
      return {
        id: row.id,
        valueColones: value,
        kind: row.kind,
        sortOrder: index + 1,
        active: row.active,
      }
    })
    if (payload.length === 0) {
      showWarning('Agrega al menos una moneda o billete')
      return
    }
    if (payload.some((p) => !Number.isFinite(p.valueColones) || p.valueColones < 1)) {
      showWarning('Todas las denominaciones deben tener un valor válido')
      return
    }
    setSaving(true)
    try {
      const saved = await api.updateCashSettings({
        openingFloatColones: floatValue,
        systemIvaPercent: ivaValue,
        denominations: payload,
      })
      setOpeningFloat(String(Math.round(Number(saved.openingFloatColones) || floatValue)))
      setSystemIvaPercent(String(Number(saved.systemIvaPercent ?? ivaValue)))
      setRows(saved.denominations.map(toDraft))
      showSuccess('Configuración de caja guardada')
    } catch (err) {
      showApiError(err, 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const renderSection = (title: string, kind: CashDenominationKind, items: Draft[]) => (
    <section className="cash-settings-panel card">
      <header className="cash-settings-panel-head">
        <h3>{title}</h3>
        <button type="button" className="btn-secondary" onClick={() => addRow(kind)}>
          + Agregar
        </button>
      </header>
      {items.length === 0 ? (
        <p className="form-hint">Sin {title.toLowerCase()} configuradas.</p>
      ) : (
        <div className="cash-settings-list">
          {items.map((row) => (
            <div key={row.key} className="cash-settings-row cash-settings-row--split">
              <input
                type="number"
                min={1}
                value={row.valueColones}
                onChange={(e) => updateRow(row.key, { valueColones: e.target.value })}
                placeholder="Valor"
                aria-label={`Valor ${title.slice(0, -1).toLowerCase()}`}
              />
              <span className="cash-settings-preview">
                {row.valueColones ? formatMoney(parseInt(row.valueColones, 10) || 0) : '—'}
              </span>
              <HorizontalSwitch
                compact
                id={`den-active-${row.key}`}
                label="Activa"
                checked={row.active}
                onChange={(active) => updateRow(row.key, { active })}
              />
              <button type="button" className="btn-secondary" onClick={() => removeRow(row.key)}>
                Quitar
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )

  if (loading) {
    return <div className="empty-state card">Cargando…</div>
  }

  return (
    <div className="cash-settings">
      <section className="cash-settings-float card">
        <h3>Fondo de caja</h3>
        <p className="form-hint">
          Monto que debe haber al abrir la caja. El conteo de apertura tiene que coincidir exactamente.
        </p>
        <label className="form-group" style={{ marginBottom: 0 }}>
          Monto (₡)
          <input
            type="number"
            min={0}
            step={1}
            value={openingFloat}
            onChange={(e) => setOpeningFloat(e.target.value)}
          />
          <small className="form-hint">
            Actual: <strong>{formatMoney(parseInt(openingFloat, 10) || 0)}</strong>
            {' '}· Default: {formatMoney(45000)}
          </small>
        </label>
      </section>

      <section className="cash-settings-float card">
        <h3>I.V.A. en el sistema</h3>
        <p className="form-hint">
          Porcentaje de referencia para cobros y formularios de productos/membresías cuando se aplica I.V.A.
        </p>
        <label className="form-group" style={{ marginBottom: 0 }}>
          Porcentaje (%)
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={systemIvaPercent}
            onChange={(e) => setSystemIvaPercent(e.target.value)}
          />
          <small className="form-hint">
            Actual: <strong>{parseFloat(systemIvaPercent) || 0}%</strong>
            {' '}· Default: 13%
          </small>
        </label>
      </section>

      <div className="cash-settings-columns">
        {renderSection('Monedas', 'COIN', coins)}
        {renderSection('Billetes', 'BILL', bills)}
      </div>

      <div className="cash-settings-actions">
        <button type="button" className="btn-primary" onClick={() => void save()} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </div>
    </div>
  )
}

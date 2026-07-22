import { useEffect, useState } from 'react'
import { api } from '../../api'
import AdminFormModal from '../../components/AdminFormModal'
import type { MembershipPackage } from '../../types'
import { useFilteredList } from '../../hooks/useFilteredList'
import HorizontalSwitch from '../../components/HorizontalSwitch'
import { DEFAULT_IVA_PERCENT, describeIva, ivaPayload, priceWithIva, readIvaFromProduct } from '../../utils/priceAddons'
import { formatMoney } from '../../utils/money'

const emptyForm = (systemIvaPercent = DEFAULT_IVA_PERCENT) => ({
  name: '',
  price: '',
  description: '',
  addonName: '',
  addonPrice: '',
  unlimitedFreeActivities: true,
  freeActivityQuota: '',
  applyIva: false,
  ivaPercent: String(systemIvaPercent),
})

export default function PackagesSection() {
  const [packages, setPackages] = useState<MembershipPackage[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [systemIvaPercent, setSystemIvaPercent] = useState(DEFAULT_IVA_PERCENT)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const isEditing = selectedId !== null

  const load = () => {
    Promise.all([api.getPackages(), api.getCashOpeningFloat()])
      .then(([pkgs, cash]) => {
        setPackages(pkgs)
        const iva = Number(cash.systemIvaPercent)
        setSystemIvaPercent(Number.isFinite(iva) ? iva : DEFAULT_IVA_PERCENT)
      })
      .catch(() => {})
  }

  useEffect(() => { load() }, [])

  const { filtered, filterInput } = useFilteredList(packages)

  const closeModal = () => {
    setModalOpen(false)
    setSelectedId(null)
    setForm(emptyForm(systemIvaPercent))
  }

  const openCreate = () => {
    setSelectedId(null)
    setForm(emptyForm(systemIvaPercent))
    setModalOpen(true)
  }

  const openEdit = (pkg: MembershipPackage) => {
    const firstAddon = pkg.addons[0]
    const iva = readIvaFromProduct(pkg)
    setSelectedId(pkg.id)
    setForm({
      name: pkg.name,
      price: String(pkg.price),
      description: pkg.description ?? '',
      addonName: firstAddon?.name ?? '',
      addonPrice: firstAddon ? String(firstAddon.price) : '',
      unlimitedFreeActivities: pkg.freeActivityQuota == null,
      freeActivityQuota: pkg.freeActivityQuota != null ? String(pkg.freeActivityQuota) : '',
      applyIva: iva.enabled,
      ivaPercent: iva.percent,
    })
    setModalOpen(true)
  }

  const buildPayload = () => {
    const addons = form.addonName
      ? [{ name: form.addonName, description: '', price: parseFloat(form.addonPrice) || 0 }]
      : []
    const iva = ivaPayload(form.applyIva, form.ivaPercent)
    return {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      durationMonths: 1,
      freeActivityQuota: form.unlimitedFreeActivities ? null : parseInt(form.freeActivityQuota, 10) || 0,
      addons,
      applyIva: iva.applyIva,
      ivaPercent: iva.ivaPercent,
      priceAddons: iva.priceAddons,
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = buildPayload()
      if (isEditing) {
        await api.updatePackage(selectedId, payload)
      } else {
        await api.createPackage(payload)
      }
      closeModal()
      load()
    } finally {
      setSaving(false)
    }
  }

  const freeLabel = (p: MembershipPackage) =>
    p.freeActivityQuota == null ? 'Actividades gratis: ilimitadas' : `Actividades gratis: ${p.freeActivityQuota}/mes`

  const pkgSalePrice = (p: MembershipPackage) =>
    p.priceWithAddons
    ?? priceWithIva(p.price, p.applyIva, p.ivaPercent)

  return (
    <div className="admin-section">
      <div className="admin-list-toolbar">
        <div className="list-filter">{filterInput}</div>
        <button type="button" className="btn-primary admin-list-create-btn" onClick={openCreate}>
          Crear Membresía
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="empty-state card">No hay membresías registradas.</div>
      ) : (
        <div className="grid grid-2">
          {filtered.length === 0 ? (
            <div className="empty-state card">Ningún resultado coincide con la búsqueda</div>
          ) : filtered.map((p) => (
            <div
              key={p.id}
              className="card card-selectable"
              onClick={() => openEdit(p)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openEdit(p)}
            >
              <h3>{p.name}</h3>
              <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-ink)' }}>
                {formatMoney(pkgSalePrice(p))}/mes
              </p>
              {!!p.applyIva && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Base {formatMoney(p.price)} + {describeIva(true, p.ivaPercent)}
                </p>
              )}
              {!!p.description?.trim() && (
                <p className="card-desc" title={p.description.trim()}>
                  {p.description}
                </p>
              )}
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{freeLabel(p)}</p>
              {p.addons.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Complementos:</p>
                  {p.addons.map((a) => (
                    <p key={a.id} style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      + {a.name} (${a.price})
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AdminFormModal
        title={isEditing ? 'Editar membresía' : 'Nueva membresía'}
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        saving={saving}
        submitLabel={isEditing ? 'Guardar cambios' : 'Crear membresía'}
      >
        <div className="form-group">
          <label>Nombre</label>
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label>Precio mensual</label>
          <input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <HorizontalSwitch
            label="Valor agregado I.V.A. (opcional)"
            checked={form.applyIva}
            onChange={(applyIva) => setForm((prev) => ({ ...prev, applyIva }))}
          />
        </div>
        {form.applyIva && (
          <div className="form-group">
            <label>I.V.A. (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={form.ivaPercent}
              onChange={(e) => setForm((prev) => ({ ...prev, ivaPercent: e.target.value }))}
              required
            />
            {form.price && (
              <p className="form-hint">
                Referencia del sistema: {systemIvaPercent}% · Precio con I.V.A.:{' '}
                {formatMoney(priceWithIva(parseFloat(form.price) || 0, true, parseFloat(form.ivaPercent)))}
              </p>
            )}
            {!form.price && (
              <p className="form-hint">Referencia del sistema: {systemIvaPercent}%</p>
            )}
          </div>
        )}
        <div className="form-group">
          <label>Descripción</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={2}
          />
        </div>
        <div className="form-group">
          <HorizontalSwitch
            label="Actividades gratuitas"
            offLabel="Con límite"
            onLabel="Ilimitadas"
            checked={form.unlimitedFreeActivities}
            onChange={(unlimitedFreeActivities) => setForm((prev) => ({ ...prev, unlimitedFreeActivities }))}
          />
        </div>
        {!form.unlimitedFreeActivities && (
          <div className="form-group">
            <label>Actividades gratuitas incluidas (por mes)</label>
            <input
              type="number"
              min={0}
              value={form.freeActivityQuota}
              onChange={(e) => setForm((prev) => ({ ...prev, freeActivityQuota: e.target.value }))}
              required
            />
          </div>
        )}
        <div className="form-group">
          <label>Complemento (opcional)</label>
          <input
            value={form.addonName}
            onChange={(e) => setForm((prev) => ({ ...prev, addonName: e.target.value }))}
            placeholder="Ej: Clases grupales"
          />
        </div>
        <div className="form-group">
          <label>Precio del complemento</label>
          <input
            type="number"
            step="0.01"
            value={form.addonPrice}
            onChange={(e) => setForm((prev) => ({ ...prev, addonPrice: e.target.value }))}
          />
        </div>
      </AdminFormModal>
    </div>
  )
}

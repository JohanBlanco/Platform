import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../api'
import { useToast } from '../../toast'
import { formatMoney } from '../../utils/money'
import { applyOfferToPrice, productOfferBadge } from '../../utils/productOffer'
import type { Product } from '../../types'

type Draft = {
  productId: number | null
  offerPercent: number
  offerFrom: string
  offerUntil: string
}

const emptyDraft = (): Draft => ({
  productId: null,
  offerPercent: 20,
  offerFrom: '',
  offerUntil: '',
})

export default function MercadeoProductosPage() {
  const { showApiError, showSuccess, showWarning } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<Draft>(emptyDraft())
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setProducts(await api.getProducts())
    } catch (error) {
      showApiError(error, 'No se pudieron cargar los productos')
    } finally {
      setLoading(false)
    }
  }, [showApiError])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) =>
      `${p.name} ${p.codePrefix} ${p.description ?? ''}`.toLowerCase().includes(q),
    )
  }, [products, query])

  const openEditor = (product: Product) => {
    setDraft({
      productId: product.id,
      offerPercent: product.offerPercent && product.offerPercent > 0 ? product.offerPercent : 20,
      offerFrom: product.offerFrom ?? '',
      offerUntil: product.offerUntil ?? '',
    })
  }

  const save = async () => {
    if (draft.productId == null) return
    if (draft.offerPercent < 1 || draft.offerPercent > 90) {
      showWarning('El descuento debe estar entre 1% y 90%')
      return
    }
    setSaving(true)
    try {
      await api.updateProductOffer(draft.productId, {
        offerPercent: draft.offerPercent,
        offerFrom: draft.offerFrom || null,
        offerUntil: draft.offerUntil || null,
      })
      showSuccess('Oferta guardada')
      setDraft(emptyDraft())
      await load()
    } catch (error) {
      showApiError(error, 'No se pudo guardar la oferta')
    } finally {
      setSaving(false)
    }
  }

  const clear = async (product: Product) => {
    if (!window.confirm(`¿Quitar la oferta de «${product.name}»?`)) return
    try {
      await api.clearProductOffer(product.id)
      showSuccess('Oferta eliminada')
      if (draft.productId === product.id) setDraft(emptyDraft())
      await load()
    } catch (error) {
      showApiError(error, 'No se pudo quitar la oferta')
    }
  }

  const editing = products.find((p) => p.id === draft.productId) ?? null

  return (
    <div className="mercadeo-panel mercadeo-offers">
      <header className="mercadeo-panel-intro">
        <p>
          Define un descuento y una etiqueta tipo <strong>30% OFF</strong>. El precio rebajado se
          aplica automáticamente en el punto de venta mientras la oferta esté vigente.
        </p>
      </header>

      <div className="list-filter-bar">
        <input
          type="search"
          className="list-filter-input"
          placeholder="Buscar producto…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="calendar-hint">Cargando catálogo…</p>
      ) : (
        <div className="mercadeo-offer-grid">
          {filtered.map((product) => {
            const badge = productOfferBadge(product)
            const base = product.sellByUnit ? product.unitPrice : product.packagePrice
            const sale = applyOfferToPrice(base, product)
            const isEditing = draft.productId === product.id
            return (
              <article
                key={product.id}
                className={`mercadeo-offer-card${product.offerActive ? ' has-offer' : ''}${isEditing ? ' is-editing' : ''}`}
              >
                <div className="mercadeo-offer-media">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" referrerPolicy="no-referrer" loading="lazy" />
                  ) : (
                    <span>Sin imagen</span>
                  )}
                  {badge && <span className="product-offer-badge">{badge}</span>}
                </div>
                <div className="mercadeo-offer-body">
                  <h3>{product.name}</h3>
                  <p className="mercadeo-offer-price">
                    {product.offerActive ? (
                      <>
                        <span className="mercadeo-offer-was">{formatMoney(base)}</span>
                        <strong>{formatMoney(sale)}</strong>
                      </>
                    ) : (
                      <strong>{formatMoney(base)}</strong>
                    )}
                  </p>
                  {product.offerActive && (product.offerFrom || product.offerUntil) && (
                    <p className="form-hint">
                      {product.offerFrom ? `Desde ${product.offerFrom}` : 'Sin inicio'}
                      {' · '}
                      {product.offerUntil ? `Hasta ${product.offerUntil}` : 'Sin fin'}
                    </p>
                  )}
                  <div className="mercadeo-offer-actions">
                    <button type="button" className="btn-primary" onClick={() => openEditor(product)}>
                      {product.offerActive ? 'Editar oferta' : 'Crear oferta'}
                    </button>
                    {product.offerActive && (
                      <button type="button" className="btn-secondary" onClick={() => void clear(product)}>
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {editing && (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => !saving && setDraft(emptyDraft())}
        >
          <div
            className="modal card mercadeo-offer-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-editor-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-row">
              <div>
                <h2 id="offer-editor-title">Oferta</h2>
                <p className="modal-subtitle">{editing.name}</p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                disabled={saving}
                onClick={() => setDraft(emptyDraft())}
              >
                Cerrar
              </button>
            </div>

            <div className="mercadeo-offer-editor-preview">
              <span className="product-offer-badge product-offer-badge--static">
                {draft.offerPercent}% OFF
              </span>
              <div className="mercadeo-offer-editor-preview-prices">
                <span className="mercadeo-offer-was">
                  {formatMoney(editing.sellByUnit ? editing.unitPrice : editing.packagePrice)}
                </span>
                <strong>
                  {formatMoney(
                    applyOfferToPrice(
                      editing.sellByUnit ? editing.unitPrice : editing.packagePrice,
                      { offerActive: true, offerPercent: draft.offerPercent },
                    ),
                  )}
                </strong>
              </div>
            </div>

            <div className="form-group mercadeo-offer-discount">
              <label htmlFor="offer-percent">Descuento</label>
              <div className="mercadeo-offer-percent-display" aria-live="polite">
                <input
                  id="offer-percent"
                  className="mercadeo-offer-percent-value"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={90}
                  value={draft.offerPercent}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      offerPercent: Math.min(90, Math.max(1, Number(e.target.value) || 1)),
                    }))
                  }
                />
                <span className="mercadeo-offer-percent-suffix">% OFF</span>
              </div>
              <input
                className="mercadeo-offer-percent-slider"
                type="range"
                min={1}
                max={90}
                value={draft.offerPercent}
                aria-label="Ajustar descuento"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, offerPercent: Number(e.target.value) }))
                }
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="offer-from">Desde</label>
                <input
                  id="offer-from"
                  type="date"
                  value={draft.offerFrom}
                  onChange={(e) => setDraft((d) => ({ ...d, offerFrom: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="offer-until">Hasta</label>
                <input
                  id="offer-until"
                  type="date"
                  value={draft.offerUntil}
                  onChange={(e) => setDraft((d) => ({ ...d, offerUntil: e.target.value }))}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" disabled={saving} onClick={() => setDraft(emptyDraft())}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" disabled={saving} onClick={() => void save()}>
                {saving ? 'Guardando…' : 'Guardar oferta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

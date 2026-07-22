import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../api'
import AdminFormModal from '../../components/AdminFormModal'
import CategorySearchMultiSelect from '../../components/CategorySearchMultiSelect'
import CategoryTagInput from '../../components/CategoryTagInput'
import ConfirmDialog from '../../components/ConfirmDialog'
import HorizontalSwitch from '../../components/HorizontalSwitch'
import type { Product, ProductCategory, ProductImageSuggestion } from '../../types'
import { useFilteredList } from '../../hooks/useFilteredList'
import { useToast } from '../../toast'
import { formatMoney } from '../../utils/money'
import {
  DEFAULT_IVA_PERCENT,
  describeIva,
  ivaPayload,
  priceWithIva,
  readIvaFromProduct,
  resolveSalePrice,
} from '../../utils/priceAddons'

const PACKAGE_WORD = 'contenedor'
const UNIT_WORD = 'unidad'

type ModalMode = 'create' | 'manage'
type ManageTab = 'perfil' | 'inventario'
type Presentation = 'packaged' | 'loose'

type ProfileFields = {
  name: string
  categoryIds: number[]
  description: string
  imageUrl: string
}

type InventoryFields = {
  presentation: Presentation
  sellByPackage: boolean
  sellByUnit: boolean
  unitsPerPackage: string
  packagePrice: string
  unitPrice: string
  receivePackages: string
  receiveUnits: string
  markSoldOut: boolean
  applyIva: boolean
  ivaPercent: string
}

const emptyProfile = (): ProfileFields => ({
  name: '',
  categoryIds: [],
  description: '',
  imageUrl: '',
})

const emptyInventory = (systemIvaPercent = DEFAULT_IVA_PERCENT): InventoryFields => ({
  presentation: 'packaged',
  sellByPackage: true,
  sellByUnit: true,
  unitsPerPackage: '12',
  packagePrice: '0',
  unitPrice: '0',
  receivePackages: '0',
  receiveUnits: '0',
  markSoldOut: false,
  applyIva: false,
  ivaPercent: String(systemIvaPercent),
})

function productCategoryNames(p: Product) {
  return (p.categories ?? []).map((c) => c.name).join(', ')
}

function isInventoryConfigured(p: Product) {
  return p.sellByPackage || p.sellByUnit
}

function inventoryFromProduct(product: Product, systemIvaPercent = DEFAULT_IVA_PERCENT): InventoryFields {
  if (!isInventoryConfigured(product)) {
    return emptyInventory(systemIvaPercent)
  }
  const upp = Math.max(1, product.unitsPerPackage || 1)
  const packaged = product.sellByPackage || upp > 1
  const iva = readIvaFromProduct(product)
  return {
    presentation: packaged ? 'packaged' : 'loose',
    sellByPackage: product.sellByPackage,
    sellByUnit: packaged ? product.sellByUnit : true,
    unitsPerPackage: String(upp),
    packagePrice: String(product.packagePrice ?? 0),
    unitPrice: String(product.unitPrice ?? 0),
    receivePackages: '0',
    receiveUnits: '0',
    markSoldOut: false,
    applyIva: iva.enabled,
    ivaPercent: iva.percent,
  }
}

function stockDeltaFromReceive(inv: InventoryFields): number {
  if (inv.markSoldOut) return 0
  const upp = Math.max(1, parseInt(inv.unitsPerPackage, 10) || 1)
  const packages = Math.max(0, parseInt(inv.receivePackages, 10) || 0)
  const units = Math.max(0, parseInt(inv.receiveUnits, 10) || 0)
  if (inv.presentation === 'loose') return units
  return packages * upp + units
}

function resolveStockUnits(currentStock: number, inv: InventoryFields): number {
  if (inv.markSoldOut) return 0
  return Math.max(0, currentStock) + stockDeltaFromReceive(inv)
}


async function checkImageUrl(url: string): Promise<boolean> {
  if (!url.trim()) return true
  try {
    return await new Promise<boolean>((resolve) => {
      const img = new Image()
      const timer = window.setTimeout(() => resolve(false), 6000)
      img.onload = () => {
        window.clearTimeout(timer)
        resolve(true)
      }
      img.onerror = () => {
        window.clearTimeout(timer)
        resolve(false)
      }
      img.referrerPolicy = 'no-referrer'
      img.src = url
    })
  } catch {
    return false
  }
}

export default function ProductsSection() {
  const { showApiError, showSuccess, showWarning } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [categoryFilter, setCategoryFilter] = useState<number[]>([])
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [manageTab, setManageTab] = useState<ManageTab>('perfil')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [profile, setProfile] = useState(emptyProfile())
  const [inventory, setInventory] = useState(emptyInventory())
  const [systemIvaPercent, setSystemIvaPercent] = useState(DEFAULT_IVA_PERCENT)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<ProductImageSuggestion[]>([])
  const [suggestionsQuery, setSuggestionsQuery] = useState('')
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [imageBroken, setImageBroken] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(true)
  const [previewCode, setPreviewCode] = useState('')

  const modalOpen = modalMode != null

  const resetImageUi = () => {
    setSuggestions([])
    setSuggestionsQuery('')
    setShowImagePicker(true)
    setImageBroken(false)
    setLoadingSuggestions(false)
  }

  const load = useCallback(async () => {
    try {
      const [cats, list, cash] = await Promise.all([
        api.getProductCategories(),
        api.getProducts(categoryFilter.length > 0 ? categoryFilter : undefined),
        api.getCashOpeningFloat(),
      ])
      setCategories(cats)
      setProducts(list)
      const iva = Number(cash.systemIvaPercent)
      setSystemIvaPercent(Number.isFinite(iva) ? iva : DEFAULT_IVA_PERCENT)
    } catch (err) {
      showApiError(err, 'No se pudieron cargar los productos')
    }
  }, [categoryFilter, showApiError])

  useEffect(() => {
    void load()
  }, [load])

  const { filtered, filterInput } = useFilteredList(
    products,
    useCallback(
      (p: Product) => [
        p.codePrefix,
        productCategoryNames(p),
        p.unitLabel,
        p.packageLabel,
      ],
      [],
    ),
  )

  const closeModal = () => {
    setModalMode(null)
    setSelectedId(null)
    setManageTab('perfil')
    setProfile(emptyProfile())
    setInventory(emptyInventory(systemIvaPercent))
    resetImageUi()
    setPreviewCode('')
    setConfirmDeleteOpen(false)
    setDeleting(false)
  }

  const openCreate = () => {
    setModalMode('create')
    setSelectedId(null)
    setProfile(emptyProfile())
    setInventory(emptyInventory(systemIvaPercent))
    resetImageUi()
    setShowImagePicker(true)
    setPreviewCode('')
  }

  const openManage = async (product: Product) => {
    setModalMode('manage')
    setManageTab('inventario')
    setSelectedId(product.id)
    setProfile({
      name: product.name,
      categoryIds: (product.categories ?? []).map((c) => c.id),
      description: product.description ?? '',
      imageUrl: product.imageUrl ?? '',
    })
    setInventory(inventoryFromProduct(product, systemIvaPercent))
    setPreviewCode(product.codePrefix)
    setSuggestions([])
    setSuggestionsQuery('')
    setShowImagePicker(false)
    setLoadingSuggestions(false)
    if (product.imageUrl) {
      const ok = await checkImageUrl(product.imageUrl)
      setImageBroken(!ok)
      if (!ok) showWarning('La imagen del producto ya no es accesible. Busca otra sugerencia.')
    } else {
      setImageBroken(false)
    }
  }

  useEffect(() => {
    if (!modalOpen) return
    const name = profile.name.trim()
    if (name.length < 2) {
      setPreviewCode((prev) => (modalMode === 'create' ? '' : prev))
      return
    }
    if (modalMode === 'manage' && selectedId != null) return
    const code = name
      .normalize('NFD')
      .replace(/\p{M}+/gu, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 20) || 'PROD'
    setPreviewCode(code)
  }, [profile.name, modalOpen, modalMode, selectedId])

  const loadSuggestions = useCallback(async (name: string, options?: { silent?: boolean }) => {
    const q = name.trim()
    if (q.length < 2) {
      setSuggestions([])
      setSuggestionsQuery('')
      if (!options?.silent) showWarning('Escribe el nombre del producto para buscar imágenes')
      return
    }
    setLoadingSuggestions(true)
    try {
      const list = await api.suggestProductImages(q)
      setSuggestions(list)
      setSuggestionsQuery(q)
      if (list.length === 0 && !options?.silent) {
        showWarning('No se encontraron imágenes. Prueba un nombre más específico.')
      }
    } catch (err) {
      setSuggestions([])
      setSuggestionsQuery('')
      if (!options?.silent) showApiError(err, 'No se pudieron obtener sugerencias de imagen')
    } finally {
      setLoadingSuggestions(false)
    }
  }, [showApiError, showWarning])

  useEffect(() => {
    if (!modalOpen || !showImagePicker) return
    const name = profile.name.trim()
    if (name.length < 3) {
      setSuggestions([])
      setSuggestionsQuery('')
      return
    }
    if (name === suggestionsQuery && suggestions.length > 0) return
    const timer = window.setTimeout(() => {
      void loadSuggestions(name, { silent: true })
    }, 650)
    return () => window.clearTimeout(timer)
  }, [profile.name, modalOpen, showImagePicker, loadSuggestions, suggestionsQuery, suggestions.length])

  const selectSuggestion = (suggestion: ProductImageSuggestion) => {
    setProfile((f) => ({ ...f, imageUrl: suggestion.url }))
    setImageBroken(false)
    setShowImagePicker(false)
  }

  const clearSelectedImage = () => {
    setProfile((f) => ({ ...f, imageUrl: '' }))
    setImageBroken(false)
    setShowImagePicker(false)
    setSuggestions([])
    setSuggestionsQuery('')
  }

  const openImagePicker = () => {
    setShowImagePicker(true)
    const name = profile.name.trim()
    if (name.length >= 3 && name !== suggestionsQuery) {
      void loadSuggestions(name, { silent: true })
    }
  }

  const createCategoryFromTag = async (name: string) => {
    try {
      const created = await api.createProductCategory({ name })
      setCategories((prev) => {
        if (prev.some((c) => c.id === created.id)) return prev
        return [...prev, created].sort(
          (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
        )
      })
      showSuccess(`Categoría «${created.name}» creada`)
      return created
    } catch (err) {
      showApiError(err, 'No se pudo crear la categoría')
      throw err
    }
  }

  const profileValid = profile.name.trim().length > 0 && profile.categoryIds.length > 0

  const inventoryValid = useMemo(() => {
    if (inventory.presentation === 'packaged') {
      const upp = parseInt(inventory.unitsPerPackage, 10) || 0
      if (upp < 1) return false
      if (!inventory.sellByPackage && !inventory.sellByUnit) return false
    } else if (!inventory.sellByUnit) {
      return false
    }
    return true
  }, [inventory])

  const formValid = modalMode === 'create'
    ? profileValid
    : manageTab === 'perfil'
      ? profileValid
      : inventoryValid

  const selectedProduct = selectedId == null ? null : products.find((p) => p.id === selectedId) ?? null

  const buildPayload = () => {
    const inv = modalMode === 'create' ? emptyInventory(systemIvaPercent) : inventory
    const packaged = inv.presentation === 'packaged'
    const sellByPackage = packaged && inv.sellByPackage
    const sellByUnit = packaged ? inv.sellByUnit : true
    const upp = packaged ? Math.max(1, parseInt(inv.unitsPerPackage, 10) || 1) : 1
    const currentStock = selectedProduct?.stockUnits ?? 0
    return {
      name: profile.name.trim(),
      categoryIds: profile.categoryIds,
      description: profile.description.trim() || undefined,
      imageUrl: profile.imageUrl.trim() || undefined,
      stockUnits: modalMode === 'create' ? 0 : resolveStockUnits(currentStock, inv),
      unitsPerPackage: upp,
      packageLabel: PACKAGE_WORD,
      unitLabel: UNIT_WORD,
      packagePrice: sellByPackage ? (parseFloat(inv.packagePrice) || 0) : 0,
      unitPrice: sellByUnit ? (parseFloat(inv.unitPrice) || 0) : 0,
      sellByPackage,
      sellByUnit,
      ...ivaPayload(inv.applyIva, inv.ivaPercent),
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formValid) return
    if (
      modalMode === 'manage'
      && manageTab === 'inventario'
      && inventory.presentation === 'packaged'
      && !inventory.sellByPackage
      && !inventory.sellByUnit
    ) {
      showWarning('Elige al menos una forma de venta: empaque o unidad')
      return
    }
    setSaving(true)
    try {
      const payload = buildPayload()
      if (modalMode === 'manage' && selectedId != null) {
        if (manageTab === 'perfil') {
          const current = products.find((p) => p.id === selectedId)
          if (current) {
            Object.assign(payload, {
              stockUnits: current.stockUnits,
              unitsPerPackage: current.unitsPerPackage,
              packageLabel: current.packageLabel,
              unitLabel: current.unitLabel,
              packagePrice: current.packagePrice,
              unitPrice: current.unitPrice,
              sellByPackage: current.sellByPackage,
              sellByUnit: current.sellByUnit,
              applyIva: current.applyIva ?? false,
              ivaPercent: current.ivaPercent ?? null,
              priceAddons: current.priceAddons ?? [],
            })
          }
        }
        await api.updateProduct(selectedId, payload)
        showSuccess(
          manageTab === 'inventario'
            ? (inventory.markSoldOut ? 'Producto marcado como agotado' : 'Inventario actualizado')
            : 'Producto actualizado',
        )
      } else {
        await api.createProduct(payload)
        showSuccess('Producto registrado. Ábrelo para configurar inventario y venta.')
      }
      closeModal()
      await load()
    } catch (err) {
      showApiError(err, 'No se pudo guardar el producto')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (selectedId == null) return
    setDeleting(true)
    try {
      await api.deleteProduct(selectedId)
      showSuccess('Producto eliminado')
      closeModal()
      await load()
    } catch (err) {
      showApiError(err, 'No se pudo eliminar')
      setDeleting(false)
      setConfirmDeleteOpen(false)
    }
  }

  const upp = Math.max(1, parseInt(inventory.unitsPerPackage, 10) || 1)
  const currentStock = selectedProduct?.stockUnits ?? 0
  const previewStock = resolveStockUnits(currentStock, inventory)
  const setPresentation = (presentation: Presentation) => {
    setInventory((f) => {
      if (presentation === 'loose') {
        return {
          ...f,
          presentation,
          sellByPackage: false,
          sellByUnit: true,
          unitsPerPackage: '1',
          packagePrice: '0',
          receivePackages: '0',
          markSoldOut: false,
        }
      }
      return {
        ...f,
        presentation,
        sellByPackage: true,
        sellByUnit: true,
        unitsPerPackage: f.unitsPerPackage === '1' ? '12' : f.unitsPerPackage,
        markSoldOut: false,
      }
    })
  }

  const renderImageBlock = () => (
    <div className="form-group product-image-profile">
      <label>Imagen de perfil</label>
      {profile.imageUrl ? (
        <div className="product-image-selected product-image-selected--profile">
          <img
            className="product-image-preview product-image-preview--profile"
            src={profile.imageUrl}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setImageBroken(true)}
            onLoad={() => setImageBroken(false)}
          />
          <div className="product-image-selected-meta">
            <div className="product-image-selected-actions">
              <button type="button" className="btn-secondary" onClick={clearSelectedImage}>
                Quitar imagen
              </button>
              {!showImagePicker && (
                <button type="button" className="btn-secondary" onClick={openImagePicker}>
                  Ver sugerencias
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="product-image-empty-row">
          <small className="form-hint">Selecciona una imagen como perfil de tu producto</small>
          {!showImagePicker && (
            <button type="button" className="btn-secondary" onClick={openImagePicker}>
              Ver sugerencias
            </button>
          )}
        </div>
      )}
      {imageBroken && (
        <small className="form-hint form-hint--warn">Esta imagen ya no responde. Elige otra sugerencia.</small>
      )}
      {showImagePicker && (
        <div className="product-image-picker-panel">
          <div className="product-image-picker-panel-head">
            <span>Sugerencias</span>
            <button type="button" className="modal-icon-close" onClick={() => setShowImagePicker(false)} aria-label="Cerrar sugerencias">
              ×
            </button>
          </div>
          {loadingSuggestions && suggestions.length === 0 && <p className="form-hint">Buscando imágenes…</p>}
          {!loadingSuggestions && profile.name.trim().length < 3 && suggestions.length === 0 && (
            <p className="form-hint">Escribe el nombre para ver sugerencias</p>
          )}
          {!loadingSuggestions && profile.name.trim().length >= 3 && suggestions.length === 0 && (
            <p className="form-hint">Sin resultados para este nombre</p>
          )}
          {suggestions.length > 0 && (
            <div className="product-image-suggestions" role="listbox" aria-label="Imágenes sugeridas">
              {suggestions.map((s) => (
                <button
                  key={s.url}
                  type="button"
                  role="option"
                  aria-selected={profile.imageUrl === s.url}
                  className={`product-image-suggestion${profile.imageUrl === s.url ? ' selected' : ''}`}
                  onClick={() => selectSuggestion(s)}
                  title={s.title ?? 'Usar imagen'}
                >
                  <img src={s.url} alt="" referrerPolicy="no-referrer" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderProfileFields = () => (
    <>
      <div className="form-group">
        <label>Nombre</label>
        <input
          value={profile.name}
          onChange={(e) => setProfile((f) => ({ ...f, name: e.target.value }))}
          placeholder="Ej. Chicle, Whey Protein 2lb…"
          required
          autoFocus={modalMode === 'create' || manageTab === 'perfil'}
        />
        {previewCode && (
          <small className="form-hint">Código único: <strong>{previewCode}</strong></small>
        )}
      </div>
      {renderImageBlock()}
      <div className="form-group">
        <label>Categorías</label>
        <CategoryTagInput
          categories={categories}
          value={profile.categoryIds}
          onChange={(categoryIds) => setProfile((f) => ({ ...f, categoryIds }))}
          onCreate={createCategoryFromTag}
          placeholder="Escribe una categoría y pulsa Enter…"
        />
        {profile.categoryIds.length === 0 && (
          <small className="form-hint form-hint--warn">Asigna al menos una categoría</small>
        )}
      </div>
      <div className="form-group">
        <label>Descripción (opcional)</label>
        <textarea
          rows={2}
          value={profile.description}
          onChange={(e) => setProfile((f) => ({ ...f, description: e.target.value }))}
        />
      </div>
    </>
  )

  const renderInventoryFields = () => (
    <div className="product-inventory-flow">
      <div className="form-group">
        <label>Tipo de producto</label>
        <div className="product-sell-choices">
          <button
            type="button"
            className={`product-choice-card${inventory.presentation === 'packaged' ? ' active' : ''}`}
            onClick={() => setPresentation('packaged')}
          >
            <strong>Contenedor</strong>
            <span>Trae varias unidades dentro</span>
          </button>
          <button
            type="button"
            className={`product-choice-card${inventory.presentation === 'loose' ? ' active' : ''}`}
            onClick={() => setPresentation('loose')}
          >
            <strong>Unidad</strong>
            <span>Se vende e inventaría solo</span>
          </button>
        </div>
      </div>

      {inventory.presentation === 'packaged' && (
        <div className="product-inventory-block">
          <h4>Contenedor</h4>
          <label className="form-group" style={{ marginBottom: 0 }}>
            Unidades por contenedor
            <input
              type="number"
              min={1}
              value={inventory.unitsPerPackage}
              onChange={(e) => setInventory((f) => ({ ...f, unitsPerPackage: e.target.value }))}
            />
            <small className="form-hint">Ej. 1 contenedor = {upp} unidades</small>
          </label>
        </div>
      )}

      <div className="product-inventory-block">
        <h4>Precios</h4>
        {inventory.presentation === 'packaged' ? (
          <>
            <div className="product-price-switch-row">
              <HorizontalSwitch
                id="product-sell-package"
                label="Vender contenedor"
                checked={inventory.sellByPackage}
                onChange={(sellByPackage) => {
                  if (!sellByPackage && !inventory.sellByUnit) {
                    showWarning('Deja al menos una forma de venta activa')
                    return
                  }
                  setInventory((f) => ({ ...f, sellByPackage }))
                }}
              />
              {inventory.sellByPackage && (
                <label className="form-group product-price-input">
                  Precio del contenedor
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={inventory.packagePrice}
                    onChange={(e) => setInventory((f) => ({ ...f, packagePrice: e.target.value }))}
                  />
                </label>
              )}
            </div>
            <div className="product-price-switch-row">
              <HorizontalSwitch
                id="product-sell-unit"
                label="Vender unidad"
                checked={inventory.sellByUnit}
                onChange={(sellByUnit) => {
                  if (!sellByUnit && !inventory.sellByPackage) {
                    showWarning('Deja al menos una forma de venta activa')
                    return
                  }
                  setInventory((f) => ({ ...f, sellByUnit }))
                }}
              />
              {inventory.sellByUnit && (
                <label className="form-group product-price-input">
                  Precio de la unidad
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={inventory.unitPrice}
                    onChange={(e) => setInventory((f) => ({ ...f, unitPrice: e.target.value }))}
                  />
                </label>
              )}
            </div>
          </>
        ) : (
          <label className="form-group" style={{ marginBottom: 0 }}>
            Precio de la unidad
            <input
              type="number"
              min={0}
              step="0.01"
              value={inventory.unitPrice}
              onChange={(e) => setInventory((f) => ({ ...f, unitPrice: e.target.value }))}
            />
          </label>
        )}
      </div>

      <div className="product-inventory-block">
        <h4>Valores agregados (opcional)</h4>
        <HorizontalSwitch
          id="product-apply-iva"
          label="Aplicar I.V.A. al precio de venta"
          checked={inventory.applyIva}
          onChange={(applyIva) => setInventory((f) => ({ ...f, applyIva }))}
        />
        {inventory.applyIva && (
          <label className="form-group" style={{ marginTop: '0.65rem', marginBottom: 0 }}>
            I.V.A. (%)
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={inventory.ivaPercent}
              onChange={(e) => setInventory((f) => ({ ...f, ivaPercent: e.target.value }))}
            />
            <small className="form-hint">
              Referencia del sistema: {systemIvaPercent}%
              {inventory.sellByUnit || inventory.sellByPackage ? ' · ' : ''}
              {inventory.sellByUnit && (
                <>
                  Unidad con I.V.A.:{' '}
                  {formatMoney(
                    priceWithIva(parseFloat(inventory.unitPrice) || 0, true, parseFloat(inventory.ivaPercent)),
                  )}
                </>
              )}
              {inventory.sellByUnit && inventory.sellByPackage ? ' · ' : ''}
              {inventory.sellByPackage && (
                <>
                  Contenedor con I.V.A.:{' '}
                  {formatMoney(
                    priceWithIva(
                      parseFloat(inventory.packagePrice) || 0,
                      true,
                      parseFloat(inventory.ivaPercent),
                    ),
                  )}
                </>
              )}
            </small>
          </label>
        )}
      </div>

      <div className="product-inventory-block">
        <h4>Existencias</h4>
        <p className="product-stock-current">
          Actual:{' '}
          <strong>
            {currentStock} {UNIT_WORD}(es)
            {inventory.presentation === 'packaged' && upp > 1
              ? ` · ${Math.floor(currentStock / upp)} ${PACKAGE_WORD}(es) + ${currentStock % upp} sueltas`
              : ''}
          </strong>
        </p>

        {!inventory.markSoldOut && (
          <>
            <p className="product-inventory-summary">Agregar entrada (se suma al stock actual)</p>
            {inventory.presentation === 'packaged' ? (
              <div className="form-row-2">
                <label className="form-group">
                  + contenedores
                  <input
                    type="number"
                    min={0}
                    value={inventory.receivePackages}
                    onChange={(e) => setInventory((f) => ({ ...f, receivePackages: e.target.value }))}
                  />
                </label>
                <label className="form-group">
                  + unidades sueltas
                  <input
                    type="number"
                    min={0}
                    value={inventory.receiveUnits}
                    onChange={(e) => setInventory((f) => ({ ...f, receiveUnits: e.target.value }))}
                  />
                </label>
              </div>
            ) : (
              <label className="form-group">
                + unidades
                <input
                  type="number"
                  min={0}
                  value={inventory.receiveUnits}
                  onChange={(e) => setInventory((f) => ({ ...f, receiveUnits: e.target.value }))}
                />
              </label>
            )}
            {stockDeltaFromReceive(inventory) > 0 && (
              <p className="product-inventory-summary">
                Tras guardar: <strong>{previewStock}</strong> {UNIT_WORD}(es)
                {inventory.presentation === 'packaged' && upp > 1
                  ? ` · ≈ ${Math.floor(previewStock / upp)} ${PACKAGE_WORD}(es)`
                  : ''}
              </p>
            )}
          </>
        )}

        <HorizontalSwitch
          id="product-mark-sold-out"
          label="Marcar como agotado"
          checked={inventory.markSoldOut}
          onChange={(markSoldOut) => setInventory((f) => ({
            ...f,
            markSoldOut,
            receivePackages: markSoldOut ? '0' : f.receivePackages,
            receiveUnits: markSoldOut ? '0' : f.receiveUnits,
          }))}
        />
        {inventory.markSoldOut && (
          <small className="form-hint form-hint--warn">
            Al guardar, el stock quedará en 0 (agotado).
          </small>
        )}
      </div>
    </div>
  )

  return (
    <div className="products-section">
      <div className="page-toolbar products-toolbar">
        <div className="products-toolbar-filters">
          {filterInput ?? (
            <div className="list-filter products-name-filter">
              <input type="search" disabled placeholder="Buscar producto…" aria-label="Buscar producto" />
            </div>
          )}
          <div className="appointment-instructor-filter products-category-filter">
            <CategorySearchMultiSelect
              categories={categories}
              value={categoryFilter}
              onChange={setCategoryFilter}
              placeholder="Filtrar por categoría…"
              searchPlaceholder="Escribe una categoría y pulsa Enter…"
            />
          </div>
        </div>
        <button type="button" className="btn-primary" onClick={openCreate}>
          + Nuevo producto
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          Aún no hay productos. Registra el primero con «Nuevo producto».
        </div>
      ) : (
        <div className="products-grid">
          {filtered.map((p) => {
            const configured = isInventoryConfigured(p)
            return (
              <button
                key={p.id}
                type="button"
                className={`product-card${p.outOfStock && configured ? ' product-card--sold-out' : ''}`}
                onClick={() => void openManage(p)}
              >
                <div className="product-card-image-wrap">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="product-card-placeholder">Sin imagen</div>
                  )}
                  {!configured && <span className="product-card-badge product-card-badge--pending">Inventario</span>}
                  {configured && p.outOfStock && <span className="product-card-badge">Agotado</span>}
                </div>
                <div className="product-card-body">
                  <strong>{p.name}</strong>
                  <span className="product-card-code">{p.codePrefix}</span>
                  <span className="product-card-meta">{productCategoryNames(p) || 'Sin categoría'}</span>
                  {configured ? (
                    <>
                      <span className="product-card-stock">
                        {p.stockUnits} {UNIT_WORD}(es)
                        {p.sellByPackage && p.unitsPerPackage > 1
                          ? ` · ${p.fullPackagesAvailable} ${PACKAGE_WORD}(es)`
                          : ''}
                      </span>
                      <span className="product-card-price">
                        {p.sellByUnit &&
                          `${formatMoney(resolveSalePrice(p.unitPrice, {
                            applyIva: p.applyIva,
                            ivaPercent: p.ivaPercent,
                            priceAddons: p.priceAddons,
                            priceWithAddons: p.unitPriceWithAddons,
                          }))} / ${UNIT_WORD}`}
                        {p.sellByUnit && p.sellByPackage ? ' · ' : ''}
                        {p.sellByPackage &&
                          `${formatMoney(resolveSalePrice(p.packagePrice, {
                            applyIva: p.applyIva,
                            ivaPercent: p.ivaPercent,
                            priceAddons: p.priceAddons,
                            priceWithAddons: p.packagePriceWithAddons,
                          }))} / ${PACKAGE_WORD}`}
                      </span>
                      {!!(p.applyIva || p.priceAddons?.length) && (
                        <span className="product-card-meta">+ {describeIva(p.applyIva, p.ivaPercent, p.priceAddons)}</span>
                      )}
                    </>
                  ) : (
                    <span className="product-card-meta">Toca para configurar venta e inventario</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <AdminFormModal
          open={modalOpen}
          className={modalMode === 'manage' ? 'admin-form-modal--product-manage' : undefined}
          title={modalMode === 'create' ? 'Nuevo producto' : 'Administrar producto'}
          onClose={closeModal}
          onSubmit={handleSubmit}
          saving={saving}
          submitDisabled={!formValid}
          submitLabel={
            modalMode === 'create'
              ? 'Registrar producto'
              : manageTab === 'inventario'
                ? 'Guardar inventario'
                : 'Guardar perfil'
          }
          footerExtra={modalMode === 'manage' ? (
            <button
              type="button"
              className="btn-secondary"
              style={{ marginTop: '0.5rem' }}
              onClick={() => setConfirmDeleteOpen(true)}
              disabled={deleting}
            >
              Eliminar producto
            </button>
          ) : null}
        >
          {modalMode === 'manage' && (
            <div className="product-manage-tabs" role="tablist" aria-label="Secciones del producto">
              <button
                type="button"
                role="tab"
                className={`product-manage-tab${manageTab === 'perfil' ? ' active' : ''}`}
                aria-selected={manageTab === 'perfil'}
                onClick={() => setManageTab('perfil')}
              >
                Perfil
              </button>
              <button
                type="button"
                role="tab"
                className={`product-manage-tab${manageTab === 'inventario' ? ' active' : ''}`}
                aria-selected={manageTab === 'inventario'}
                onClick={() => setManageTab('inventario')}
              >
                Inventario y venta
              </button>
            </div>
          )}

          {modalMode === 'create' && (
            <p className="admin-form-intro">
              Registra el producto. Luego podrás configurar cómo se vende y el inventario.
            </p>
          )}

          {(modalMode === 'create' || manageTab === 'perfil') && renderProfileFields()}
          {modalMode === 'manage' && manageTab === 'inventario' && renderInventoryFields()}
        </AdminFormModal>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Eliminar producto"
        message={
          selectedProduct
            ? `¿Seguro que quieres eliminar «${selectedProduct.name}» del inventario? Esta acción no se puede deshacer.`
            : '¿Seguro que quieres eliminar este producto del inventario? Esta acción no se puede deshacer.'
        }
        confirmLabel="Eliminar"
        loading={deleting}
        onClose={() => {
          if (!deleting) setConfirmDeleteOpen(false)
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}

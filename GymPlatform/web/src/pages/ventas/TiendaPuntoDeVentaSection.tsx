import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../api'
import { useAuth } from '../../auth'
import AdminFormModal from '../../components/AdminFormModal'
import CashSessionModal from '../../components/CashSessionModal'
import ConfirmDialog from '../../components/ConfirmDialog'
import HorizontalSwitch from '../../components/HorizontalSwitch'
import MemberSearchSelect from '../../components/MemberSearchSelect'
import type {
  CashDenomination,
  CashSession,
  MembershipPackage,
  PaymentMethod,
  Product,
  StoreSale,
  StoreSaleItemKind,
  User,
} from '../../types'
import { formatMoney } from '../../utils/money'
import { applyOfferToPrice, productOfferBadge } from '../../utils/productOffer'
import { formatDateTime } from '../../utils/dateFormat'
import {
  formatSalePaymentsSummary,
  readImageFileAsDataUrl,
} from '../../utils/paymentProof'
import { DEFAULT_IVA_PERCENT, describeIva, priceWithIva, resolveSalePrice } from '../../utils/priceAddons'
import {
  downloadStoreSaleInvoicePdf,
  shareStoreSaleInvoiceViaWhatsApp,
} from '../../utils/storeSaleInvoicePdf'
import { useDateFormat } from '../../preferences/useDateFormat'
import { useToast } from '../../toast'

const SALE_SUMMARY_TTL_MS = 60_000

type CartLine = {
  key: string
  kind: StoreSaleItemKind
  productId?: number
  membershipPackageId?: number
  name: string
  unitPrice: number
  quantity: number
  maxStockUnits?: number
  unitsPerPackage?: number
  /** I.V.A. opcional en cobro (solo si el producto no lo trae incluido). */
  applyIvaAtSale?: boolean
}

type PendingPackageAdd = {
  product: Product
  quantity: number
}

type PendingMembershipAdd = {
  pkg: MembershipPackage
  member: User
  startsAfter: string
}

type SaleSummaryState = {
  sale: StoreSale
  memberWhatsappPhone: string | null
}

export default function TiendaPuntoDeVentaSection() {
  const { showApiError, showSuccess, showWarning } = useToast()
  const { formatIsoDate } = useDateFormat()
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [packages, setPackages] = useState<MembershipPackage[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [denominations, setDenominations] = useState<CashDenomination[]>([])
  const [openingFloat, setOpeningFloat] = useState(45000)
  const [systemIvaPercent, setSystemIvaPercent] = useState(DEFAULT_IVA_PERCENT)
  const [gymName, setGymName] = useState('GymPlatform')
  const [session, setSession] = useState<CashSession | null>(null)
  const [catalogTab, setCatalogTab] = useState<'products' | 'memberships'>('products')
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<CartLine[]>([])
  const [memberId, setMemberId] = useState<number | ''>('')
  const [cashModal, setCashModal] = useState<'open' | 'close' | null>(null)
  const [cashSaving, setCashSaving] = useState(false)
  const [checkoutSaving, setCheckoutSaving] = useState(false)
  const [pendingPackage, setPendingPackage] = useState<PendingPackageAdd | null>(null)
  const [pendingMembership, setPendingMembership] = useState<PendingMembershipAdd | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [payCash, setPayCash] = useState('')
  const [payCard, setPayCard] = useState('')
  const [paySinpe, setPaySinpe] = useState('')
  const [sinpeProofData, setSinpeProofData] = useState<string | null>(null)
  const [sinpeProofName, setSinpeProofName] = useState<string | null>(null)
  const [saleSummary, setSaleSummary] = useState<SaleSummaryState | null>(null)
  const [invoiceWaModalOpen, setInvoiceWaModalOpen] = useState(false)
  const [invoiceWaMemberId, setInvoiceWaMemberId] = useState<number | ''>('')
  const [invoiceWaSending, setInvoiceWaSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const saleSummaryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearSaleSummaryTimer = useCallback(() => {
    if (saleSummaryTimerRef.current != null) {
      clearTimeout(saleSummaryTimerRef.current)
      saleSummaryTimerRef.current = null
    }
  }, [])

  const dismissSaleSummary = useCallback(() => {
    clearSaleSummaryTimer()
    setSaleSummary(null)
  }, [clearSaleSummaryTimer])

  const showSaleSummary = useCallback((sale: StoreSale, memberWhatsappPhone: string | null) => {
    clearSaleSummaryTimer()
    setSaleSummary({ sale, memberWhatsappPhone })
    saleSummaryTimerRef.current = setTimeout(() => {
      setSaleSummary(null)
      saleSummaryTimerRef.current = null
    }, SALE_SUMMARY_TTL_MS)
  }, [clearSaleSummaryTimer])

  const restartSaleSummaryTimer = useCallback(() => {
    if (!saleSummary) return
    clearSaleSummaryTimer()
    saleSummaryTimerRef.current = setTimeout(() => {
      setSaleSummary(null)
      saleSummaryTimerRef.current = null
    }, SALE_SUMMARY_TTL_MS)
  }, [clearSaleSummaryTimer, saleSummary])

  useEffect(() => () => clearSaleSummaryTimer(), [clearSaleSummaryTimer])

  const sendInvoiceViaWhatsApp = useCallback(async (phone: string | null | undefined) => {
    if (!saleSummary) return
    const result = await shareStoreSaleInvoiceViaWhatsApp(saleSummary.sale, phone, { gymName })
    if (result.ok && result.mode === 'download-and-chat') {
      showSuccess('PDF descargado. Adjunta el archivo en el chat de WhatsApp que se abrió.')
    } else if (result.ok && result.mode === 'share') {
      showSuccess('Comprobante listo para enviar por WhatsApp')
    } else if (!result.ok && result.reason === 'no-phone') {
      showWarning('Elige un miembro con WhatsApp para enviar la factura.')
    } else if (!result.ok && result.reason === 'error') {
      showWarning('No se pudo preparar el PDF para WhatsApp')
    }
    return result
  }, [gymName, saleSummary, showSuccess, showWarning])

  const openInvoiceWaFlow = useCallback(() => {
    if (!saleSummary) return
    const phone = saleSummary.memberWhatsappPhone?.trim()
    if (phone) {
      void sendInvoiceViaWhatsApp(phone)
      return
    }
    clearSaleSummaryTimer()
    setInvoiceWaMemberId(saleSummary.sale.memberId ?? '')
    setInvoiceWaModalOpen(true)
  }, [clearSaleSummaryTimer, saleSummary, sendInvoiceViaWhatsApp])

  const invoiceWaMember = useMemo(
    () => (invoiceWaMemberId === '' ? null : members.find((m) => m.id === invoiceWaMemberId) ?? null),
    [invoiceWaMemberId, members],
  )

  const handleInvoiceWaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!saleSummary) return
    if (!invoiceWaMember) {
      showWarning('Selecciona un miembro para obtener el número de WhatsApp')
      return
    }
    const phone = invoiceWaMember.whatsappPhone?.trim()
    if (!phone) {
      showWarning('Ese miembro no tiene WhatsApp registrado. Elige otro o actualiza su perfil.')
      return
    }
    setInvoiceWaSending(true)
    try {
      const result = await sendInvoiceViaWhatsApp(phone)
      if (result?.ok) {
        setSaleSummary((prev) => (prev ? { ...prev, memberWhatsappPhone: phone } : prev))
        setInvoiceWaModalOpen(false)
        restartSaleSummaryTimer()
      }
    } finally {
      setInvoiceWaSending(false)
    }
  }

  const selectedMember = useMemo(
    () => (memberId === '' ? null : members.find((m) => m.id === memberId) ?? null),
    [memberId, members],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [prods, pkgs, users, dens, floatRes, current, orgs] = await Promise.all([
        api.getProducts(),
        api.getPackages(),
        api.getUsers(),
        api.getActiveCashDenominations(),
        api.getCashOpeningFloat(),
        api.getCurrentCashSession(),
        api.getPublicOrganizations().catch(() => []),
      ])
      setProducts(prods.filter((p) => p.sellByUnit || p.sellByPackage))
      setPackages(pkgs.filter((p) => p.active))
      setMembers(users.filter((u) => u.roles.includes('MEMBER') && u.active))
      setDenominations(dens)
      setOpeningFloat(Math.round(Number(floatRes.openingFloatColones) || 45000))
      setSystemIvaPercent(
        Number.isFinite(Number(floatRes.systemIvaPercent))
          ? Number(floatRes.systemIvaPercent)
          : DEFAULT_IVA_PERCENT,
      )
      if (user?.organizationId != null) {
        const org = orgs.find((o) => o.id === user.organizationId)
        if (org?.name) setGymName(org.name)
      }
      setSession(current ?? null)
    } catch (err) {
      showApiError(err, 'No se pudo cargar la tienda')
    } finally {
      setLoading(false)
    }
  }, [showApiError, user?.organizationId])

  useEffect(() => {
    void load()
  }, [load])

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) =>
      [p.name, p.codePrefix, ...(p.categories ?? []).map((c) => c.name)]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [products, query])

  const filteredPackages = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return packages
    return packages.filter((p) => `${p.name} ${p.description ?? ''}`.toLowerCase().includes(q))
  }, [packages, query])

  const cartTotal = useMemo(
    () => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
    [cart],
  )

  const paymentParts = useMemo(() => {
    const cash = Math.max(0, Math.round(parseFloat(payCash) || 0))
    const card = Math.max(0, Math.round(parseFloat(payCard) || 0))
    const sinpe = Math.max(0, Math.round(parseFloat(paySinpe) || 0))
    const paid = cash + card + sinpe
    const remaining = Math.round(cartTotal) - paid
    return { cash, card, sinpe, paid, remaining }
  }, [payCash, payCard, paySinpe, cartTotal])

  const productHasIvaIncluded = (product: Product) =>
    !!product.applyIva || !!product.priceAddons?.length

  const productSalePrice = (
    product: Product,
    kind: 'UNIT' | 'PACKAGE',
    applyIvaAtSale = false,
  ) => {
    const rawBase = kind === 'PACKAGE' ? product.packagePrice : product.unitPrice
    const base = applyOfferToPrice(rawBase, product)
    if (productHasIvaIncluded(product)) {
      return resolveSalePrice(base, {
        applyIva: product.applyIva,
        ivaPercent: product.ivaPercent,
        priceAddons: product.priceAddons,
        priceWithAddons: undefined,
      })
    }
    return priceWithIva(base, applyIvaAtSale, systemIvaPercent)
  }

  const membershipSalePrice = (pkg: MembershipPackage) =>
    resolveSalePrice(pkg.price, {
      applyIva: pkg.applyIva,
      ivaPercent: pkg.ivaPercent,
      priceAddons: pkg.priceAddons,
      priceWithAddons: pkg.priceWithAddons,
    })

  const addProductLine = (product: Product, kind: 'UNIT' | 'PACKAGE', quantity = 1) => {
    const applyIvaAtSale = false
    const unitPrice = productSalePrice(product, kind, applyIvaAtSale)
    const key = `${kind}-${product.id}`
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key)
      if (existing) {
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + quantity } : l))
      }
      return [
        ...prev,
        {
          key,
          kind,
          productId: product.id,
          name: `${product.name} (${kind === 'PACKAGE' ? 'contenedor' : 'unidad'})`,
          unitPrice,
          quantity,
          maxStockUnits: product.stockUnits,
          unitsPerPackage: product.unitsPerPackage,
          applyIvaAtSale,
        },
      ]
    })
  }

  const requestAddProduct = (product: Product) => {
    if (!session) {
      showWarning('Abre la caja antes de vender')
      return
    }
    if (product.outOfStock || product.stockUnits <= 0) {
      showWarning('Producto agotado')
      return
    }
    // Default: vender por unidad
    if (product.sellByUnit) {
      addProductLine(product, 'UNIT', 1)
      return
    }
    if (product.sellByPackage) {
      setPendingPackage({ product, quantity: 1 })
    }
  }

  const pushMembershipToCart = (pkg: MembershipPackage, startNote?: string) => {
    const name = startNote
      ? `Membresía ${pkg.name} (${startNote})`
      : `Membresía ${pkg.name}`
    const unitPrice = membershipSalePrice(pkg)
    setCart((prev) => {
      const withoutMembership = prev.filter((l) => l.kind !== 'MEMBERSHIP')
      return [
        ...withoutMembership,
        {
          key: `MEMBERSHIP-${pkg.id}`,
          kind: 'MEMBERSHIP',
          membershipPackageId: pkg.id,
          name,
          unitPrice,
          quantity: 1,
        },
      ]
    })
  }

  const addMembership = (pkg: MembershipPackage) => {
    if (!session) {
      showWarning('Abre la caja antes de vender')
      return
    }
    if (!selectedMember) {
      showWarning('Selecciona el miembro para renovar la membresía')
      return
    }
    if (selectedMember.hasQueuedRenewal) {
      const start = selectedMember.queuedStartDate
        ? formatIsoDate(selectedMember.queuedStartDate)
        : 'fecha programada'
      const queuedName = selectedMember.queuedPackageName
        ? ` («${selectedMember.queuedPackageName}»)`
        : ''
      showWarning(
        `Este miembro ya tiene una membresía programada${queuedName} a partir del ${start}. No se puede asignar otra.`,
      )
      return
    }
    if (cart.some((l) => l.kind === 'MEMBERSHIP')) {
      showWarning('Ya hay una membresía en el cobro. Quita la actual si quieres cambiar el plan.')
      return
    }

    const hasActive =
      selectedMember.membershipStatus === 'ACTIVE' && selectedMember.nextPaymentDate
    if (hasActive) {
      setPendingMembership({
        pkg,
        member: selectedMember,
        startsAfter: selectedMember.nextPaymentDate!,
      })
      return
    }

    pushMembershipToCart(pkg)
  }

  const updateQty = (key: string, quantity: number) => {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.key !== key) return l
          if (l.kind === 'MEMBERSHIP') return { ...l, quantity: 1 }
          return { ...l, quantity: Math.max(1, quantity) }
        })
        .filter((l) => l.quantity > 0),
    )
  }

  const removeLine = (key: string) => setCart((prev) => prev.filter((l) => l.key !== key))

  const setLineSellAsPackage = (line: CartLine, asPackage: boolean) => {
    if (line.productId == null || (line.kind !== 'UNIT' && line.kind !== 'PACKAGE')) return
    const product = products.find((p) => p.id === line.productId)
    if (!product) return
    if (asPackage && !product.sellByPackage) {
      showWarning('Este producto no se vende por contenedor')
      return
    }
    if (!asPackage && !product.sellByUnit) {
      showWarning('Este producto no se vende por unidad')
      return
    }
    const newKind = asPackage ? 'PACKAGE' : 'UNIT'
    if (line.kind === newKind) return

    const newKey = `${newKind}-${product.id}`
    const applyIvaAtSale = line.applyIvaAtSale === true
    const newPrice = productSalePrice(product, newKind, applyIvaAtSale)
    setCart((prev) => {
      const existingTarget = prev.find((l) => l.key === newKey)
      const quantity = (existingTarget?.quantity ?? 0) + line.quantity
      return [
        ...prev.filter((l) => l.key !== line.key && l.key !== newKey),
        {
          key: newKey,
          kind: newKind,
          productId: product.id,
          name: `${product.name} (${asPackage ? 'contenedor' : 'unidad'})`,
          unitPrice: newPrice,
          quantity,
          maxStockUnits: product.stockUnits,
          unitsPerPackage: product.unitsPerPackage,
          applyIvaAtSale,
        },
      ]
    })
  }

  const setLineApplyIva = (line: CartLine, applyIvaAtSale: boolean) => {
    if (line.productId == null || (line.kind !== 'UNIT' && line.kind !== 'PACKAGE')) return
    const product = products.find((p) => p.id === line.productId)
    if (!product || productHasIvaIncluded(product)) return
    setCart((prev) =>
      prev.map((l) =>
        l.key === line.key
          ? {
              ...l,
              applyIvaAtSale,
              unitPrice: productSalePrice(product, line.kind as 'UNIT' | 'PACKAGE', applyIvaAtSale),
            }
          : l,
      ),
    )
  }

  const openPaymentModal = () => {
    if (!session) {
      showWarning('Abre la caja antes de cobrar')
      return
    }
    if (cart.length === 0) {
      showWarning('El carrito está vacío')
      return
    }
    if (cart.some((l) => l.kind === 'MEMBERSHIP') && !memberId) {
      showWarning('Selecciona el miembro para la membresía')
      return
    }
    setPayCash('')
    setPayCard('')
    setPaySinpe('')
    setSinpeProofData(null)
    setSinpeProofName(null)
    setPaymentModalOpen(true)
  }

  const handleCheckout = async () => {
    if (!paymentModalOpen) {
      openPaymentModal()
      return
    }
    const { cash, card, sinpe, paid, remaining } = paymentParts
    if (paid <= 0) {
      showWarning('Indica al menos un monto de pago')
      return
    }
    if (remaining !== 0) {
      showWarning(
        remaining > 0
          ? `Falta repartir ${formatMoney(remaining)} entre los métodos de pago`
          : `Sobran ${formatMoney(-remaining)} en los montos de pago`,
      )
      return
    }
    const payments: Array<{ method: PaymentMethod; amount: number; paymentProofData?: string }> = []
    if (cash > 0) payments.push({ method: 'CASH', amount: cash })
    if (card > 0) payments.push({ method: 'CARD', amount: card })
    if (sinpe > 0) {
      payments.push({
        method: 'SINPE',
        amount: sinpe,
        paymentProofData: sinpeProofData ?? undefined,
      })
    }

    setCheckoutSaving(true)
    try {
      const memberForSale = selectedMember
      const sale = await api.storeCheckout({
        memberId: memberId === '' ? undefined : memberId,
        payments,
        items: cart.map((l) => ({
          productId: l.productId,
          membershipPackageId: l.membershipPackageId,
          kind: l.kind,
          quantity: l.quantity,
          applyIva: l.applyIvaAtSale === true ? true : undefined,
        })),
      })
      showSuccess('Venta registrada')
      setCart([])
      setMemberId('')
      setPaymentModalOpen(false)
      setSinpeProofData(null)
      setSinpeProofName(null)
      const waPhone = memberForSale?.whatsappPhone?.trim() || null
      showSaleSummary(sale, waPhone)

      if (waPhone) {
        void shareStoreSaleInvoiceViaWhatsApp(sale, waPhone, { gymName }).then((result) => {
          if (result.ok && result.mode === 'download-and-chat') {
            showSuccess('PDF descargado. Adjunta el archivo en el chat de WhatsApp que se abrió.')
          } else if (result.ok && result.mode === 'share') {
            showSuccess('Comprobante listo para enviar por WhatsApp')
          } else if (!result.ok && result.reason === 'error') {
            showWarning('No se pudo preparar el PDF para WhatsApp')
          }
        })
      }

      const [prods, users, current] = await Promise.all([
        api.getProducts(),
        api.getUsers(),
        api.getCurrentCashSession(),
      ])
      setProducts(prods.filter((p) => p.sellByUnit || p.sellByPackage))
      setMembers(users.filter((u) => u.roles.includes('MEMBER') && u.active))
      setSession(current ?? null)
    } catch (err) {
      showApiError(err, 'No se pudo completar la venta')
    } finally {
      setCheckoutSaving(false)
    }
  }

  const submitCash = async (counts: Array<{ valueColones: number; quantity: number }>, notes: string) => {
    setCashSaving(true)
    try {
      if (cashModal === 'open') {
        const opened = await api.openCashSession({ counts, notes: notes || undefined })
        setSession(opened)
        showSuccess('Caja abierta')
      } else if (cashModal === 'close' && session?.id != null) {
        await api.closeCashSession(session.id, { counts, notes: notes || undefined })
        setSession(null)
        setCart([])
        showSuccess('Caja cerrada')
      }
      setCashModal(null)
    } catch (err) {
      showApiError(err, 'No se pudo actualizar la caja')
    } finally {
      setCashSaving(false)
    }
  }

  if (loading) {
    return <div className="empty-state card">Cargando tienda…</div>
  }

  return (
    <div className="pos-layout">
      <div className="pos-toolbar">
        <div className={`pos-cash-pill${session ? ' is-open' : ''}`}>
          {session ? (
            <>
              <strong>Caja abierta</strong>
              <span>
                desde{' '}
                {session.openedAt
                  ? formatDateTime(session.openedAt, 'es')
                  : '—'}
                {' · '}
                {formatMoney(session.openingTotal)} · neto {formatMoney(session.salesNetTotal)}
              </span>
            </>
          ) : (
            <>
              <strong>Caja cerrada</strong>
              <span>Ábrela para vender</span>
            </>
          )}
        </div>
        <div className="pos-toolbar-actions">
          {!session ? (
            <button type="button" className="btn-primary" onClick={() => setCashModal('open')}>
              Abrir caja
            </button>
          ) : (
            <button type="button" className="btn-secondary" onClick={() => setCashModal('close')}>
              Cerrar caja
            </button>
          )}
        </div>
      </div>

      <div className="pos-main">
        <section className="pos-catalog card">
          <div className="pos-catalog-head">
            <div className="product-manage-tabs" role="tablist">
              <button
                type="button"
                className={`product-manage-tab${catalogTab === 'products' ? ' active' : ''}`}
                onClick={() => setCatalogTab('products')}
              >
                Productos
              </button>
              <button
                type="button"
                className={`product-manage-tab${catalogTab === 'memberships' ? ' active' : ''}`}
                onClick={() => setCatalogTab('memberships')}
              >
                Membresías
              </button>
            </div>
            <input
              type="search"
              className="list-filter-input"
              placeholder={catalogTab === 'products' ? 'Buscar producto…' : 'Buscar membresía…'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {catalogTab === 'products' ? (
            <div className="pos-product-grid">
              {filteredProducts.length === 0 ? (
                <p className="form-hint">No hay productos para vender</p>
              ) : (
                filteredProducts.map((p) => {
                  const badge = productOfferBadge(p)
                  const kind = p.sellByUnit ? 'UNIT' : 'PACKAGE'
                  const sale = productSalePrice(p, kind)
                  const was = p.sellByUnit ? p.unitPrice : p.packagePrice
                  return (
                  <div
                    key={p.id}
                    className={`pos-product-card${p.outOfStock ? ' is-sold-out' : ''}${p.offerActive ? ' has-offer' : ''}`}
                  >
                    <button
                      type="button"
                      className="pos-product-main"
                      onClick={() => requestAddProduct(p)}
                      disabled={!session || p.outOfStock}
                    >
                      <div className="pos-product-thumb">
                        {p.imageUrl ? <img src={p.imageUrl} alt="" referrerPolicy="no-referrer" /> : <span>Sin imagen</span>}
                        {badge && <span className="product-offer-badge">{badge}</span>}
                      </div>
                      <strong>{p.name}</strong>
                      <span className="pos-product-meta">
                        {p.offerActive && (
                          <span className="pos-product-was">{formatMoney(was)} </span>
                        )}
                        {formatMoney(sale)}
                        {' · '}
                        {p.stockUnits} uds
                      </span>
                      {(p.applyIva || !!p.priceAddons?.length) && (
                        <span className="pos-product-hint">
                          Incluye {describeIva(p.applyIva, p.ivaPercent, p.priceAddons)}
                        </span>
                      )}
                      {p.sellByUnit && (
                        <span className="pos-product-hint">Toque = 1 unidad</span>
                      )}
                    </button>
                    {p.sellByPackage && !p.outOfStock && (
                      <button
                        type="button"
                        className="pos-product-package-btn"
                        disabled={!session}
                        onClick={() => setPendingPackage({ product: p, quantity: 1 })}
                      >
                        Contenedor
                      </button>
                    )}
                  </div>
                  )
                })
              )}
            </div>
          ) : (
            <div className="pos-product-grid">
              {filteredPackages.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  className="pos-product-card pos-membership-card"
                  onClick={() => addMembership(pkg)}
                  disabled={!session}
                >
                  <h3 className="pos-membership-name">{pkg.name}</h3>
                  <p className="pos-membership-price">
                    {formatMoney(membershipSalePrice(pkg))}
                    <span>/ {pkg.durationMonths} mes{pkg.durationMonths === 1 ? '' : 'es'}</span>
                  </p>
                  {(pkg.applyIva || !!pkg.priceAddons?.length) && (
                    <p className="pos-membership-desc">
                      Incluye {describeIva(pkg.applyIva, pkg.ivaPercent, pkg.priceAddons)}
                      {pkg.applyIva ? ` · base ${formatMoney(pkg.price)}` : ''}
                    </p>
                  )}
                  {pkg.description?.trim() && (
                    <p className="pos-membership-desc" title={pkg.description.trim()}>
                      {pkg.description}
                    </p>
                  )}
                  <p className="pos-membership-quota">
                    {pkg.freeActivityQuota == null
                      ? 'Actividades gratis: ilimitadas'
                      : `Actividades gratis: ${pkg.freeActivityQuota}/mes`}
                  </p>
                  {pkg.addons.length > 0 && (
                    <div className="pos-membership-addons">
                      {pkg.addons.slice(0, 2).map((a) => (
                        <span key={a.id}>+ {a.name}</span>
                      ))}
                      {pkg.addons.length > 2 && (
                        <span>+{pkg.addons.length - 2} más</span>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="pos-cart card">
          <h3>Cobro</h3>
          <MemberSearchSelect
            members={members}
            value={memberId}
            onChange={(id) => {
              setMemberId(id)
              setCart((prev) => prev.filter((l) => l.kind !== 'MEMBERSHIP'))
            }}
            label="Cliente / miembro (opcional)"
            placeholder="Buscar miembro…"
          />
          {selectedMember?.hasQueuedRenewal && (
            <p className="form-hint" style={{ color: 'var(--warning, #b45309)' }}>
              Ya tiene membresía programada
              {selectedMember.queuedPackageName ? ` «${selectedMember.queuedPackageName}»` : ''}
              {selectedMember.queuedStartDate
                ? ` desde el ${formatIsoDate(selectedMember.queuedStartDate)}`
                : ''}
              . No se puede vender otra hasta que esa inicie.
            </p>
          )}
          {!selectedMember?.hasQueuedRenewal &&
            selectedMember?.membershipStatus === 'ACTIVE' &&
            selectedMember.nextPaymentDate && (
              <p className="form-hint">
                Membresía activa hasta el {formatIsoDate(selectedMember.nextPaymentDate)}.
                Una renovación comenzaría al día siguiente.
              </p>
            )}

          {cart.length === 0 ? (
            <p className="form-hint">Toca un producto para agregarlo. Por defecto se vende por unidad.</p>
          ) : (
            <ul className="pos-cart-list">
              {cart.map((line) => {
                const product =
                  line.productId != null ? products.find((p) => p.id === line.productId) : undefined
                const canTogglePack =
                  (line.kind === 'UNIT' || line.kind === 'PACKAGE') &&
                  !!product?.sellByUnit &&
                  !!product?.sellByPackage
                const ivaIncluded = product != null && productHasIvaIncluded(product)
                const canToggleIva =
                  product != null &&
                  (line.kind === 'UNIT' || line.kind === 'PACKAGE') &&
                  !ivaIncluded

                return (
                  <li key={line.key} className="pos-cart-line">
                    <div>
                      <strong>
                        {product && (line.kind === 'UNIT' || line.kind === 'PACKAGE')
                          ? product.name
                          : line.name}
                      </strong>
                      <div className="pos-cart-price-row">
                        <span>
                          {formatMoney(line.unitPrice)}
                          {line.kind === 'PACKAGE' ? ' / contenedor' : line.kind === 'UNIT' ? ' / unidad' : ' c/u'}
                        </span>
                        {canToggleIva && (
                          <label className="pos-cart-iva-inline">
                            <span>IVA {systemIvaPercent}%</span>
                            <HorizontalSwitch
                              id={`cart-iva-${line.key}`}
                              label="I.V.A."
                              compact
                              checked={line.applyIvaAtSale === true}
                              onChange={(on) => setLineApplyIva(line, on)}
                            />
                          </label>
                        )}
                        {ivaIncluded && product && (
                          <span className="pos-cart-iva-note">
                            Incluye {describeIva(product.applyIva, product.ivaPercent, product.priceAddons)}
                          </span>
                        )}
                      </div>
                      {line.kind === 'MEMBERSHIP' && (() => {
                        const pkg = packages.find((p) => p.id === line.membershipPackageId)
                        if (!pkg || !(pkg.applyIva || pkg.priceAddons?.length)) return null
                        return (
                          <span className="pos-cart-iva-note">
                            Incluye {describeIva(pkg.applyIva, pkg.ivaPercent, pkg.priceAddons)}
                          </span>
                        )
                      })()}
                      {canTogglePack && (
                        <div className="pos-cart-mode-switch">
                          <HorizontalSwitch
                            id={`cart-sell-mode-${line.productId}`}
                            label="Modo de venta"
                            offLabel="Unidad"
                            onLabel="Contenedor"
                            checked={line.kind === 'PACKAGE'}
                            onChange={(asPackage) => setLineSellAsPackage(line, asPackage)}
                          />
                        </div>
                      )}
                    </div>
                    <div className="pos-cart-line-actions">
                      {line.kind === 'MEMBERSHIP' ? (
                        <span className="pos-cart-qty-fixed">1</span>
                      ) : (
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => updateQty(line.key, parseInt(e.target.value, 10) || 1)}
                        />
                      )}
                      <strong>{formatMoney(line.unitPrice * line.quantity)}</strong>
                      <button type="button" className="btn-secondary" onClick={() => removeLine(line.key)}>
                        ×
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="pos-cart-total">
            <span>Total</span>
            <strong>{formatMoney(cartTotal)}</strong>
          </div>
          <button
            type="button"
            className="btn-primary pos-checkout-btn"
            disabled={!session || cart.length === 0 || checkoutSaving}
            onClick={() => openPaymentModal()}
          >
            {checkoutSaving ? 'Cobrando…' : 'Cobrar'}
          </button>

          {saleSummary && (
            <div className="pos-sale-summary" role="status">
              <header className="pos-sale-summary-head">
                <div>
                  <strong>Venta #{saleSummary.sale.id}</strong>
                  <span>
                    {formatDateTime(saleSummary.sale.createdAt, 'es')}
                    {saleSummary.sale.memberName ? ` · ${saleSummary.sale.memberName}` : ''}
                    {saleSummary.sale.payments?.length || saleSummary.sale.paymentMethod
                      ? ` · ${formatSalePaymentsSummary(
                          saleSummary.sale.payments,
                          saleSummary.sale.paymentMethod,
                          saleSummary.sale.total,
                        )}`
                      : ''}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  aria-label="Cerrar resumen"
                  onClick={dismissSaleSummary}
                >
                  ×
                </button>
              </header>
              <ul className="pos-sale-summary-items">
                {saleSummary.sale.items.map((item) => (
                  <li key={item.id}>
                    <span>
                      {item.quantity}× {item.description}
                    </span>
                    <strong>{formatMoney(item.lineTotal)}</strong>
                  </li>
                ))}
              </ul>
              <div className="pos-sale-summary-total">
                <span>Total</span>
                <strong>{formatMoney(saleSummary.sale.total)}</strong>
              </div>
              <div className="pos-sale-summary-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    downloadStoreSaleInvoicePdf(saleSummary.sale, { gymName })
                  }}
                >
                  Factura PDF
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={openInvoiceWaFlow}
                >
                  Enviar PDF por WA
                </button>
              </div>
              <p className="form-hint pos-sale-summary-ttl">
                {saleSummary.memberWhatsappPhone
                  ? 'Se cierra solo en 1 minuto'
                  : 'Para WhatsApp elige un miembro con número. Se cierra solo en 1 minuto'}
              </p>
            </div>
          )}
        </aside>
      </div>

      {cashModal && (
        <CashSessionModal
          mode={cashModal}
          denominations={denominations}
          session={session}
          expectedOpeningFloat={openingFloat}
          saving={cashSaving}
          onClose={() => !cashSaving && setCashModal(null)}
          onSubmit={(counts, notes) => void submitCash(counts, notes)}
        />
      )}

      <AdminFormModal
        title="Enviar factura por WhatsApp"
        open={invoiceWaModalOpen}
        onClose={() => {
          if (invoiceWaSending) return
          setInvoiceWaModalOpen(false)
          restartSaleSummaryTimer()
        }}
        onSubmit={handleInvoiceWaSubmit}
        saving={invoiceWaSending}
        submitLabel="Enviar factura"
        submitDisabled={!invoiceWaMember || !invoiceWaMember.whatsappPhone?.trim()}
        intro={(
          <p className="admin-form-intro">
            Esta venta no tiene un WhatsApp asociado. Elige un miembro registrado para tomar su número
            y enviar el PDF de la factura.
          </p>
        )}
      >
        <MemberSearchSelect
          members={members}
          value={invoiceWaMemberId}
          onChange={setInvoiceWaMemberId}
          label="Miembro (destinatario)"
          placeholder="Buscar por nombre, cédula o correo…"
          required
        />
        {invoiceWaMember && !invoiceWaMember.whatsappPhone?.trim() && (
          <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Este miembro no tiene WhatsApp. Elige otro o actualiza su perfil.
          </p>
        )}
        {invoiceWaMember?.whatsappPhone && (
          <p className="form-hint" style={{ marginTop: '0.5rem' }}>
            Se enviará a {invoiceWaMember.whatsappPhone}
          </p>
        )}
      </AdminFormModal>

      <ConfirmDialog
        open={pendingPackage != null}
        title="Vender contenedor"
        message={
          pendingPackage
            ? `Vas a vender ${pendingPackage.quantity} contenedor(es) de «${pendingPackage.product.name}» (${pendingPackage.product.unitsPerPackage} unidades c/u) por ${formatMoney(
                productSalePrice(pendingPackage.product, 'PACKAGE'),
              )}. ¿Confirmas?`
            : ''
        }
        confirmLabel="Sí, vender contenedor"
        cancelLabel="Cancelar"
        danger={false}
        onClose={() => setPendingPackage(null)}
        onConfirm={() => {
          if (!pendingPackage) return
          addProductLine(pendingPackage.product, 'PACKAGE', pendingPackage.quantity)
          setPendingPackage(null)
        }}
      />

      <ConfirmDialog
        open={pendingMembership != null}
        title="Renovar membresía"
        message={
          pendingMembership
            ? `«${pendingMembership.member.firstName} ${pendingMembership.member.lastName}» ya tiene membresía activa hasta el ${formatIsoDate(pendingMembership.startsAfter)}. La nueva («${pendingMembership.pkg.name}») comenzará el día siguiente. Solo se permite una renovación programada. ¿Continuar?`
            : ''
        }
        confirmLabel="Sí, programar renovación"
        cancelLabel="Cancelar"
        danger={false}
        onClose={() => setPendingMembership(null)}
        onConfirm={() => {
          if (!pendingMembership) return
          const d = new Date(pendingMembership.startsAfter + 'T12:00:00')
          d.setDate(d.getDate() + 1)
          const startIso = d.toISOString().slice(0, 10)
          pushMembershipToCart(pendingMembership.pkg, `inicia ${formatIsoDate(startIso)}`)
          setPendingMembership(null)
        }}
      />

      {paymentModalOpen && (
        <div
          className="modal-overlay confirm-dialog-overlay"
          onClick={() => !checkoutSaving && setPaymentModalOpen(false)}
          role="presentation"
        >
          <div
            className="modal card availability-modal pos-payment-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2>Cómo se paga</h2>
            <p className="confirm-dialog-message">
              Total: <strong>{formatMoney(cartTotal)}</strong>. Reparte el monto entre uno o varios métodos
              (ej. {formatMoney(Math.min(5000, Math.round(cartTotal)))} SINPE + el resto en efectivo).
            </p>

            <div className="pos-split-payments">
              <label className="form-group">
                Efectivo (₡)
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={payCash}
                  onChange={(e) => setPayCash(e.target.value)}
                  placeholder="0"
                />
              </label>
              <label className="form-group">
                Tarjeta (₡)
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={payCard}
                  onChange={(e) => setPayCard(e.target.value)}
                  placeholder="0"
                />
              </label>
              <label className="form-group">
                SINPE (₡)
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={paySinpe}
                  onChange={(e) => setPaySinpe(e.target.value)}
                  placeholder="0"
                />
              </label>
            </div>

            <div className="pos-split-paid-summary">
              <span>Efectivo {formatMoney(paymentParts.cash)}</span>
              <span>Tarjeta {formatMoney(paymentParts.card)}</span>
              <span>SINPE {formatMoney(paymentParts.sinpe)}</span>
              <strong>Suma {formatMoney(paymentParts.paid)}</strong>
            </div>

            <div className="pos-split-shortcuts">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setPayCash(String(Math.round(cartTotal)))
                  setPayCard('')
                  setPaySinpe('')
                  setSinpeProofData(null)
                  setSinpeProofName(null)
                }}
              >
                Todo efectivo
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setPayCash('')
                  setPayCard(String(Math.round(cartTotal)))
                  setPaySinpe('')
                  setSinpeProofData(null)
                  setSinpeProofName(null)
                }}
              >
                Todo tarjeta
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setPayCash('')
                  setPayCard('')
                  setPaySinpe(String(Math.round(cartTotal)))
                }}
              >
                Todo SINPE
              </button>
              {paymentParts.remaining !== 0 && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const rest = paymentParts.remaining
                    if (rest > 0) {
                      setPayCash(String(paymentParts.cash + rest))
                    }
                  }}
                >
                  Resto a efectivo
                </button>
              )}
            </div>

            <p
              className={`pos-split-balance${
                paymentParts.remaining === 0 && paymentParts.paid > 0
                  ? ' is-ok'
                  : ' is-pending'
              }`}
            >
              {paymentParts.remaining === 0 && paymentParts.paid > 0
                ? 'Cuadra con el total'
                : paymentParts.remaining > 0
                  ? `Falta repartir ${formatMoney(paymentParts.remaining)}`
                  : `Sobran ${formatMoney(-paymentParts.remaining)}`}
            </p>

            {paymentParts.sinpe > 0 && (
              <div className="pos-sinpe-proof">
                <label className="form-group">
                  Comprobante SINPE (opcional)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      void readImageFileAsDataUrl(file)
                        .then((data) => {
                          setSinpeProofData(data)
                          setSinpeProofName(file.name)
                        })
                        .catch((err) => {
                          showWarning(err instanceof Error ? err.message : 'No se pudo leer la imagen')
                          setSinpeProofData(null)
                          setSinpeProofName(null)
                        })
                    }}
                  />
                </label>
                {sinpeProofData && (
                  <div className="pos-sinpe-proof-preview">
                    <img src={sinpeProofData} alt="Comprobante SINPE" />
                    <span>{sinpeProofName ?? 'Comprobante cargado'}</span>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setSinpeProofData(null)
                        setSinpeProofName(null)
                      }}
                    >
                      Quitar
                    </button>
                  </div>
                )}
                <p className="form-hint">Puedes subir el comprobante ahora o después en Ventas.</p>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={checkoutSaving}
                onClick={() => setPaymentModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={checkoutSaving || paymentParts.remaining !== 0 || paymentParts.paid <= 0}
                onClick={() => void handleCheckout()}
              >
                {checkoutSaving ? 'Cobrando…' : 'Confirmar cobro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

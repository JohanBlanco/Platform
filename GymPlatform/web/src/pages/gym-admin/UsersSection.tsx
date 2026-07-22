import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'
import AdminFormModal from '../../components/AdminFormModal'
import HorizontalSwitch from '../../components/HorizontalSwitch'
import MemberSearchSelect from '../../components/MemberSearchSelect'
import MultiSelect from '../../components/MultiSelect'
import WhatsAppOutboundPicker from '../../components/WhatsAppOutboundPicker'
import type { BroadcastMessageTemplate, MembershipPackage, User } from '../../types'
import { useFilteredList } from '../../hooks/useFilteredList'
import { useDateFormat } from '../../preferences/useDateFormat'
import { useToast } from '../../toast'
import { formatNationalIdInput, isValidNationalId } from '../../utils/nationalId'
import { isValidEmail } from '../../utils/emailValidation'
import {
  COSTA_RICA_WHATSAPP_CODE,
  formatWhatsappLocalInput,
  isValidWhatsappLocal,
  whatsappPhoneToLocalDisplay,
} from '../../utils/whatsappPhone'
import {
  defaultOutboundForPackage,
  EMPTY_WHATSAPP_OUTBOUND,
  hasWhatsAppOutboundSelection,
  resolveWhatsAppOutboundResult,
  withWelcomeOutbound,
  type WhatsAppOutboundSelection,
} from '../../utils/whatsappOutbound'
import { DEFAULT_PASSWORD } from './constants'
import { formatRoles, GYM_ROLES, MEMBERSHIP_STATUS_LABELS, membershipStatusBadgeClass, ROLE_LABELS, type GymRole } from '../../roles'

const emptyForm = () => ({
  firstName: '',
  lastName: '',
  email: '',
  password: DEFAULT_PASSWORD,
  nationalId: '',
  whatsappPhone: '',
  roles: ['MEMBER'] as GymRole[],
  membershipPackageId: '' as string | number,
})

export default function UsersSection() {
  const { formatDate } = useDateFormat()
  const { showApiError, showSuccess } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [packages, setPackages] = useState<MembershipPackage[]>([])
  const [templates, setTemplates] = useState<BroadcastMessageTemplate[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [createOutbound, setCreateOutbound] = useState<WhatsAppOutboundSelection>(EMPTY_WHATSAPP_OUTBOUND)
  /** Al crear miembro: enviar bienvenida del plan (por defecto sí). */
  const [sendWelcomeOnCreate, setSendWelcomeOnCreate] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const [waModalOpen, setWaModalOpen] = useState(false)
  const [waPickUser, setWaPickUser] = useState(false)
  const [waSendToAll, setWaSendToAll] = useState(false)
  /** member | phone | all — destinatario del envío de formulario */
  const [waRecipientMode, setWaRecipientMode] = useState<'member' | 'phone'>('member')
  const [waTargetUserId, setWaTargetUserId] = useState<number | ''>('')
  const [waGuestPhone, setWaGuestPhone] = useState('')
  const [waGuestFirstName, setWaGuestFirstName] = useState('')
  const [waOutbound, setWaOutbound] = useState<WhatsAppOutboundSelection>(EMPTY_WHATSAPP_OUTBOUND)
  const [waSending, setWaSending] = useState(false)

  const isEditing = selectedId !== null

  const load = () => {
    api.getUsers().then(setUsers).catch(() => {})
    api.getPackages().then(setPackages).catch(() => {})
    api.getBroadcastTemplates('WHATSAPP').then(setTemplates).catch(() => setTemplates([]))
  }

  useEffect(() => { load() }, [])

  const userSearchExtras = useCallback(
    (u: User) => [
      ...u.roles.map((role) => ROLE_LABELS[role as GymRole] ?? role),
      ...(u.membershipStatus ? [MEMBERSHIP_STATUS_LABELS[u.membershipStatus] ?? u.membershipStatus] : []),
      ...(u.membershipPackageName ? [u.membershipPackageName] : []),
      ...(u.nationalId ? [u.nationalId] : []),
      ...(u.profile?.nationalId ? [u.profile.nationalId] : []),
      ...(u.whatsappPhone ? [u.whatsappPhone] : []),
    ],
    [],
  )
  const { filtered, filterInput } = useFilteredList(users, userSearchExtras)

  const members = users.filter((u) => u.roles.includes('MEMBER') && u.active)
  const usersWithWhatsApp = users.filter((u) => u.active && !!u.whatsappPhone?.trim())
  const waTargetUser = waTargetUserId === '' ? null : users.find((u) => u.id === waTargetUserId) ?? null

  const applyOutboundFeedback = (result: Parameters<typeof resolveWhatsAppOutboundResult>[0]) => {
    const resolved = resolveWhatsAppOutboundResult(result)
    if (resolved.isCloud) {
      showSuccess('Mensajes enviados por WhatsApp (Cloud API).')
    } else if (resolved.url) {
      window.open(resolved.url, '_blank', 'noopener,noreferrer')
      showSuccess('Se abrió WhatsApp con los mensajes seleccionados.')
    } else {
      showSuccess('Mensajes preparados.')
    }
  }

  const outboundDefaultsForUser = (user: User): WhatsAppOutboundSelection => {
    const matchedPackage = packages.find((p) => p.name === user.membershipPackageName)
    return defaultOutboundForPackage(templates, matchedPackage?.id ?? '')
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedId(null)
    setForm(emptyForm())
    setCreateOutbound(EMPTY_WHATSAPP_OUTBOUND)
    setSendWelcomeOnCreate(true)
  }

  const openCreate = () => {
    setSelectedId(null)
    setForm(emptyForm())
    setCreateOutbound(EMPTY_WHATSAPP_OUTBOUND)
    setSendWelcomeOnCreate(true)
    setModalOpen(true)
  }

  const openEdit = (user: User) => {
    const matchedPackage = packages.find((p) => p.name === user.membershipPackageName)
    setSelectedId(user.id)
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      nationalId: user.nationalId ?? user.profile?.nationalId ?? '',
      whatsappPhone: whatsappPhoneToLocalDisplay(user.whatsappPhone),
      roles: user.roles.filter((r): r is GymRole => GYM_ROLES.includes(r as GymRole)),
      membershipPackageId: matchedPackage?.id ?? '',
    })
    setCreateOutbound(EMPTY_WHATSAPP_OUTBOUND)
    setSendWelcomeOnCreate(true)
    setModalOpen(true)
  }

  const openWhatsappModalForUser = (user: User) => {
    setWaPickUser(false)
    setWaSendToAll(false)
    setWaRecipientMode('member')
    setWaTargetUserId(user.id)
    setWaOutbound(outboundDefaultsForUser(user))
    setWaModalOpen(true)
  }

  const openWhatsappModalPicker = () => {
    setWaPickUser(true)
    setWaSendToAll(false)
    setWaRecipientMode('member')
    setWaTargetUserId('')
    setWaGuestPhone('')
    setWaGuestFirstName('')
    setWaOutbound({ ...EMPTY_WHATSAPP_OUTBOUND, sendRegistrationForm: true })
    setWaModalOpen(true)
  }

  const closeWhatsappModal = () => {
    setWaModalOpen(false)
    setWaPickUser(false)
    setWaSendToAll(false)
    setWaRecipientMode('member')
    setWaTargetUserId('')
    setWaGuestPhone('')
    setWaGuestFirstName('')
    setWaOutbound(EMPTY_WHATSAPP_OUTBOUND)
  }

  const handleWaSendToAllChange = (checked: boolean) => {
    setWaSendToAll(checked)
    if (checked) {
      setWaRecipientMode('member')
      setWaTargetUserId('')
      setWaGuestPhone('')
      setWaOutbound(EMPTY_WHATSAPP_OUTBOUND)
    }
  }

  const handleWaRecipientModeChange = (mode: 'member' | 'phone') => {
    setWaRecipientMode(mode)
    setWaSendToAll(false)
    if (mode === 'phone') {
      setWaTargetUserId('')
      setWaOutbound({ ...EMPTY_WHATSAPP_OUTBOUND, sendRegistrationForm: true })
    } else {
      setWaGuestPhone('')
      setWaGuestFirstName('')
      setWaOutbound(EMPTY_WHATSAPP_OUTBOUND)
    }
  }

  const handleWaMemberChange = (memberId: number | '') => {
    setWaTargetUserId(memberId)
    if (memberId === '') {
      setWaOutbound(EMPTY_WHATSAPP_OUTBOUND)
      return
    }
    const user = users.find((u) => u.id === memberId)
    setWaOutbound(user ? outboundDefaultsForUser(user) : EMPTY_WHATSAPP_OUTBOUND)
  }

  const handleSendWhatsappMessages = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasWhatsAppOutboundSelection(waOutbound)) {
      showApiError(new Error('Selecciona al menos un mensaje'), 'Nada seleccionado')
      return
    }

    const payload = {
      sendRegistrationForm: waOutbound.sendRegistrationForm,
      templateIds: waOutbound.templateIds,
    }

    setWaSending(true)
    try {
      if (waSendToAll) {
        if (usersWithWhatsApp.length === 0) {
          showApiError(new Error('No hay usuarios con WhatsApp'), 'Sin destinatarios')
          return
        }
        const result = await api.sendWhatsappMessagesBulk(payload)
        if (result.failedCount > 0) {
          showSuccess(
            `Enviado a ${result.sentCount} de ${result.recipientCount}. `
              + `${result.failedCount} fallaron`
              + (result.errors?.[0] ? `: ${result.errors[0]}` : '.'),
          )
        } else {
          showSuccess(`Mensajes enviados a ${result.sentCount} usuario${result.sentCount === 1 ? '' : 's'} con WhatsApp.`)
        }
        closeWhatsappModal()
        return
      }

      if (waPickUser && waRecipientMode === 'phone') {
        if (!isValidWhatsappLocal(waGuestPhone)) {
          showApiError(new Error('Indica un WhatsApp de 8 dígitos'), 'Número inválido')
          return
        }
        const result = await api.sendWhatsappMessagesToPhone({
          whatsappPhone: waGuestPhone,
          firstName: waGuestFirstName.trim() || undefined,
          ...payload,
        })
        applyOutboundFeedback(result)
        closeWhatsappModal()
        return
      }

      if (!waTargetUser) {
        showApiError(new Error('Selecciona un miembro'), 'Miembro requerido')
        return
      }
      if (!waTargetUser.whatsappPhone?.trim()) {
        showApiError(new Error('El miembro no tiene WhatsApp'), 'Sin número de WhatsApp')
        return
      }
      const result = await api.sendUserWhatsappMessages(waTargetUser.id, payload)
      applyOutboundFeedback(result)
      closeWhatsappModal()
    } catch (err) {
      showApiError(err, 'No se pudo preparar el envío por WhatsApp')
    } finally {
      setWaSending(false)
    }
  }

  const requiresNationalId = true
  const requiresMembership = form.roles.includes('MEMBER')
  const emailValid = isValidEmail(form.email)
  const nationalIdValid = isValidNationalId(form.nationalId)
  const membershipValid = !requiresMembership || form.membershipPackageId !== ''
  const namesValid = form.firstName.trim().length > 0 && form.lastName.trim().length > 0
  const passwordValid = isEditing || form.password.trim().length > 0
  const rolesValid = form.roles.length > 0
  const whatsappValid = isEditing
    ? form.whatsappPhone.length === 0 || isValidWhatsappLocal(form.whatsappPhone)
    : isValidWhatsappLocal(form.whatsappPhone)
  const formValid = namesValid && emailValid && nationalIdValid && membershipValid
    && passwordValid && rolesValid && whatsappValid

  const handleMembershipChange = (membershipPackageId: string) => {
    setForm((prev) => ({ ...prev, membershipPackageId }))
    if (!isEditing && form.roles.includes('MEMBER')) {
      setCreateOutbound((prev) =>
        withWelcomeOutbound(prev, templates, membershipPackageId, sendWelcomeOnCreate),
      )
    }
  }

  const handleSendWelcomeChange = (checked: boolean) => {
    setSendWelcomeOnCreate(checked)
    if (!isEditing && form.roles.includes('MEMBER')) {
      setCreateOutbound((prev) =>
        withWelcomeOutbound(prev, templates, form.membershipPackageId, checked),
      )
    }
  }

  const handleRolesChange = (roles: GymRole[]) => {
    setForm((prev) => ({ ...prev, roles }))
    if (!roles.includes('MEMBER')) {
      setCreateOutbound(EMPTY_WHATSAPP_OUTBOUND)
      return
    }
    if (!isEditing) {
      setCreateOutbound((prev) =>
        withWelcomeOutbound(
          prev.sendRegistrationForm || prev.templateIds.length > 0
            ? prev
            : EMPTY_WHATSAPP_OUTBOUND,
          templates,
          form.membershipPackageId,
          sendWelcomeOnCreate,
        ),
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formValid) return

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        roles: form.roles,
      }
      if (!isEditing || form.password.trim()) {
        payload.password = form.password.trim() || DEFAULT_PASSWORD
      }
      payload.nationalId = formatNationalIdInput(form.nationalId)
      if (requiresMembership) {
        payload.membershipPackageId = Number(form.membershipPackageId)
      }
      if (form.whatsappPhone.trim()) {
        payload.whatsappPhone = form.whatsappPhone.trim()
      }

      if (isEditing) {
        await api.updateUser(selectedId, payload)
        showSuccess('Usuario actualizado')
      } else {
        const outbound = withWelcomeOutbound(
          createOutbound,
          templates,
          form.membershipPackageId,
          sendWelcomeOnCreate,
        )
        const shouldSendWa = requiresMembership && hasWhatsAppOutboundSelection(outbound)
        if (shouldSendWa) {
          payload.sendRegistrationForm = outbound.sendRegistrationForm
          payload.broadcastTemplateIds = outbound.templateIds
        }
        const created = await api.createUser(payload)
        showSuccess('Usuario creado')
        if (shouldSendWa) {
          applyOutboundFeedback(created)
        }
      }
      closeModal()
      load()
    } catch (err) {
      showApiError(err, 'No se pudo guardar el usuario')
    } finally {
      setSaving(false)
    }
  }

  const waGuestPhoneValid = isValidWhatsappLocal(waGuestPhone)
  const waSubmitDisabled = !hasWhatsAppOutboundSelection(waOutbound)
    || (waSendToAll
      ? usersWithWhatsApp.length === 0
      : waPickUser && waRecipientMode === 'phone'
        ? !waGuestPhoneValid
        : !waTargetUser || !waTargetUser.whatsappPhone?.trim())

  return (
    <div className="admin-section">
      <div className="admin-list-toolbar">
        <div className="list-filter">{filterInput}</div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn-secondary admin-list-create-btn" onClick={openWhatsappModalPicker}>
            Enviar formulario
          </button>
          <button type="button" className="btn-primary admin-list-create-btn" onClick={openCreate}>
            Crear Usuario
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="empty-state card">No hay usuarios registrados.</div>
      ) : (
        <div className="grid grid-2">
          {filtered.length === 0 ? (
            <div className="empty-state card">Ningún resultado coincide con la búsqueda</div>
          ) : filtered.map((u) => (
            <div
              key={u.id}
              className="card card-selectable"
              onClick={() => openEdit(u)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openEdit(u)}
            >
              <h3>{u.firstName} {u.lastName}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{u.email}</p>
              {u.whatsappPhone && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                  WhatsApp: {u.whatsappPhone}
                </p>
              )}
              {u.nationalId && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem', marginBottom: 0 }}>
                  Cédula: {u.nationalId}
                </p>
              )}
              {!u.nationalId && u.profile?.nationalId && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                  Cédula: {u.profile.nationalId}
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {u.roles.map((role) => (
                  <span key={role} className="badge badge-active">
                    {ROLE_LABELS[role as GymRole] ?? role}
                  </span>
                ))}
                {u.roles.includes('MEMBER') && u.membershipStatus && (
                  <span className={`badge ${membershipStatusBadgeClass(u.membershipStatus)}`}>
                    {MEMBERSHIP_STATUS_LABELS[u.membershipStatus] ?? u.membershipStatus}
                  </span>
                )}
              </div>
              {u.roles.includes('MEMBER') && u.membershipStatus === 'PAYMENT_PENDING' && (
                <div style={{ marginTop: '0.5rem' }}>
                  {u.nextPaymentDate && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 0.35rem' }}>
                      Venció el {formatDate(u.nextPaymentDate)}
                    </p>
                  )}
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                    Plan: {u.membershipPackageName ?? 'Sin plan asignado'}
                  </p>
                </div>
              )}
              {u.roles.includes('MEMBER') && u.membershipStatus === 'ACTIVE' && u.nextPaymentDate && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: 0 }}>
                  Próximo pago: {formatDate(u.nextPaymentDate)}
                </p>
              )}
              {u.roles.includes('MEMBER') && u.membershipStatus === 'ACTIVE' && u.membershipPackageName && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.35rem', marginBottom: 0 }}>
                  Plan: {u.membershipPackageName}
                </p>
              )}
              {u.roles.includes('MEMBER') && !!u.whatsappPhone && (
                <div style={{ marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation()
                      openWhatsappModalForUser(u)
                    }}
                  >
                    Enviar mensaje de WhatsApp
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AdminFormModal
        title={isEditing ? 'Editar usuario' : 'Nuevo usuario'}
        open={modalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        saving={saving}
        submitLabel={isEditing ? 'Guardar cambios' : 'Crear usuario'}
        submitDisabled={!formValid}
        intro={!isEditing ? (
          <p className="admin-form-intro">
            Completa todos los campos. La contraseña por defecto es <strong>{DEFAULT_PASSWORD}</strong>.
            Asigna uno o más roles; cada perfil habilita funciones distintas en la app.
          </p>
        ) : form.roles.length > 0 ? (
          <p className="admin-form-intro">
            Perfiles: {formatRoles(form.roles)}
          </p>
        ) : undefined}
      >
        <div className="form-group">
          <label>Nombre</label>
          <input
            value={form.firstName}
            onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
            required
          />
        </div>
        <div className="form-group">
          <label>Apellido</label>
          <input
            value={form.lastName}
            onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
            required
          />
        </div>
        {requiresNationalId && (
          <div className="form-group">
            <label>Cédula de identidad</label>
            <input
              inputMode="numeric"
              autoComplete="off"
              value={form.nationalId}
              onChange={(e) => setForm((prev) => ({
                ...prev,
                nationalId: formatNationalIdInput(e.target.value),
              }))}
              placeholder="9 dígitos"
              maxLength={9}
              pattern="\d{9}"
              title="La cédula debe tener 9 dígitos numéricos"
              required
            />
            {form.nationalId.length > 0 && !isValidNationalId(form.nationalId) && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                La cédula debe tener exactamente 9 dígitos numéricos
              </p>
            )}
          </div>
        )}
        <div className="form-group">
          <label>Correo de acceso</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            autoComplete="email"
            required
          />
          {form.email.trim().length > 0 && !emailValid && (
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              Ingresa un correo válido (ejemplo: usuario@dominio.com)
            </p>
          )}
        </div>
        <div className="form-group">
          <label>WhatsApp</label>
          <div className="phone-input-group">
            <input
              type="text"
              className="phone-input-prefix"
              value={COSTA_RICA_WHATSAPP_CODE}
              disabled
              readOnly
              aria-label="Código de país Costa Rica"
            />
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={form.whatsappPhone}
              onChange={(e) => setForm((prev) => ({
                ...prev,
                whatsappPhone: formatWhatsappLocalInput(e.target.value),
              }))}
              placeholder="88887777"
              maxLength={8}
              required={!isEditing}
            />
          </div>
          <p className="form-hint">
            Número local de 8 dígitos. El código de Costa Rica ({COSTA_RICA_WHATSAPP_CODE}) se agrega automáticamente.
          </p>
          {form.whatsappPhone.length > 0 && !whatsappValid && (
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              El número debe tener exactamente 8 dígitos
            </p>
          )}
        </div>
        <div className="form-group">
          <label>Contraseña</label>
          <input
            type="text"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder={isEditing ? 'Dejar vacío para no cambiar' : DEFAULT_PASSWORD}
            required={!isEditing}
          />
          <p className="form-hint">
            {isEditing
              ? 'Dejar vacío para conservar la contraseña actual.'
              : `La contraseña por defecto es ${DEFAULT_PASSWORD}. Puedes cambiarla antes de crear el usuario.`}
          </p>
        </div>
        <div className="form-group">
          <label>Roles</label>
          <MultiSelect
            options={GYM_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
            value={form.roles}
            onChange={(roles) => handleRolesChange(roles as GymRole[])}
            placeholder="Escribe un rol y pulsa Enter…"
          />
          {form.roles.length === 0 && (
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
              Selecciona al menos un rol
            </p>
          )}
        </div>
        {form.roles.includes('MEMBER') && (
          <div className="form-group">
            <label>Membresía</label>
            <select
              value={form.membershipPackageId}
              onChange={(e) => handleMembershipChange(e.target.value)}
              required
            >
              <option value="" disabled>Seleccionar plan…</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {!membershipValid && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                Selecciona una membresía
              </p>
            )}
          </div>
        )}
        {!isEditing && form.roles.includes('MEMBER') && (
          <>
            <div className="form-group form-group--switch">
              <HorizontalSwitch
                id="create-user-send-welcome"
                label="¿Enviar mensaje de bienvenida al crear?"
                offLabel="No"
                onLabel="Sí"
                checked={sendWelcomeOnCreate}
                onChange={handleSendWelcomeChange}
                disabled={!form.whatsappPhone.trim() || !whatsappValid}
              />
              <p className="form-hint" style={{ marginTop: '0.35rem' }}>
                {!form.whatsappPhone.trim() || !whatsappValid
                  ? 'Indica un WhatsApp válido para poder enviar la bienvenida.'
                  : form.membershipPackageId === ''
                    ? 'Selecciona un plan para usar la plantilla de bienvenida asociada.'
                    : sendWelcomeOnCreate
                      ? 'Al crear el usuario se enviará la bienvenida del plan por WhatsApp.'
                      : 'No se enviará el mensaje de bienvenida al finalizar.'}
              </p>
            </div>
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <WhatsAppOutboundPicker
                templates={templates}
                packages={packages}
                value={createOutbound}
                onChange={(next) => {
                  setCreateOutbound(next)
                  const hasWelcome = next.templateIds.some((id) => {
                    const template = templates.find((t) => t.id === id)
                    return template?.purpose === 'WELCOME'
                  })
                  setSendWelcomeOnCreate(hasWelcome)
                }}
                membershipPackageId={form.membershipPackageId}
                disabled={!whatsappValid || !form.whatsappPhone.trim()}
                hint={
                  !form.whatsappPhone.trim()
                    ? 'Indica un WhatsApp válido para poder enviar mensajes al crear.'
                    : 'También puedes incluir el formulario de registro u otras plantillas.'
                }
              />
            </div>
          </>
        )}
        {isEditing && form.roles.includes('MEMBER') && (
          <p className="form-hint" style={{ marginTop: '0.5rem' }}>
            Para enviar formularios o plantillas usa <strong>Enviar formulario</strong> en la barra
            o <strong>Enviar mensaje de WhatsApp</strong> en la tarjeta del usuario.
          </p>
        )}
      </AdminFormModal>

      <AdminFormModal
        title="Enviar formulario / WhatsApp"
        open={waModalOpen}
        onClose={closeWhatsappModal}
        onSubmit={handleSendWhatsappMessages}
        saving={waSending}
        submitLabel={waSendToAll ? `Enviar a ${usersWithWhatsApp.length}` : 'Enviar'}
        submitDisabled={waSubmitDisabled}
        intro={(
          <p className="admin-form-intro">
            {waSendToAll
              ? 'Se enviará a todos los usuarios activos con WhatsApp (requiere Cloud API).'
              : waPickUser && waRecipientMode === 'phone'
                ? 'Envía el formulario o plantillas a un número libre (prospecto / pre-inscripción). El enlace es público, sin usuario creado.'
                : 'Elige el miembro y los mensajes (formulario de registro o plantillas). La bienvenida del plan queda activa por defecto cuando aplica.'}
          </p>
        )}
      >
        {waPickUser && (
          <div className="form-group wa-send-all-row">
            <div className="wa-outbound-picker-row" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.65rem 0.75rem' }}>
              <div className="wa-outbound-picker-row-text">
                <strong>Enviar a todos con WhatsApp</strong>
                <span className="text-muted">
                  {usersWithWhatsApp.length === 0
                    ? 'No hay usuarios activos con número'
                    : `${usersWithWhatsApp.length} usuario${usersWithWhatsApp.length === 1 ? '' : 's'} con número`}
                </span>
              </div>
              <HorizontalSwitch
                compact
                label="Enviar a todos con WhatsApp"
                checked={waSendToAll}
                onChange={handleWaSendToAllChange}
                disabled={usersWithWhatsApp.length === 0}
              />
            </div>
          </div>
        )}

        {waPickUser && !waSendToAll && (
          <div className="form-group">
            <label className="form-label">Destinatario</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={waRecipientMode === 'member' ? 'btn-primary' : 'btn-secondary'}
                onClick={() => handleWaRecipientModeChange('member')}
              >
                Miembro
              </button>
              <button
                type="button"
                className={waRecipientMode === 'phone' ? 'btn-primary' : 'btn-secondary'}
                onClick={() => handleWaRecipientModeChange('phone')}
              >
                Número libre
              </button>
            </div>
          </div>
        )}

        {waPickUser && !waSendToAll && waRecipientMode === 'member' ? (
          <div className="form-group">
            <MemberSearchSelect
              members={members}
              value={waTargetUserId}
              onChange={handleWaMemberChange}
              label="Miembro"
              placeholder="Buscar miembro…"
              required
            />
            {waTargetUser && !waTargetUser.whatsappPhone?.trim() && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                Este miembro no tiene WhatsApp. Edítalo para agregar el número.
              </p>
            )}
          </div>
        ) : waPickUser && !waSendToAll && waRecipientMode === 'phone' ? (
          <>
            <div className="form-group">
              <label htmlFor="wa-guest-name">Nombre (opcional)</label>
              <input
                id="wa-guest-name"
                type="text"
                value={waGuestFirstName}
                onChange={(e) => setWaGuestFirstName(e.target.value)}
                placeholder="Ej. Ana"
                autoComplete="given-name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="wa-guest-phone">WhatsApp</label>
              <div className="phone-input-group">
                <input
                  type="text"
                  className="phone-input-prefix"
                  value={COSTA_RICA_WHATSAPP_CODE}
                  disabled
                  readOnly
                  aria-label="Código de país Costa Rica"
                />
                <input
                  id="wa-guest-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={waGuestPhone}
                  onChange={(e) => setWaGuestPhone(formatWhatsappLocalInput(e.target.value))}
                  placeholder="88887777"
                  maxLength={8}
                  required
                />
              </div>
              {!waGuestPhoneValid && waGuestPhone.length > 0 && (
                <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.35rem' }}>
                  Debe tener 8 dígitos.
                </p>
              )}
            </div>
          </>
        ) : !waPickUser && waTargetUser ? (
          <p className="admin-form-intro" style={{ marginTop: 0 }}>
            Mensajes para {waTargetUser.firstName} {waTargetUser.lastName}
            {waTargetUser.whatsappPhone ? ` (${waTargetUser.whatsappPhone})` : ''}.
          </p>
        ) : null}

        <WhatsAppOutboundPicker
          templates={templates}
          packages={packages}
          value={waOutbound}
          onChange={setWaOutbound}
          membershipPackageId={
            !waSendToAll && waRecipientMode === 'member' && waTargetUser
              ? packages.find((p) => p.name === waTargetUser.membershipPackageName)?.id ?? ''
              : ''
          }
          disabled={
            waSendToAll
              ? usersWithWhatsApp.length === 0
              : waPickUser && waRecipientMode === 'phone'
                ? !waGuestPhoneValid
                : !waTargetUser || !waTargetUser.whatsappPhone?.trim()
          }
          hint={
            waSendToAll
              ? 'Activa los mensajes que quieres enviar a todos. Requiere Cloud API.'
              : waPickUser && waRecipientMode === 'phone'
                ? !waGuestPhoneValid
                  ? 'Indica un WhatsApp válido de 8 dígitos.'
                  : 'El formulario se envía con enlace público (sin miembro creado).'
                : !waTargetUser
                  ? 'Selecciona un miembro para ver y activar mensajes.'
                  : !waTargetUser.whatsappPhone?.trim()
                    ? 'Sin número de WhatsApp no se puede enviar.'
                    : undefined
          }
        />
      </AdminFormModal>
    </div>
  )
}

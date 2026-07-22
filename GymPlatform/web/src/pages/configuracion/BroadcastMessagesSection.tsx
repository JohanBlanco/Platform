import { useCallback, useEffect, useRef, useState, type ClipboardEvent } from 'react'
import { api } from '../../api'
import AdminFormModal from '../../components/AdminFormModal'
import HorizontalSwitch from '../../components/HorizontalSwitch'
import WhatsAppVariableAutocomplete, {
  type VariableSuggestion,
} from '../../components/WhatsAppVariableAutocomplete'
import { useFilteredList } from '../../hooks/useFilteredList'
import { useToast } from '../../toast'
import type {
  BroadcastChannelSettings,
  BroadcastMessageTemplate,
  BroadcastTemplatePurpose,
  CustomForm,
  MembershipPackage,
} from '../../types'
import { encryptWhatsAppSecrets } from '../../utils/whatsappSecretsCrypto'
import {
  BROADCAST_EMOJI_PICKER,
  insertAtCursor,
  replaceRange,
  WhatsAppMessagePreview,
} from '../../utils/whatsappMessagePreview'
import {
  extractUrlsFromText,
  mergeMediaLinkLines,
  normalizeWhatsAppPaste,
} from '../../utils/whatsappPaste'
import { formLinkVariable, resolveFormLinks } from './forms/formBuilderConstants'

type BroadcastChannelTab = 'WHATSAPP'

type Props = {
  /** Si se define, muestra solo ese canal (p. ej. desde Configuración del perfil). */
  fixedChannel?: BroadcastChannelTab
  variant: 'wame' | 'cloud' | 'templates'
}

const CHANNEL_TABS: { id: BroadcastChannelTab; label: string }[] = [
  { id: 'WHATSAPP', label: 'WhatsApp' },
]

const PURPOSE_LABELS: Record<BroadcastTemplatePurpose, string> = {
  GENERAL: 'General',
  WELCOME: 'Bienvenida',
}

const emptyTemplateForm = () => ({
  name: '',
  body: '',
  purpose: 'GENERAL' as BroadcastTemplatePurpose,
  membershipPackageId: '' as string | number,
  mediaLinksText: '',
})

function readFileAsBase64(file: File): Promise<{ base64: string; mimeType: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result ?? '')
      const comma = result.indexOf(',')
      const base64 = comma >= 0 ? result.slice(comma + 1) : result
      resolve({
        base64,
        mimeType: file.type || 'application/octet-stream',
        filename: file.name,
      })
    }
    reader.onerror = () => reject(reader.error ?? new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })
}

export default function BroadcastMessagesSection({ fixedChannel, variant }: Props) {
  const { showSuccess, showApiError } = useToast()
  const isWame = variant === 'wame'
  const isCloud = variant === 'cloud'
  const isTemplates = variant === 'templates'
  const [channel, setChannel] = useState<BroadcastChannelTab>(fixedChannel ?? 'WHATSAPP')
  const [settings, setSettings] = useState<BroadcastChannelSettings | null>(null)
  const [senderPhone, setSenderPhone] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [cloudApiAppId, setCloudApiAppId] = useState('')
  const [cloudApiPhoneNumberId, setCloudApiPhoneNumberId] = useState('1224970924032254')
  const [cloudApiWabaId, setCloudApiWabaId] = useState('3106195989577645')
  const [cloudApiGraphVersion, setCloudApiGraphVersion] = useState('v25.0')
  const [accessTokenInput, setAccessTokenInput] = useState('')
  const [appSecretInput, setAppSecretInput] = useState('')
  const [verifyTokenInput, setVerifyTokenInput] = useState('')
  const [clearAccessToken, setClearAccessToken] = useState(false)
  const [clearAppSecret, setClearAppSecret] = useState(false)
  const [clearVerifyToken, setClearVerifyToken] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsDirty, setSettingsDirty] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const skipAutoSaveRef = useRef(true)
  const [templates, setTemplates] = useState<BroadcastMessageTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyTemplateForm())
  const [templateSaving, setTemplateSaving] = useState(false)
  const bodyTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [referenceForms, setReferenceForms] = useState<CustomForm[]>([])
  const [packages, setPackages] = useState<MembershipPackage[]>([])
  const [waWebModalOpen, setWaWebModalOpen] = useState(false)
  const [waWebConfirmed, setWaWebConfirmed] = useState(false)

  const [testTo, setTestTo] = useState('')
  const [testBody, setTestBody] = useState('')
  const [testDocumentUrl, setTestDocumentUrl] = useState('')
  const [testCaption, setTestCaption] = useState('')
  const [testFile, setTestFile] = useState<File | null>(null)
  const [testSending, setTestSending] = useState(false)
  const [lastMessageId, setLastMessageId] = useState<string | null>(null)

  const deliveryMode = isCloud ? 'CLOUD_API' as const : 'WA_ME' as const

  const applySettingsToForm = (data: BroadcastChannelSettings) => {
    setSettings(data)
    setSenderPhone(data.senderPhone ?? '')
    setEnabled(data.enabled)
    setCloudApiAppId(data.cloudApiAppId ?? '')
    setCloudApiPhoneNumberId(data.cloudApiPhoneNumberId || '1224970924032254')
    setCloudApiWabaId(data.cloudApiWabaId || '3106195989577645')
    setCloudApiGraphVersion(data.cloudApiGraphVersion || 'v25.0')
    setAccessTokenInput('')
    setAppSecretInput('')
    setVerifyTokenInput('')
    setClearAccessToken(false)
    setClearAppSecret(false)
    setClearVerifyToken(false)
  }

  const buildSettingsPayload = useCallback(async (options?: {
    enabledOverride?: boolean
    whatsappWebSessionConfirmed?: boolean
    includeSecrets?: boolean
  }) => {
    const nextEnabled = options?.enabledOverride ?? enabled
    const sessionConfirmed = options?.whatsappWebSessionConfirmed
      ?? (nextEnabled && isWame
        ? true // wa.me: no bloquear guardado/auto-guardado por la bandera de sesión
        : false)

    let encryptedSecrets = null
    if (options?.includeSecrets !== false && isCloud && settings?.cryptoPublicKeyPem) {
      encryptedSecrets = await encryptWhatsAppSecrets(
        settings.cryptoPublicKeyPem,
        settings.cryptoKeyId,
        settings.cryptoAlg,
        {
          accessToken: clearAccessToken ? undefined : accessTokenInput,
          appSecret: clearAppSecret ? undefined : appSecretInput,
          verifyToken: clearVerifyToken ? undefined : verifyTokenInput,
        },
      )
    }

    return {
      senderPhone: senderPhone.trim() || null,
      enabled: nextEnabled,
      whatsappWebSessionConfirmed: sessionConfirmed,
      deliveryMode,
      cloudApiAppId: cloudApiAppId.trim() || null,
      cloudApiPhoneNumberId: cloudApiPhoneNumberId.trim() || null,
      cloudApiWabaId: cloudApiWabaId.trim() || null,
      cloudApiGraphVersion: cloudApiGraphVersion.trim() || 'v25.0',
      encryptedSecrets,
      clearAccessToken: isCloud && clearAccessToken ? true : undefined,
      clearAppSecret: isCloud && clearAppSecret ? true : undefined,
      clearVerifyToken: isCloud && clearVerifyToken ? true : undefined,
    }
  }, [
    accessTokenInput,
    appSecretInput,
    clearAccessToken,
    clearAppSecret,
    clearVerifyToken,
    cloudApiAppId,
    cloudApiGraphVersion,
    cloudApiPhoneNumberId,
    cloudApiWabaId,
    deliveryMode,
    enabled,
    isCloud,
    isWame,
    senderPhone,
    settings?.cryptoAlg,
    settings?.cryptoKeyId,
    settings?.cryptoPublicKeyPem,
    settings?.whatsappWebSessionConfirmed,
    verifyTokenInput,
  ])

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true)
    try {
      const data = await api.getBroadcastChannelSettings(channel)
      applySettingsToForm(data)
      setSettingsDirty(false)
      setAutoSaveStatus('idle')
      skipAutoSaveRef.current = true
    } catch (err) {
      showApiError(err, 'No se pudo cargar la configuración')
    } finally {
      setSettingsLoading(false)
    }
  }, [channel, showApiError])

  const loadTemplates = useCallback(async () => {
    if (!isTemplates) {
      setTemplates([])
      setTemplatesLoading(false)
      return
    }
    setTemplatesLoading(true)
    try {
      const data = await api.getBroadcastTemplates(channel)
      setTemplates(data)
    } catch (err) {
      showApiError(err, 'No se pudieron cargar las plantillas')
      setTemplates([])
    } finally {
      setTemplatesLoading(false)
    }
  }, [channel, isTemplates, showApiError])

  useEffect(() => {
    if (isTemplates) {
      loadTemplates()
      api.getForms().then(setReferenceForms).catch(() => setReferenceForms([]))
      api.getPackages().then(setPackages).catch(() => setPackages([]))
      return
    }
    loadSettings()
  }, [loadSettings, loadTemplates, isTemplates])

  const persistSettings = useCallback(async (options?: {
    showToast?: boolean
    enabledOverride?: boolean
    whatsappWebSessionConfirmed?: boolean
    includeSecrets?: boolean
  }) => {
    const showToast = options?.showToast ?? false
    setSettingsSaving(true)
    setAutoSaveStatus('saving')
    try {
      const payload = await buildSettingsPayload(options)
      const data = await api.updateBroadcastChannelSettings(channel, payload)
      applySettingsToForm(data)
      setSettingsDirty(false)
      setAutoSaveStatus('saved')
      if (showToast) {
        showSuccess('Configuración guardada')
      }
    } catch (err) {
      setAutoSaveStatus('idle')
      showApiError(err, 'No se pudo guardar la configuración')
      throw err
    } finally {
      setSettingsSaving(false)
    }
  }, [buildSettingsPayload, channel, showApiError, showSuccess])

  useEffect(() => {
    if (isTemplates) return
    if (settingsLoading || !settings) return
    if (skipAutoSaveRef.current) {
      skipAutoSaveRef.current = false
      return
    }
    if (!settingsDirty) return

    const timer = window.setTimeout(() => {
      // Auto-guardado sin secretos nuevos (los secretos solo al pulsar Guardar).
      void persistSettings({ includeSecrets: false })
    }, 700)

    return () => window.clearTimeout(timer)
  }, [
    isTemplates,
    settingsDirty,
    settingsLoading,
    settings,
    persistSettings,
    senderPhone,
    enabled,
    cloudApiAppId,
    cloudApiPhoneNumberId,
    cloudApiWabaId,
    cloudApiGraphVersion,
  ])

  const { filtered, filterInput } = useFilteredList(templates)

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await persistSettings({ showToast: true, includeSecrets: true })
    } catch {
      // error toast already shown
    }
  }

  const markSettingsDirty = () => {
    setSettingsDirty(true)
    setAutoSaveStatus('idle')
  }

  const handleEnabledChange = (value: boolean) => {
    if (value) {
      if (isCloud) {
        if (!cloudApiPhoneNumberId.trim() || (!settings?.cloudApiAccessTokenConfigured && !accessTokenInput.trim())) {
          showApiError(
            new Error('Indica Phone-Number-ID y User-Access-Token antes de activar Cloud API'),
            'Faltan credenciales Cloud API',
          )
          return
        }
        void (async () => {
          try {
            setEnabled(true)
            await persistSettings({
              showToast: true,
              enabledOverride: true,
              includeSecrets: true,
            })
          } catch {
            setEnabled(false)
          }
        })()
        return
      }
      if (!senderPhone.trim()) {
        showApiError(new Error('Indica el número de WhatsApp antes de activar'), 'Falta el número de WhatsApp')
        return
      }
      setWaWebConfirmed(false)
      setWaWebModalOpen(true)
      return
    }
    setEnabled(false)
    markSettingsDirty()
  }

  const closeWaWebModal = () => {
    setWaWebModalOpen(false)
    setWaWebConfirmed(false)
  }

  const handleWaWebConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!waWebConfirmed) return
    try {
      setEnabled(true)
      await persistSettings({
        showToast: true,
        enabledOverride: true,
        whatsappWebSessionConfirmed: true,
        includeSecrets: true,
      })
      closeWaWebModal()
    } catch {
      setEnabled(false)
    }
  }

  const openCreateTemplate = () => {
    setSelectedId(null)
    setForm(emptyTemplateForm())
    setModalOpen(true)
  }

  const openEditTemplate = (template: BroadcastMessageTemplate) => {
    setSelectedId(template.id)
    setForm({
      name: template.name,
      body: template.body,
      purpose: template.purpose ?? 'GENERAL',
      membershipPackageId: template.membershipPackageId ?? '',
      mediaLinksText: (template.mediaLinks ?? []).join('\n'),
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedId(null)
    setForm(emptyTemplateForm())
  }

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTemplateSaving(true)
    try {
      const mediaLinks = form.mediaLinksText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
      const payload = {
        name: form.name,
        body: form.body,
        purpose: form.purpose,
        membershipPackageId: form.membershipPackageId === '' ? null : Number(form.membershipPackageId),
        mediaLinks,
      }
      if (selectedId != null) {
        await api.updateBroadcastTemplate(channel, selectedId, payload)
        showSuccess('Plantilla actualizada')
      } else {
        await api.createBroadcastTemplate(channel, payload)
        showSuccess('Plantilla creada')
      }
      closeModal()
      loadTemplates()
    } catch (err) {
      showApiError(err, 'No se pudo guardar la plantilla')
    } finally {
      setTemplateSaving(false)
    }
  }

  const insertFormLink = (slug: string) => {
    const token = formLinkVariable(slug)
    setForm((prev) => ({
      ...prev,
      body: prev.body.trim() ? `${prev.body.trim()}\n${token}` : token,
    }))
  }

  const insertEmoji = (emoji: string) => {
    const el = bodyTextareaRef.current
    const { next, caret } = insertAtCursor(el, form.body, emoji)
    setForm((prev) => ({ ...prev, body: next }))
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }

  const variableSuggestions: VariableSuggestion[] = [
    { token: '{{nombre}}', label: 'nombre', description: 'Nombre del miembro' },
    { token: '{{gimnasio}}', label: 'gimnasio', description: 'Nombre del gimnasio' },
    ...referenceForms.map((item) => ({
      token: formLinkVariable(item.slug),
      label: `form:${item.slug}`,
      description: `Enlace: ${item.title}`,
    })),
  ]

  const insertVariableToken = (token: string, start: number, end: number) => {
    const el = bodyTextareaRef.current
    const { next, caret } = replaceRange(form.body, start, end, token)
    setForm((prev) => ({ ...prev, body: next }))
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      el.setSelectionRange(caret, caret)
    })
  }

  const applyPasteToBody = (plain: string, html: string) => {
    const el = bodyTextareaRef.current
    const parsed = normalizeWhatsAppPaste({ plain, html })
    const { next, caret } = insertAtCursor(el, form.body, parsed.body)
    setForm((prev) => ({
      ...prev,
      body: next.slice(0, 4096),
      mediaLinksText: mergeMediaLinkLines(prev.mediaLinksText, parsed.mediaUrls),
    }))
    if (parsed.mediaUrls.length > 0) {
      showSuccess(
        parsed.mediaUrls.length === 1
          ? 'Se detectó 1 enlace de imagen/archivo y se añadió a media.'
          : `Se detectaron ${parsed.mediaUrls.length} enlaces de imagen/archivo y se añadieron a media.`,
      )
    }
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      const pos = Math.min(caret, 4096)
      el.setSelectionRange(pos, pos)
    })
  }

  const handleBodyPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = e.clipboardData?.files
    if (files && files.length > 0) {
      e.preventDefault()
      showApiError(
        new Error('wa.me no adjunta archivos binarios'),
        'Sube la imagen/archivo a Drive, Dropbox o similar y pega aquí el enlace público (https://…).',
      )
      return
    }
    const plain = e.clipboardData.getData('text/plain')
    const html = e.clipboardData.getData('text/html')
    // Siempre normalizar: ChatGPT / Word suelen traer HTML + emojis en plain
    if (!plain && !html) return
    e.preventDefault()
    applyPasteToBody(plain, html)
  }

  const handleMediaPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const plain = e.clipboardData.getData('text/plain')
    const html = e.clipboardData.getData('text/html')
    const fromPaste = normalizeWhatsAppPaste({ plain, html })
    const urls = [
      ...fromPaste.mediaUrls,
      ...extractUrlsFromText(fromPaste.body || plain || ''),
    ]
    if (urls.length === 0) return
    e.preventDefault()
    setForm((prev) => ({
      ...prev,
      mediaLinksText: mergeMediaLinkLines(prev.mediaLinksText, urls),
    }))
    showSuccess(urls.length === 1 ? 'Enlace de media añadido' : `${urls.length} enlaces de media añadidos`)
  }

  const previewBody = resolveFormLinks(form.body, referenceForms)
    .split('{{gimnasio}}').join('[Nombre del Gym]')
    .split('{{nombre}}').join('Ana')

  const mediaPreviewUrls = form.mediaLinksText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^https?:\/\//i.test(l))

  const handleDeleteTemplate = async (id: number) => {
    if (!window.confirm('¿Eliminar esta plantilla?')) return
    try {
      await api.deleteBroadcastTemplate(channel, id)
      showSuccess('Plantilla eliminada')
      loadTemplates()
    } catch (err) {
      showApiError(err, 'No se pudo eliminar la plantilla')
    }
  }

  const handleSendCloudText = async () => {
    if (!testTo.trim() || !testBody.trim()) {
      showApiError(new Error('Indica destinatario y texto'), 'Faltan datos')
      return
    }
    setTestSending(true)
    setLastMessageId(null)
    try {
      const result = await api.sendWhatsAppCloudText({
        to: testTo.trim(),
        body: testBody.trim(),
        previewUrl: true,
      })
      setLastMessageId(result.messageId)
      showSuccess(result.messageId ? `Texto enviado (${result.messageId})` : 'Texto enviado')
    } catch (err) {
      showApiError(err, 'No se pudo enviar el texto')
    } finally {
      setTestSending(false)
    }
  }

  const handleSendCloudDocument = async () => {
    if (!testTo.trim()) {
      showApiError(new Error('Indica el destinatario'), 'Falta el destinatario')
      return
    }
    const hasUrl = Boolean(testDocumentUrl.trim())
    const hasFile = Boolean(testFile)
    if (!hasUrl && !hasFile) {
      showApiError(new Error('Indica una URL de documento o elige un archivo'), 'Falta el documento')
      return
    }
    setTestSending(true)
    setLastMessageId(null)
    try {
      let fileBase64: string | null = null
      let filename: string | null = null
      let mimeType: string | null = null
      if (testFile) {
        const parsed = await readFileAsBase64(testFile)
        fileBase64 = parsed.base64
        filename = parsed.filename
        mimeType = parsed.mimeType
      }
      const result = await api.sendWhatsAppCloudDocument({
        to: testTo.trim(),
        documentUrl: hasUrl ? testDocumentUrl.trim() : null,
        fileBase64,
        filename,
        mimeType,
        caption: testCaption.trim() || null,
      })
      setLastMessageId(result.messageId)
      showSuccess(result.messageId ? `Documento enviado (${result.messageId})` : 'Documento enviado')
    } catch (err) {
      showApiError(err, 'No se pudo enviar el documento')
    } finally {
      setTestSending(false)
    }
  }

  return (
    <div className="admin-section broadcast-config-section">
      {!fixedChannel && (
        <div className="broadcast-channel-tabs">
          {CHANNEL_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={channel === tab.id ? 'btn-primary' : 'btn-secondary'}
              onClick={() => setChannel(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {channel === 'WHATSAPP' && isWame && (
        <div className="broadcast-channel-panel">
          <section className="card broadcast-settings-card">
            <div className="broadcast-settings-card-head">
              <div>
                <h2>WhatsApp (wa.me)</h2>
                <p className="text-muted">
                  Configura el número del gimnasio para abrir WhatsApp Web / app con el mensaje listo.
                </p>
              </div>
              <div className="broadcast-settings-card-badges">
                {settings?.enabled && (
                  <span className="badge badge-confirmed">Activo</span>
                )}
                {settings?.whatsappWebSessionConfirmed && (
                  <span className="badge badge-active">WhatsApp Web listo</span>
                )}
              </div>
            </div>

            {settingsLoading ? (
              <p className="text-muted">Cargando configuración…</p>
            ) : (
              <form className="broadcast-settings-form" onSubmit={handleSaveSettings}>
                <div className="form-group">
                  <label htmlFor="broadcast-whatsapp-phone">Número de WhatsApp</label>
                  <input
                    id="broadcast-whatsapp-phone"
                    type="tel"
                    placeholder="+50688887777"
                    value={senderPhone}
                    onChange={(e) => {
                      setSenderPhone(e.target.value)
                      markSettingsDirty()
                    }}
                    autoComplete="tel"
                  />
                  <p className="form-hint">
                    Formato internacional. Debe coincidir con la sesión de WhatsApp Web.
                  </p>
                </div>

                <div className="form-group form-group--switch">
                  <HorizontalSwitch
                    label="Envíos por WhatsApp"
                    offLabel="Desactivado"
                    onLabel="Activado"
                    checked={enabled}
                    onChange={handleEnabledChange}
                  />
                </div>

                {enabled && (
                  <div className="broadcast-wa-flow card">
                    <h3>Flujo de envío (wa.me)</h3>
                    <ol className="broadcast-wa-web-steps">
                      <li>WhatsApp Web o la app de Windows debe estar con sesión iniciada en este equipo.</li>
                      <li>Al crear o reenviar un formulario se abre WhatsApp con el mensaje y el enlace listos.</li>
                      <li>Revisas el mensaje y pulsas <strong>Enviar</strong> en WhatsApp.</li>
                    </ol>
                  </div>
                )}

                <div className="broadcast-settings-actions">
                  {autoSaveStatus === 'saving' && (
                    <span className="text-muted" style={{ marginRight: '0.75rem' }}>Guardando…</span>
                  )}
                  {autoSaveStatus === 'saved' && !settingsDirty && (
                    <span className="text-muted" style={{ marginRight: '0.75rem' }}>Guardado</span>
                  )}
                  <button type="submit" className="btn-primary" disabled={settingsSaving}>
                    {settingsSaving ? 'Guardando…' : 'Guardar ahora'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {channel === 'WHATSAPP' && isTemplates && (
        <div className="broadcast-channel-panel">
          <section className="broadcast-templates-section">
            <div className="admin-list-toolbar">
              <div>
                <h2>Plantillas de mensaje</h2>
                <p className="text-muted">
                  Textos reutilizables para avisos, recordatorios, confirmaciones y mensajes de bienvenida.
                  Se pueden usar con WhatsApp wa.me o Cloud según el canal activo.
                </p>
              </div>
              <button type="button" className="btn-primary" onClick={openCreateTemplate}>
                Nueva plantilla
              </button>
            </div>

            {filterInput}

            {templatesLoading ? (
              <p className="text-muted">Cargando plantillas…</p>
            ) : templates.length === 0 ? (
              <div className="empty-state card">
                Aún no hay plantillas. Crea la primera para usarla en otras secciones del sistema.
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state card">Ningún resultado coincide con la búsqueda</div>
            ) : (
              <div className="grid grid-2 broadcast-template-grid">
                {filtered.map((template) => (
                  <div key={template.id} className="card card-selectable broadcast-template-card">
                    <div className="broadcast-template-card-head">
                      <h3>{template.name}</h3>
                      <div className="broadcast-template-badges">
                        <span className="badge badge-trial">WhatsApp</span>
                        <span className={`badge ${template.purpose === 'WELCOME' ? 'badge-recurring' : 'badge-active'}`}>
                          {PURPOSE_LABELS[template.purpose ?? 'GENERAL']}
                        </span>
                        {template.membershipPackageName && (
                          <span className="badge badge-active">{template.membershipPackageName}</span>
                        )}
                      </div>
                    </div>
                    <WhatsAppMessagePreview
                      text={template.body}
                      mediaUrls={template.mediaLinks ?? []}
                      className="broadcast-template-preview"
                      clamp
                    />
                    <div className="broadcast-template-actions">
                      <button type="button" className="btn-secondary" onClick={() => openEditTemplate(template)}>
                        Editar
                      </button>
                      <button type="button" className="btn-secondary btn-danger-outline" onClick={() => handleDeleteTemplate(template.id)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {channel === 'WHATSAPP' && isCloud && (
        <div className="broadcast-channel-panel">
          <section className="card broadcast-settings-card">
            <div className="broadcast-settings-card-head">
              <div>
                <h2>WhatsApp Cloud API</h2>
                <p className="text-muted">
                  Credenciales de Meta. Los secretos se cifran en el navegador antes de enviarse al servidor
                  y se guardan cifrados; nunca se muestran de nuevo en claro.
                </p>
              </div>
              <div className="broadcast-settings-card-badges">
                {settings?.enabled && (
                  <span className="badge badge-confirmed">Activo</span>
                )}
                {settings?.cloudApiReady && (
                  <span className="badge badge-active">Cloud API lista</span>
                )}
              </div>
            </div>

            {settingsLoading ? (
              <p className="text-muted">Cargando configuración…</p>
            ) : (
              <form className="broadcast-settings-form" onSubmit={handleSaveSettings}>
                <div className="broadcast-cloud-api card">
                  <h3>Credenciales Meta Cloud API</h3>
                  <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                    Nombres alineados con variables de entorno / Postman de Meta.
                  </p>

                  <div className="form-group">
                    <label htmlFor="cloud-graph-version">Version</label>
                    <input
                      id="cloud-graph-version"
                      value={cloudApiGraphVersion}
                      onChange={(e) => {
                        setCloudApiGraphVersion(e.target.value)
                        markSettingsDirty()
                      }}
                      placeholder="v25.0"
                      autoComplete="off"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cloud-waba-id">WABA-ID</label>
                    <input
                      id="cloud-waba-id"
                      value={cloudApiWabaId}
                      onChange={(e) => {
                        setCloudApiWabaId(e.target.value)
                        markSettingsDirty()
                      }}
                      placeholder="3106195989577645"
                      autoComplete="off"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cloud-phone-number-id">Phone-Number-ID</label>
                    <input
                      id="cloud-phone-number-id"
                      value={cloudApiPhoneNumberId}
                      onChange={(e) => {
                        setCloudApiPhoneNumberId(e.target.value)
                        markSettingsDirty()
                      }}
                      placeholder="1224970924032254"
                      required={enabled}
                      autoComplete="off"
                    />
                    <p className="form-hint">
                      App Dashboard → WhatsApp → API setup. Va en la URL{' '}
                      <code>/PHONE_NUMBER_ID/messages</code>.
                    </p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="cloud-app-id">App ID</label>
                    <input
                      id="cloud-app-id"
                      value={cloudApiAppId}
                      onChange={(e) => {
                        setCloudApiAppId(e.target.value)
                        markSettingsDirty()
                      }}
                      placeholder="Desde App Dashboard → Settings → Basic"
                      autoComplete="off"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cloud-access-token">
                      User-Access-Token
                      {settings?.cloudApiAccessTokenConfigured && !clearAccessToken && (
                        <span className="badge badge-active" style={{ marginLeft: '0.5rem' }}>Guardado</span>
                      )}
                    </label>
                    <input
                      id="cloud-access-token"
                      type="password"
                      value={accessTokenInput}
                      onChange={(e) => {
                        setAccessTokenInput(e.target.value)
                        setClearAccessToken(false)
                      }}
                      placeholder={
                        settings?.cloudApiAccessTokenConfigured && !clearAccessToken
                          ? '••••••••  (deja vacío para no cambiar)'
                          : 'EAAJ… token de system user'
                      }
                      autoComplete="new-password"
                    />
                    {settings?.cloudApiAccessTokenConfigured && (
                      <label className="form-hint" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={clearAccessToken}
                          onChange={(e) => {
                            setClearAccessToken(e.target.checked)
                            if (e.target.checked) setAccessTokenInput('')
                          }}
                        />
                        Borrar token guardado
                      </label>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="cloud-app-secret">
                      App Secret
                      {settings?.cloudApiAppSecretConfigured && !clearAppSecret && (
                        <span className="badge badge-active" style={{ marginLeft: '0.5rem' }}>Guardado</span>
                      )}
                    </label>
                    <input
                      id="cloud-app-secret"
                      type="password"
                      value={appSecretInput}
                      onChange={(e) => {
                        setAppSecretInput(e.target.value)
                        setClearAppSecret(false)
                      }}
                      placeholder={
                        settings?.cloudApiAppSecretConfigured && !clearAppSecret
                          ? '••••••••  (deja vacío para no cambiar)'
                          : 'Opcional — verificar firmas de webhook'
                      }
                      autoComplete="new-password"
                    />
                    {settings?.cloudApiAppSecretConfigured && (
                      <label className="form-hint" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={clearAppSecret}
                          onChange={(e) => {
                            setClearAppSecret(e.target.checked)
                            if (e.target.checked) setAppSecretInput('')
                          }}
                        />
                        Borrar App Secret guardado
                      </label>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="cloud-verify-token">
                      Verify Token
                      {settings?.cloudApiVerifyTokenConfigured && !clearVerifyToken && (
                        <span className="badge badge-active" style={{ marginLeft: '0.5rem' }}>Guardado</span>
                      )}
                    </label>
                    <input
                      id="cloud-verify-token"
                      type="password"
                      value={verifyTokenInput}
                      onChange={(e) => {
                        setVerifyTokenInput(e.target.value)
                        setClearVerifyToken(false)
                      }}
                      placeholder={
                        settings?.cloudApiVerifyTokenConfigured && !clearVerifyToken
                          ? '••••••••  (deja vacío para no cambiar)'
                          : 'Opcional — passphrase del handshake GET'
                      }
                      autoComplete="new-password"
                    />
                    {settings?.cloudApiVerifyTokenConfigured && (
                      <label className="form-hint" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={clearVerifyToken}
                          onChange={(e) => {
                            setClearVerifyToken(e.target.checked)
                            if (e.target.checked) setVerifyTokenInput('')
                          }}
                        />
                        Borrar verify token guardado
                      </label>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="broadcast-cloud-display-phone">Número mostrado (opcional)</label>
                    <input
                      id="broadcast-cloud-display-phone"
                      type="tel"
                      placeholder="+50688887777"
                      value={senderPhone}
                      onChange={(e) => {
                        setSenderPhone(e.target.value)
                        markSettingsDirty()
                      }}
                      autoComplete="tel"
                    />
                    <p className="form-hint">Solo referencia visual; el envío usa Phone-Number-ID.</p>
                  </div>

                  <div className="broadcast-cloud-docs-stack">
                    <details
                      className="broadcast-cloud-docs"
                      open={docsOpen}
                      onToggle={(e) => setDocsOpen((e.target as HTMLDetailsElement).open)}
                    >
                      <summary>Documentación Cloud API (resumen)</summary>
                      <ul className="broadcast-wa-web-steps" style={{ listStyle: 'disc' }}>
                        <li>
                          Envía texto/media vía Graph{' '}
                          <code>POST /{'{Phone-Number-ID}'}/messages</code>.
                        </li>
                        <li>
                          Token de System User con permisos de mensajería; se cifra al guardar.
                        </li>
                        <li>
                          Fuera de la ventana de 24 h hace falta plantilla aprobada por Meta.
                        </li>
                      </ul>
                      <p className="form-hint">
                        <a
                          href="https://developers.facebook.com/documentation/business-messaging/whatsapp/about-the-platform"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          WhatsApp Business Platform
                        </a>
                        {' · '}
                        <a
                          href="https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Get started
                        </a>
                        {' · '}
                        <a
                          href="https://www.postman.com/meta/whatsapp-business-platform/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Postman
                        </a>
                      </p>
                    </details>
                  </div>
                </div>

                <div className="form-group form-group--switch">
                  <HorizontalSwitch
                    label="Envíos por Cloud API"
                    offLabel="Desactivado"
                    onLabel="Activado"
                    checked={enabled}
                    onChange={handleEnabledChange}
                  />
                </div>

                {enabled && (
                  <div className="broadcast-wa-flow card">
                    <h3>Flujo Cloud API</h3>
                    <ol className="broadcast-wa-web-steps">
                      <li>El backend llama a <code>graph.facebook.com/…/PHONE_NUMBER_ID/messages</code>.</li>
                      <li>Puede enviar texto (con preview de links), imágenes y documentos.</li>
                      <li>Authorization: <code>Bearer</code> + User-Access-Token (almacenado cifrado).</li>
                    </ol>
                  </div>
                )}

                <div className="broadcast-settings-actions">
                  {autoSaveStatus === 'saving' && (
                    <span className="text-muted" style={{ marginRight: '0.75rem' }}>Guardando…</span>
                  )}
                  {autoSaveStatus === 'saved' && !settingsDirty && (
                    <span className="text-muted" style={{ marginRight: '0.75rem' }}>Guardado</span>
                  )}
                  <button type="submit" className="btn-primary" disabled={settingsSaving}>
                    {settingsSaving ? 'Guardando…' : 'Guardar ahora'}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="card broadcast-settings-card">
            <div className="broadcast-settings-card-head">
              <div>
                <h2>Probar envío</h2>
                <p className="text-muted">
                  Envía un mensaje de prueba con las credenciales guardadas. El destinatario debe estar
                  permitido en Meta (número de prueba o ventana de 24 h).
                </p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="cloud-test-to">Destinatario</label>
              <input
                id="cloud-test-to"
                type="tel"
                placeholder="50688887777"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label htmlFor="cloud-test-body">Texto</label>
              <textarea
                id="cloud-test-body"
                rows={3}
                value={testBody}
                onChange={(e) => setTestBody(e.target.value)}
                placeholder="Hola, mensaje de prueba…"
              />
              <div className="broadcast-settings-actions" style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={testSending}
                  onClick={() => void handleSendCloudText()}
                >
                  {testSending ? 'Enviando…' : 'Enviar texto'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="cloud-test-doc-url">Document URL (opcional)</label>
              <input
                id="cloud-test-doc-url"
                type="url"
                value={testDocumentUrl}
                onChange={(e) => setTestDocumentUrl(e.target.value)}
                placeholder="https://…"
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label htmlFor="cloud-test-file">O archivo local</label>
              <input
                id="cloud-test-file"
                type="file"
                onChange={(e) => setTestFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cloud-test-caption">Caption (opcional)</label>
              <input
                id="cloud-test-caption"
                value={testCaption}
                onChange={(e) => setTestCaption(e.target.value)}
                placeholder="Descripción del documento"
                autoComplete="off"
              />
            </div>

            <div className="broadcast-settings-actions">
              <button
                type="button"
                className="btn-secondary"
                disabled={testSending}
                onClick={() => void handleSendCloudDocument()}
              >
                {testSending ? 'Enviando…' : 'Enviar documento'}
              </button>
            </div>

            {lastMessageId && (
              <p className="form-hint" style={{ marginTop: '0.75rem' }}>
                messageId: <code>{lastMessageId}</code>
              </p>
            )}
          </section>
        </div>
      )}

      {isTemplates && (
        <AdminFormModal
          title={selectedId != null ? 'Editar plantilla' : 'Nueva plantilla'}
          open={modalOpen}
          onClose={closeModal}
          onSubmit={handleTemplateSubmit}
          saving={templateSaving}
          submitLabel={selectedId != null ? 'Guardar cambios' : 'Crear plantilla'}
          intro={(
            <p className="text-muted modal-subtitle">
              Escribe <code>{'{{'}</code> para ver variables sugeridas ({'{{nombre}}'}, {'{{gimnasio}}'}, formularios).
              Los links <code>https://…</code> llegan azules a WhatsApp; imágenes/archivos van como adjuntos (Cloud) o links con vista previa (wa.me).
            </p>
          )}
        >
          <div className="form-group">
            <label htmlFor="template-purpose">Tipo de plantilla</label>
            <select
              id="template-purpose"
              value={form.purpose}
              onChange={(e) => setForm((prev) => ({
                ...prev,
                purpose: e.target.value as BroadcastTemplatePurpose,
              }))}
            >
              <option value="GENERAL">General — avisos y recordatorios</option>
              <option value="WELCOME">Bienvenida — al crear usuarios</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="template-package">Membresía (opcional)</label>
            <select
              id="template-package"
              value={form.membershipPackageId}
              onChange={(e) => setForm((prev) => ({
                ...prev,
                membershipPackageId: e.target.value,
              }))}
            >
              <option value="">Sin membresía asociada</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
              ))}
            </select>
            <p className="form-hint">
              Útil para mensajes de bienvenida por plan (Básica, Regular, Premium…).
            </p>
          </div>
          <div className="form-group">
            <label htmlFor="template-name">Nombre de la plantilla</label>
            <input
              id="template-name"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Recordatorio de clase"
              required
              maxLength={120}
            />
          </div>
          <div className="form-group">
            <label htmlFor="template-body">Mensaje</label>
            {referenceForms.length > 0 && (
              <div className="broadcast-form-link-picker">
                <label htmlFor="template-form-link" className="broadcast-form-link-picker-label">
                  Insertar enlace de formulario
                </label>
                <div className="broadcast-form-link-picker-row">
                  <select
                    id="template-form-link"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        insertFormLink(e.target.value)
                        e.target.value = ''
                      }
                    }}
                  >
                    <option value="" disabled>Seleccionar formulario…</option>
                    {referenceForms.map((item) => (
                      <option key={item.id} value={item.slug}>{item.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div className="broadcast-emoji-toolbar" role="group" aria-label="Insertar emoji">
              {BROADCAST_EMOJI_PICKER.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="broadcast-emoji-btn"
                  title={`Insertar ${emoji}`}
                  onClick={() => insertEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="broadcast-body-editor">
              <textarea
                ref={bodyTextareaRef}
                id="template-body"
                className="broadcast-template-body-input"
                value={form.body}
                onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                onPaste={handleBodyPaste}
                placeholder={'Pega aquí el mensaje de ChatGPT (con emojis). Ejemplo:\n\n💪🎉 ¡Bienvenido(a) a **{{gimnasio}}**!\n\nHola {{nombre}}…'}
                rows={10}
                required
                maxLength={4096}
                spellCheck
              />
              <WhatsAppVariableAutocomplete
                textareaRef={bodyTextareaRef}
                value={form.body}
                suggestions={variableSuggestions}
                onInsert={insertVariableToken}
              />
            </div>
            <p className="form-hint">
              Escribe <code>{'{{'}</code> para autocompletar. Los emojis y el texto se conservan.
              Enlaces web → azules en WhatsApp. Imágenes/PDF → campo de adjuntos (URL pública).
            </p>
            {(form.body.trim() || mediaPreviewUrls.length > 0) && (
              <div className="broadcast-wa-live-preview">
                <span className="broadcast-wa-live-preview-label">Vista previa (como en WhatsApp)</span>
                <WhatsAppMessagePreview text={previewBody} mediaUrls={mediaPreviewUrls} />
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="template-media-links">Imágenes y archivos (como adjuntos)</label>
            <textarea
              id="template-media-links"
              className="broadcast-template-body-input"
              value={form.mediaLinksText}
              onChange={(e) => setForm((prev) => ({ ...prev, mediaLinksText: e.target.value }))}
              onPaste={handleMediaPaste}
              placeholder={'Pega URLs públicas…\nhttps://ejemplo.com/bienvenida.jpg\nhttps://ejemplo.com/guia.pdf'}
              rows={3}
            />
            <p className="form-hint">
              Una URL por línea. Con Cloud API se envían como imagen/documento. Con wa.me aparecen como link azul (WhatsApp puede mostrar vista previa).
            </p>
          </div>
        </AdminFormModal>
      )}

      {isWame && (
        <AdminFormModal
          title="Activar envíos por WhatsApp"
          open={waWebModalOpen}
          onClose={closeWaWebModal}
          onSubmit={handleWaWebConfirm}
          saving={settingsSaving}
          submitLabel="Activar envíos por WhatsApp"
          submitDisabled={!waWebConfirmed}
          intro={(
            <p className="text-muted modal-subtitle">
              Activa el envío por <strong>wa.me</strong>: el sistema abrirá WhatsApp con el mensaje listo.
              Necesitas sesión activa en WhatsApp Web o la app de Windows en esta computadora,
              con el mismo número que configuraste ({senderPhone.trim() || 'sin configurar'}).
            </p>
          )}
        >
          <ol className="broadcast-wa-web-steps">
            <li>
              Abre{' '}
              <a href="https://web.whatsapp.com" target="_blank" rel="noopener noreferrer">
                web.whatsapp.com
              </a>{' '}
              en otra pestaña.
            </li>
            <li>Inicia sesión escaneando el código QR con tu teléfono, si aún no lo has hecho.</li>
            <li>
              Verifica que el número del campo de arriba ({senderPhone.trim() || 'sin configurar'}) sea el mismo
              que ves en WhatsApp Web → menú ⋮ → perfil.
            </li>
            <li>Deja WhatsApp Web abierto mientras usas el panel del gimnasio.</li>
            <li>Confirma abajo cuando la sesión esté lista y el número coincida.</li>
          </ol>
          <div className="form-group form-group--switch">
            <HorizontalSwitch
              label="Confirmo que WhatsApp Web está abierto y con sesión iniciada en este equipo"
              offLabel="No"
              onLabel="Sí"
              checked={waWebConfirmed}
              onChange={setWaWebConfirmed}
            />
          </div>
        </AdminFormModal>
      )}
    </div>
  )
}

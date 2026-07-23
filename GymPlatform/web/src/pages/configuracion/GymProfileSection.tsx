import { useEffect, useState, type CSSProperties } from 'react'
import { api } from '../../api'
import { useOrgBrand } from '../../orgBrand'
import {
  ACCENT_OPTIONS,
  type AccentId,
  usePreferences,
} from '../../preferences'
import { useToast } from '../../toast'

function isAccentId(value: string): value is AccentId {
  return ACCENT_OPTIONS.some((o) => o.id === value)
}

export default function GymProfileSection() {
  const { language } = usePreferences()
  const { organization, setOrganizationLocal } = useOrgBrand()
  const { showSuccess, showApiError, showInfo } = useToast()

  const [accessReady, setAccessReady] = useState(false)
  const [privateAccessConfigured, setPrivateAccessConfigured] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [unlocking, setUnlocking] = useState(false)

  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [businessHours, setBusinessHours] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [socialHandle, setSocialHandle] = useState('')
  const [accentId, setAccentId] = useState<AccentId>('indigo')

  useEffect(() => {
    setPassword('')
    setUnlocked(false)
    setAccessReady(false)
    let cancelled = false
    void (async () => {
      try {
        const access = await api.getStatisticsAccess()
        if (!cancelled) setPrivateAccessConfigured(access.configured)
      } catch {
        if (!cancelled) setPrivateAccessConfigured(false)
      } finally {
        if (!cancelled) setAccessReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!organization) return
    setName(organization.name ?? '')
    setTagline(organization.tagline ?? '')
    setContactPhone(organization.contactPhone ?? '')
    setContactEmail(organization.contactEmail ?? '')
    setAddress(organization.address ?? '')
    setCity(organization.city ?? '')
    setBusinessHours(organization.businessHours ?? '')
    setWebsiteUrl(organization.websiteUrl ?? '')
    setSocialHandle(organization.socialHandle ?? '')
    setAccentId(isAccentId(organization.accentId) ? organization.accentId : 'indigo')
  }, [organization])

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    const privatePassword = password.trim()
    if (!privatePassword) {
      showInfo('Ingresa la contraseña de áreas privadas')
      return
    }
    setUnlocking(true)
    try {
      await api.verifyPrivateAreasPassword(privatePassword)
      setUnlocked(true)
      showSuccess('Perfil desbloqueado')
    } catch (err) {
      showApiError(
        err,
        privateAccessConfigured
          ? 'Contraseña de áreas privadas incorrecta'
          : 'Primero define la contraseña en Configuración → Áreas privadas',
      )
    } finally {
      setUnlocking(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showInfo('El nombre del gimnasio es obligatorio')
      return
    }
    const privatePassword = password.trim()
    if (!privatePassword) {
      showInfo('Ingresa la contraseña de áreas privadas para guardar')
      return
    }
    setSaving(true)
    try {
      const saved = await api.updateMyOrganization({
        currentPassword: privatePassword,
        name: name.trim(),
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        tagline: tagline.trim() || null,
        businessHours: businessHours.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        socialHandle: socialHandle.trim() || null,
        accentId,
      })
      setOrganizationLocal(saved)
      showSuccess('Perfil del gimnasio actualizado')
    } catch (err) {
      showApiError(err, 'No se pudo guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  if (!accessReady) {
    return <p className="text-muted">Verificando acceso…</p>
  }

  if (!unlocked) {
    return (
      <form className="card" style={{ maxWidth: 420 }} onSubmit={(e) => void handleUnlock(e)}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          {privateAccessConfigured
            ? 'Usa la misma contraseña que definiste en Configuración → Áreas privadas. No es la contraseña con la que inicias sesión.'
            : 'Primero ve a Configuración → Áreas privadas y guarda una contraseña. Luego úsala aquí.'}
        </p>
        <div className="form-group">
          <label htmlFor="gym-profile-private-password">Contraseña de áreas privadas</label>
          <div className="statistics-access-password-row">
            <input
              id="gym-profile-private-password"
              name="private-areas-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              data-lpignore="true"
              data-1p-ignore="true"
              required
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={unlocking || !privateAccessConfigured}>
          {unlocking ? 'Verificando…' : 'Desbloquear'}
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={(e) => void handleSave(e)} style={{ maxWidth: 560 }}>
      <div className="form-group">
        <label htmlFor="gym-name">Nombre</label>
        <input id="gym-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="form-group">
        <label htmlFor="gym-tagline">Eslogan</label>
        <input id="gym-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Entrena con propósito" />
      </div>
      <div className="form-group">
        <label htmlFor="gym-phone">Teléfono</label>
        <input id="gym-phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="gym-email">Email de contacto</label>
        <input id="gym-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="gym-address">Dirección</label>
        <input id="gym-address" value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="gym-city">Ciudad / zona</label>
        <input id="gym-city" value={city} onChange={(e) => setCity(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="gym-hours">Horario de atención</label>
        <input id="gym-hours" value={businessHours} onChange={(e) => setBusinessHours(e.target.value)} placeholder="Lun–Sáb 5:00–22:00" />
      </div>
      <div className="form-group">
        <label htmlFor="gym-web">Sitio web</label>
        <input id="gym-web" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://" />
      </div>
      <div className="form-group">
        <label htmlFor="gym-social">Instagram / red social</label>
        <input id="gym-social" value={socialHandle} onChange={(e) => setSocialHandle(e.target.value)} placeholder="@gymplatform" />
      </div>

      <div className="form-group">
        <label>Color de la app</label>
        <p className="form-hint" style={{ marginBottom: '0.75rem' }}>
          Este color lo verán todos los usuarios del gimnasio.
        </p>
        <div className="settings-panel-options settings-panel-options--accents" role="radiogroup">
          {ACCENT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={accentId === option.id}
              className={`settings-panel-option settings-panel-option--accent${accentId === option.id ? ' active' : ''}`}
              style={{ '--swatch-color': option.swatch } as CSSProperties}
              onClick={() => setAccentId(option.id)}
            >
              <span className="settings-panel-accent-swatch" aria-hidden />
              <span className="settings-panel-option-label">{option.label[language]}</span>
              {accentId === option.id && <span className="settings-panel-option-check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="gym-save-password">Contraseña de áreas privadas (confirmar guardado)</label>
        <input
          id="gym-save-password"
          name="private-areas-password-confirm"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          data-lpignore="true"
          data-1p-ignore="true"
          required
        />
      </div>

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Guardando…' : 'Guardar cambios'}
      </button>
    </form>
  )
}

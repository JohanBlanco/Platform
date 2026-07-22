import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../../api'
import { useToast } from '../../toast'

/** Contraseña del administrador para áreas privadas (estadísticas hoy; otras secciones después). */
export default function PrivateAccessSection() {
  const { showApiError, showSuccess } = useToast()
  const [configured, setConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [changing, setChanging] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getStatisticsAccess()
      setConfigured(data.configured)
    } catch (err) {
      showApiError(err, 'No se pudo cargar la contraseña de áreas privadas')
    } finally {
      setLoading(false)
    }
  }, [showApiError])

  useEffect(() => {
    void load()
  }, [load])

  const handleSet = async (e: FormEvent) => {
    e.preventDefault()
    if (password.trim().length < 4) {
      showApiError(new Error('Mínimo 4 caracteres'), 'Contraseña muy corta')
      return
    }
    setSaving(true)
    try {
      await api.setStatisticsAccess(password.trim())
      setPassword('')
      setShowPassword(false)
      setConfigured(true)
      showSuccess('Contraseña de áreas privadas guardada')
    } catch (err) {
      showApiError(err, 'No se pudo guardar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = async (e: FormEvent) => {
    e.preventDefault()
    if (newPassword.trim().length < 4) {
      showApiError(new Error('Mínimo 4 caracteres'), 'Contraseña nueva muy corta')
      return
    }
    setSaving(true)
    try {
      await api.changeStatisticsAccess(currentPassword, newPassword.trim())
      setChanging(false)
      setCurrentPassword('')
      setNewPassword('')
      showSuccess('Contraseña de áreas privadas actualizada')
    } catch (err) {
      showApiError(err, 'No se pudo cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-muted">Cargando…</p>
  }

  return (
    <div className="card statistics-access-card">
      <p className="form-hint" style={{ marginTop: 0 }}>
        Esta contraseña protege secciones sensibles del gimnasio (por ejemplo Estadísticas).
        Podrás usarla después para ocultar otras áreas. Solo el administrador la define o cambia;
        una vez guardada no se muestra en claro.
      </p>

      {configured && !changing ? (
        <div className="statistics-access-configured">
          <div className="statistics-access-badge-row">
            <span className="badge badge-active">Configurada</span>
            <input
              type="password"
              value="••••••••"
              disabled
              readOnly
              aria-label="Contraseña de áreas privadas (oculta)"
              className="statistics-access-locked-input"
            />
          </div>
          <button type="button" className="btn-secondary" onClick={() => setChanging(true)}>
            Cambiar contraseña
          </button>
        </div>
      ) : null}

      {!configured ? (
        <form onSubmit={handleSet} className="statistics-access-form">
          <div className="form-group">
            <label htmlFor="private-access-password">Nueva contraseña</label>
            <div className="statistics-access-password-row">
              <input
                id="private-access-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={4}
                required
                placeholder="Mínimo 4 caracteres"
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar contraseña'}
          </button>
        </form>
      ) : null}

      {configured && changing ? (
        <form onSubmit={handleChange} className="statistics-access-form">
          <div className="form-group">
            <label htmlFor="private-current-password">Contraseña actual</label>
            <div className="statistics-access-password-row">
              <input
                id="private-current-password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowCurrent((v) => !v)}
              >
                {showCurrent ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="private-new-password">Contraseña nueva</label>
            <div className="statistics-access-password-row">
              <input
                id="private-new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={4}
                required
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowNew((v) => !v)}
              >
                {showNew ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>
          <div className="statistics-access-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Actualizar'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={saving}
              onClick={() => {
                setChanging(false)
                setCurrentPassword('')
                setNewPassword('')
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}

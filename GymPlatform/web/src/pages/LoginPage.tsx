import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth'
import { useToast } from '../toast'
import { formatNationalIdInput } from '../utils/nationalId'
import { PLATFORM_OFFICIAL_URL } from '../constants/platform'

export default function LoginPage() {
  const { login } = useAuth()
  const { showApiError, showInfo } = useToast()
  const [searchParams] = useSearchParams()
  const sessionExpired = searchParams.get('expired') === '1'

  const loginRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionExpired) {
      showInfo('Tu sesión expiró. Vuelve a iniciar sesión.')
    }
  }, [sessionExpired, showInfo])

  const handleLoginInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError(null)
    const { value } = e.target
    // Email: no formatear. Cédula: solo dígitos.
    if (/[a-zA-Z@]/.test(value)) return
    const formatted = formatNationalIdInput(value)
    if (formatted !== value) {
      e.target.value = formatted
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmedLogin = (loginRef.current?.value ?? '').trim()
    const pwd = passwordRef.current?.value ?? ''

    if (!trimmedLogin || !pwd) {
      const message = 'Ingresa correo o cédula y contraseña'
      setValidationError(message)
      showInfo(message)
      return
    }

    setValidationError(null)
    setLoading(true)
    try {
      await login(trimmedLogin, pwd)
    } catch (err) {
      showApiError(err, 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <h1>GymPlatform</h1>
        <p className="subtitle">Administración del gimnasio</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-identifier">Correo o cédula</label>
            <input
              ref={loginRef}
              id="login-identifier"
              type="text"
              name="login"
              onChange={handleLoginInput}
              placeholder="tu@email.com o 190205678"
              autoComplete="username"
              aria-invalid={validationError ? true : undefined}
              aria-describedby={validationError ? 'login-validation-error' : undefined}
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Contraseña</label>
            <div className="password-input-wrap">
              <input
                ref={passwordRef}
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                autoComplete="current-password"
                onChange={() => setValidationError(null)}
                aria-invalid={validationError ? true : undefined}
                aria-describedby={validationError ? 'login-validation-error' : undefined}
              />
              <button
                type="button"
                className="password-input-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M3 3l18 18M10.58 10.58A2 2 0 0 0 12 15a2 2 0 0 0 1.42-.58M9.88 5.09A10.94 10.94 0 0 1 12 5c5 0 9.27 3.11 11 7.5a11.8 11.8 0 0 1-2.16 3.19M6.61 6.61A11.8 11.8 0 0 0 1 12.5C2.73 16.89 7 20 12 20a10.9 10.9 0 0 0 4.12-.79"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M2 12.5C3.73 8.11 8 5 13 5s9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S3.73 16.89 2 12.5Z"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="13" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.75" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {validationError && (
            <p id="login-validation-error" className="form-hint form-hint--warn" role="alert">
              {validationError}
            </p>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="login-platform-link">
          Parte de{' '}
          <a href={PLATFORM_OFFICIAL_URL} target="_blank" rel="noopener noreferrer">
            Platform
          </a>
        </p>
      </div>
    </div>
  )
}

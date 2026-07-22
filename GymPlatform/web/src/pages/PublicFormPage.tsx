import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import FormFieldRenderer from './configuracion/forms/FormFieldRenderer'
import { isFieldVisible } from './configuracion/forms/formFieldUtils'
import { FORM_ACCESS_LABELS } from './configuracion/forms/formBuilderConstants'
import type { FormField, PublicForm } from '../types'

export default function PublicFormPage() {
  const { organizationSlug = '', formSlug = '' } = useParams()
  const [searchParams] = useSearchParams()
  const memberUserId = useMemo(() => {
    const raw = searchParams.get('m')
    if (!raw) return undefined
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : undefined
  }, [searchParams])

  const navigate = useNavigate()
  const { user } = useAuth()
  const [form, setForm] = useState<PublicForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const returnUrl = useMemo(
    () => `/f/${organizationSlug}/${formSlug}`,
    [organizationSlug, formSlug],
  )

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.getPublicForm(organizationSlug, formSlug)
      .then(setForm)
      .catch((err: Error) => setError(err.message || 'No se pudo cargar el formulario'))
      .finally(() => setLoading(false))
  }, [organizationSlug, formSlug])

  const visibleFields = useMemo(
    () => form?.fields.filter((field) => isFieldVisible(field, answers)) ?? [],
    [form, answers],
  )

  const inputFields = visibleFields.filter((field) => field.type !== 'HEADING')

  const handleChange = (field: FormField, value: string | boolean) => {
    setAnswers((prev) => ({ ...prev, [field.id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return

    if (form.createsUser && (form.membershipPackages?.length ?? 0) === 0) {
      setError('Este gimnasio aún no tiene planes de membresía activos. Contacta al administrador.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const payload: Record<string, string | boolean> = {}
      for (const field of inputFields) {
        if (!isFieldVisible(field, answers)) continue
        const value = answers[field.id]
        if (value !== undefined) {
          payload[field.id] = value
        }
      }
      const result = form.accessType === 'PUBLIC'
        ? await api.submitPublicForm(organizationSlug, formSlug, payload, memberUserId)
        : await api.submitAuthenticatedForm(form.id, payload)

      setSuccessMessage(
        result.message
          ?? (result.userCreated
            ? 'Cuenta creada correctamente. Ya puedes iniciar sesión.'
            : 'Tus respuestas fueron enviadas correctamente.'),
      )
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el formulario')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="public-form-page">
        <div className="public-form-shell card">
          <p className="text-muted">Cargando formulario…</p>
        </div>
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="public-form-page">
        <div className="public-form-shell card">
          <h1>Formulario no disponible</h1>
          <p className="text-muted">{error}</p>
        </div>
      </div>
    )
  }

  if (!form) return null

  if (form.requiresAuth && !user) {
    return (
      <div className="public-form-page">
        <div className="public-form-shell card">
          <p className="public-form-org">{form.organizationName}</p>
          <h1>{form.title}</h1>
          {form.description && <p className="text-muted">{form.description}</p>}
          <div className="public-form-auth-gate">
            <span className="badge badge-trial">{FORM_ACCESS_LABELS.AUTHENTICATED}</span>
            <p>Este formulario solo puede completarse con una cuenta del gimnasio.</p>
            <Link
              className="btn-primary"
              to={`/login?return=${encodeURIComponent(returnUrl)}`}
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="public-form-page">
        <div className="public-form-shell card public-form-success">
          <h1>¡Listo!</h1>
          <p>{successMessage ?? 'Tus respuestas fueron enviadas correctamente.'}</p>
          {form.createsUser ? (
            <Link className="btn-primary" to="/login">
              Ir a iniciar sesión
            </Link>
          ) : user ? (
            <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
              Volver al inicio
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="public-form-page">
      <form className="public-form-shell card" onSubmit={handleSubmit}>
        <p className="public-form-org">{form.organizationName}</p>
        <h1>{form.title}</h1>
        {form.description && <p className="text-muted public-form-description">{form.description}</p>}
        {form.createsUser && (
          <p className="form-hint" style={{ marginBottom: '1rem' }}>
            Al enviar se creará tu cuenta de miembro automáticamente.
          </p>
        )}
        <div className="public-form-fields">
          {visibleFields.map((field) => (
            <FormFieldRenderer
              key={field.id}
              field={field}
              value={answers[field.id]}
              onChange={(value) => handleChange(field, value)}
              enforceRequired
            />
          ))}
        </div>
        {error && <p className="public-form-error">{error}</p>}
        <div className="public-form-actions">
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || inputFields.length === 0}
          >
            {submitting
              ? 'Enviando…'
              : form.createsUser
                ? 'Crear cuenta y enviar'
                : 'Enviar respuestas'}
          </button>
        </div>
      </form>
    </div>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { api } from '../../api'
import FormPublicShare from '../../components/FormPublicShare'
import { useFilteredList } from '../../hooks/useFilteredList'
import { useToast } from '../../toast'
import FormBuilder from './forms/FormBuilder'
import {
  FORM_ACCESS_LABELS,
  type CustomFormPayload,
} from './forms/formBuilderConstants'
import type { CustomForm, FormFolder } from '../../types'
import { FORM_PURPOSE_LABELS } from '../../types'

const emptyPayload = (): CustomFormPayload => ({
  title: '',
  slug: '',
  description: '',
  accessType: 'PUBLIC',
  active: true,
  fields: [],
  templateFolderId: null,
  responseFolderId: null,
})

export default function FormCreatorPanel() {
  const { showSuccess, showApiError } = useToast()
  const [forms, setForms] = useState<CustomForm[]>([])
  const [templateFolders, setTemplateFolders] = useState<FormFolder[]>([])
  const [responseFolders, setResponseFolders] = useState<FormFolder[]>([])
  const [selectedTemplateFolderId, setSelectedTemplateFolderId] = useState<number | null | 'all' | 'none'>('all')
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'list' | 'builder'>('list')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingSystemDefault, setEditingSystemDefault] = useState(false)
  const [builderInitial, setBuilderInitial] = useState<CustomFormPayload>(emptyPayload())
  const [saving, setSaving] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const loadFolders = useCallback(async () => {
    try {
      const [templates, responses] = await Promise.all([
        api.getFormFolders('TEMPLATE'),
        api.getFormFolders('RESPONSE'),
      ])
      setTemplateFolders(templates)
      setResponseFolders(responses)
    } catch {
      setTemplateFolders([])
      setResponseFolders([])
    }
  }, [])

  const loadForms = useCallback(async () => {
    setLoading(true)
    try {
      const folderParam = selectedTemplateFolderId === 'all'
        ? undefined
        : selectedTemplateFolderId === 'none'
          ? -1
          : selectedTemplateFolderId
      const data = await api.getForms(folderParam)
      setForms(data)
    } catch (err) {
      showApiError(err, 'No se pudieron cargar los formularios')
      setForms([])
    } finally {
      setLoading(false)
    }
  }, [selectedTemplateFolderId, showApiError])

  useEffect(() => { loadFolders() }, [loadFolders])
  useEffect(() => { loadForms() }, [loadForms])

  const { filtered, filterInput } = useFilteredList(forms, useCallback(
    (form: CustomForm) => [
      FORM_ACCESS_LABELS[form.accessType],
      form.slug,
      form.publicUrl,
      form.templateFolderName ?? '',
      form.responseFolderName ?? '',
    ],
    [],
  ))

  const openCreate = () => {
    setEditingId(null)
    setEditingSystemDefault(false)
    setBuilderInitial({
      ...emptyPayload(),
      templateFolderId: selectedTemplateFolderId !== 'all' && selectedTemplateFolderId !== 'none'
        ? selectedTemplateFolderId
        : null,
    })
    setMode('builder')
  }

  const openEdit = (form: CustomForm) => {
    setEditingId(form.id)
    setEditingSystemDefault(form.systemDefault)
    setBuilderInitial({
      title: form.title,
      slug: form.slug,
      description: form.description,
      accessType: form.accessType,
      active: form.active,
      fields: form.fields,
      templateFolderId: form.templateFolderId,
      responseFolderId: form.responseFolderId,
    })
    setMode('builder')
  }

  const closeBuilder = () => {
    setMode('list')
    setEditingId(null)
    setEditingSystemDefault(false)
    setBuilderInitial(emptyPayload())
    loadForms()
    loadFolders()
  }

  const handleSave = async (payload: CustomFormPayload) => {
    setSaving(true)
    try {
      if (editingId != null) {
        await api.updateForm(editingId, payload)
        showSuccess('Formulario actualizado')
      } else {
        await api.createForm(payload)
        showSuccess('Formulario creado')
      }
      closeBuilder()
    } catch (err) {
      showApiError(err, 'No se pudo guardar el formulario')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este formulario?')) return
    try {
      await api.deleteForm(id)
      showSuccess('Formulario eliminado')
      loadForms()
      loadFolders()
    } catch (err) {
      showApiError(err, 'No se pudo eliminar el formulario')
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await api.createFormFolder('TEMPLATE', newFolderName.trim())
      setNewFolderName('')
      loadFolders()
      showSuccess('Carpeta creada')
    } catch (err) {
      showApiError(err, 'No se pudo crear la carpeta')
    }
  }

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      showSuccess('Enlace copiado')
    } catch {
      showApiError(new Error('No se pudo copiar'), 'No se pudo copiar el enlace')
    }
  }

  if (mode === 'builder') {
    return (
      <FormBuilder
        initial={builderInitial}
        saving={saving}
        lockSlug={editingSystemDefault}
        templateFolders={templateFolders}
        responseFolders={responseFolders}
        onSave={handleSave}
        onCancel={closeBuilder}
      />
    )
  }

  return (
    <div className="forms-creator-layout">
      <aside className="forms-folder-sidebar card">
        <h3>Carpetas</h3>
        <div className="forms-folder-list">
          <button
            type="button"
            className={`forms-folder-item${selectedTemplateFolderId === 'all' ? ' active' : ''}`}
            onClick={() => setSelectedTemplateFolderId('all')}
          >
            Todos los formularios
          </button>
          <button
            type="button"
            className={`forms-folder-item${selectedTemplateFolderId === 'none' ? ' active' : ''}`}
            onClick={() => setSelectedTemplateFolderId('none')}
          >
            Sin carpeta
          </button>
          {templateFolders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              className={`forms-folder-item${selectedTemplateFolderId === folder.id ? ' active' : ''}`}
              onClick={() => setSelectedTemplateFolderId(folder.id)}
            >
              {folder.name}
              <span className="forms-folder-count">{folder.formCount}</span>
            </button>
          ))}
        </div>
        <div className="forms-folder-create">
          <input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nueva carpeta…"
          />
          <button type="button" className="btn-secondary" onClick={handleCreateFolder}>+</button>
        </div>
      </aside>

      <div className="forms-creator-main admin-section">
        <div className="admin-list-toolbar">
          <div>{filterInput}</div>
          <button type="button" className="btn-primary" onClick={openCreate}>
            Nuevo formulario
          </button>
        </div>

        {loading ? (
          <p className="text-muted">Cargando formularios…</p>
        ) : forms.length === 0 ? (
          <div className="empty-state card">No hay formularios en esta carpeta.</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state card">Ningún resultado coincide con la búsqueda</div>
        ) : (
          <div className="grid grid-2 forms-grid">
            {filtered.map((form) => (
              <div key={form.id} className="card forms-card">
                <div className="forms-card-head">
                  <div>
                    <h3>{form.title}</h3>
                    <p className="text-muted forms-card-slug">/{form.slug}</p>
                  </div>
                  <div className="forms-card-badges">
                    {form.systemDefault && (
                      <span className="badge badge-trial">Sistema</span>
                    )}
                    <span className="badge badge-active">
                      {FORM_PURPOSE_LABELS[form.formPurpose] ?? form.formPurpose}
                    </span>
                    <span className={`badge ${form.accessType === 'PUBLIC' ? 'badge-confirmed' : 'badge-trial'}`}>
                      {FORM_ACCESS_LABELS[form.accessType]}
                    </span>
                    <span className={`badge ${form.active ? 'badge-active' : 'badge-cancelled'}`}>
                      {form.active ? 'Activo' : 'Borrador'}
                    </span>
                  </div>
                </div>
                {form.templateFolderName && (
                  <p className="text-muted forms-card-meta">Carpeta: {form.templateFolderName}</p>
                )}
                {!!form.description?.trim() && (
                  <p className="forms-card-description" title={form.description.trim()}>
                    {form.description}
                  </p>
                )}
                <p className="text-muted forms-card-meta">
                  Respuestas: {form.responseFolderName ?? 'Automática'} · {form.submissionCount} envío{form.submissionCount === 1 ? '' : 's'}
                </p>
                {form.accessType === 'PUBLIC' && form.active && (
                  <FormPublicShare
                    url={form.publicUrl}
                    title={form.title}
                    slug={form.slug}
                    compact
                  />
                )}
                <div className="forms-card-actions">
                  <button type="button" className="btn-secondary" onClick={() => openEdit(form)}>Editar</button>
                  <button type="button" className="btn-secondary" onClick={() => copyLink(form.publicUrl)}>Copiar enlace</button>
                  {!form.systemDefault && (
                    <button type="button" className="btn-secondary btn-danger-outline" onClick={() => handleDelete(form.id)}>Eliminar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

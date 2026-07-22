import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useState } from 'react'
import { api } from '../../../api'
import HorizontalSwitch from '../../../components/HorizontalSwitch'
import { useToast } from '../../../toast'
import FormFieldRenderer from './FormFieldRenderer'
import {
  FORM_ACCESS_LABELS,
  FORM_FIELD_PALETTE,
  createFormField,
  type CustomFormPayload,
} from './formBuilderConstants'
import {
  conditionSourceFields,
  conditionValueOptions,
} from './formFieldUtils'
import type { FormAccessType, FormField, FormFieldType, FormFolder } from '../../../types'

type Props = {
  initial: CustomFormPayload
  saving: boolean
  lockSlug?: boolean
  templateFolders: FormFolder[]
  responseFolders: FormFolder[]
  onSave: (payload: CustomFormPayload) => Promise<void>
  onCancel: () => void
}

function SortableCanvasField({
  field,
  selected,
  onSelect,
  onRemove,
}: {
  field: FormField
  selected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`form-builder-canvas-item${selected ? ' selected' : ''}${isDragging ? ' dragging' : ''}`}
      onClick={onSelect}
    >
      <div className="form-builder-canvas-item-toolbar">
        <button
          type="button"
          className="form-builder-drag-handle"
          aria-label="Reordenar campo"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <span className="form-builder-field-type">
          {FORM_FIELD_PALETTE.find((item) => item.type === field.type)?.label ?? field.type}
        </span>
        {field.visibilityFieldId && (
          <span className="form-builder-conditional-badge">Condicional</span>
        )}
        <button
          type="button"
          className="btn-secondary btn-danger-outline form-builder-remove-btn"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          Eliminar
        </button>
      </div>
      <FormFieldRenderer field={field} preview />
    </div>
  )
}

function PaletteItem({
  type,
  label,
  description,
  icon,
  onAdd,
}: {
  type: FormFieldType
  label: string
  description: string
  icon: string
  onAdd: (type: FormFieldType) => void
}) {
  const dragId = `palette-${type}`
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: dragId })

  return (
    <div
      ref={setNodeRef}
      className={`form-builder-palette-item${isDragging ? ' dragging' : ''}`}
    >
      <button
        type="button"
        className="form-builder-palette-drag"
        aria-label={`Arrastrar ${label}`}
        {...attributes}
        {...listeners}
      >
        ⋮⋮
      </button>
      <button
        type="button"
        className="form-builder-palette-add"
        onClick={() => onAdd(type)}
      >
        <span className="form-builder-palette-icon" aria-hidden>{icon}</span>
        <span>
          <strong>{label}</strong>
          <small>{description}</small>
        </span>
      </button>
    </div>
  )
}

function CanvasAppendZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-append' })
  return (
    <div
      ref={setNodeRef}
      className={`form-builder-append-zone${isOver ? ' over' : ''}`}
    >
      <span className="form-builder-append-zone-icon">+</span>
      <span>Arrastra aquí para agregar otro campo</span>
      <small>O haz clic en un tipo de campo a la izquierda</small>
    </div>
  )
}

function EmptyCanvasDropzone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-empty' })
  return (
    <div
      ref={setNodeRef}
      className={`form-builder-dropzone${isOver ? ' over' : ''}`}
    >
      <p>Arrastra un campo aquí para empezar</p>
      <p className="text-muted">También puedes hacer clic en un campo del panel izquierdo.</p>
    </div>
  )
}

export default function FormBuilder({
  initial,
  saving,
  lockSlug = false,
  templateFolders,
  responseFolders,
  onSave,
  onCancel,
}: Props) {
  const { showSuccess, showApiError } = useToast()
  const [title, setTitle] = useState(initial.title)
  const [slug, setSlug] = useState(initial.slug ?? '')
  const [description, setDescription] = useState(initial.description ?? '')
  const [accessType, setAccessType] = useState<FormAccessType>(initial.accessType)
  const [active, setActive] = useState(initial.active)
  const [templateFolderId, setTemplateFolderId] = useState<number | ''>(initial.templateFolderId ?? '')
  const [responseFolderId, setResponseFolderId] = useState<number | ''>(initial.responseFolderId ?? '')
  const [newResponseFolderName, setNewResponseFolderName] = useState('')
  const [localResponseFolders, setLocalResponseFolders] = useState(responseFolders)
  const [fields, setFields] = useState<FormField[]>(initial.fields)
  const [selectedId, setSelectedId] = useState<string | null>(fields[0]?.id ?? null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const selectedField = fields.find((field) => field.id === selectedId) ?? null
  const conditionSources = useMemo(
    () => (selectedField ? conditionSourceFields(fields, selectedField.id) : []),
    [fields, selectedField],
  )
  const selectedConditionSource = conditionSources.find(
    (field) => field.id === selectedField?.visibilityFieldId,
  )
  const activeDragField = useMemo(
    () => fields.find((field) => field.id === activeDragId) ?? null,
    [activeDragId, fields],
  )
  const activePaletteItem = useMemo(
    () => (activeDragId?.startsWith('palette-')
      ? FORM_FIELD_PALETTE.find((item) => `palette-${item.type}` === activeDragId)
      : null),
    [activeDragId],
  )

  const updateField = (id: string, patch: Partial<FormField>) => {
    setFields((prev) => prev.map((field) => (field.id === id ? { ...field, ...patch } : field)))
  }

  const addField = (type: FormFieldType, index = fields.length) => {
    const next = createFormField(type)
    setFields((prev) => {
      const copy = [...prev]
      copy.splice(index, 0, next)
      return copy
    })
    setSelectedId(next.id)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (activeId.startsWith('palette-')) {
      const type = activeId.replace('palette-', '') as FormFieldType
      if (overId === 'canvas-append' || overId === 'canvas-empty') {
        addField(type)
        return
      }
      const overIndex = fields.findIndex((field) => field.id === overId)
      addField(type, overIndex >= 0 ? overIndex : fields.length)
      return
    }

    if (activeId !== overId) {
      setFields((prev) => {
        const oldIndex = prev.findIndex((field) => field.id === activeId)
        const newIndex = prev.findIndex((field) => field.id === overId)
        if (oldIndex < 0 || newIndex < 0) return prev
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  const handleSave = async () => {
    await onSave({
      title: title.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || null,
      accessType,
      active,
      fields,
      templateFolderId: templateFolderId === '' ? null : Number(templateFolderId),
      responseFolderId: responseFolderId === '' ? null : Number(responseFolderId),
    })
  }

  const canSave = title.trim().length > 0 && fields.length > 0
  const sharedResponseFolders = localResponseFolders.filter((folder) => !folder.autoGenerated)

  const handleCreateResponseFolder = async () => {
    if (!newResponseFolderName.trim()) return
    try {
      const folder = await api.createFormFolder('RESPONSE', newResponseFolderName.trim())
      setLocalResponseFolders((prev) => [...prev, folder])
      setResponseFolderId(folder.id)
      setNewResponseFolderName('')
      showSuccess('Carpeta de respuestas creada')
    } catch (err) {
      showApiError(err, 'No se pudo crear la carpeta')
    }
  }

  return (
    <div className="form-builder">
      <div className="form-builder-header card">
        <div className="form-builder-header-main">
          <button type="button" className="btn-secondary" onClick={onCancel}>← Volver</button>
          <div className="form-builder-header-fields">
            <input
              className="form-builder-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre del formulario"
              maxLength={160}
            />
            <input
              className="form-builder-slug-input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="slug-opcional"
              maxLength={120}
              readOnly={lockSlug}
              title={lockSlug ? 'El slug del formulario de registro no se puede cambiar' : undefined}
            />
          </div>
        </div>
        <div className="form-builder-header-actions">
          <div className="form-builder-access-toggle" role="radiogroup" aria-label="Acceso al formulario">
            {(['PUBLIC', 'AUTHENTICATED'] as FormAccessType[]).map((type) => (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={accessType === type}
                className={`form-builder-access-pill${accessType === type ? ' active' : ''}`}
                onClick={() => setAccessType(type)}
              >
                {FORM_ACCESS_LABELS[type]}
              </button>
            ))}
          </div>
          <HorizontalSwitch
            label="Publicado"
            offLabel="Borrador"
            onLabel="Activo"
            checked={active}
            onChange={setActive}
          />
          <button type="button" className="btn-primary" disabled={!canSave || saving} onClick={handleSave}>
            {saving ? 'Guardando…' : 'Guardar formulario'}
          </button>
        </div>
        <textarea
          className="form-builder-description-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción opcional visible al abrir el formulario"
          rows={2}
          maxLength={500}
        />
        <div className="form-builder-folder-row">
          <div className="form-group">
            <label htmlFor="form-template-folder">Carpeta de diseño</label>
            <select
              id="form-template-folder"
              value={templateFolderId}
              onChange={(e) => setTemplateFolderId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Sin carpeta</option>
              {templateFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="form-response-folder">Carpeta de respuestas</label>
            <select
              id="form-response-folder"
              value={responseFolderId}
              onChange={(e) => setResponseFolderId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Automática (una por formulario)</option>
              {sharedResponseFolders.map((folder) => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
            <div className="forms-folder-create">
              <input
                value={newResponseFolderName}
                onChange={(e) => setNewResponseFolderName(e.target.value)}
                placeholder="Nueva carpeta compartida…"
              />
              <button type="button" className="btn-secondary" onClick={handleCreateResponseFolder}>+</button>
            </div>
            <p className="form-hint">
              Si eliges automática, se creará «{title.trim() || 'Formulario'} — Respuestas» al guardar.
            </p>
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="form-builder-workspace">
          <aside className="form-builder-palette card">
            <h2>Campos</h2>
            <p className="form-builder-palette-hint">Clic en el campo para agregarlo al final. Usa ⋮⋮ para arrastrar.</p>
            <div className="form-builder-palette-list">
              {FORM_FIELD_PALETTE.map((item) => (
                <PaletteItem
                  key={item.type}
                  type={item.type}
                  label={item.label}
                  description={item.description}
                  icon={item.icon}
                  onAdd={addField}
                />
              ))}
            </div>
          </aside>

          <section className="form-builder-canvas card">
            <div className="form-builder-canvas-head">
              <h2>Lienzo</h2>
              <p className="text-muted">{fields.length} campo{fields.length === 1 ? '' : 's'}</p>
            </div>
            {fields.length === 0 ? (
              <EmptyCanvasDropzone />
            ) : (
              <SortableContext items={fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
                <div className="form-builder-canvas-list">
                  {fields.map((field) => (
                    <SortableCanvasField
                      key={field.id}
                      field={field}
                      selected={selectedId === field.id}
                      onSelect={() => setSelectedId(field.id)}
                      onRemove={() => {
                        setFields((prev) => prev.filter((item) => item.id !== field.id))
                        if (selectedId === field.id) setSelectedId(null)
                      }}
                    />
                  ))}
                  <CanvasAppendZone />
                </div>
              </SortableContext>
            )}
          </section>

          <aside className="form-builder-properties card">
            <h2>Propiedades</h2>
            {!selectedField ? (
              <p className="text-muted">Selecciona un campo del lienzo para editarlo.</p>
            ) : (
              <div className="form-builder-properties-form">
                <div className="form-group">
                  <label htmlFor="field-label">Etiqueta</label>
                  <input
                    id="field-label"
                    value={selectedField.label}
                    onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                  />
                </div>
                {selectedField.type !== 'HEADING' && selectedField.type !== 'CHECKBOX' && (
                  <div className="form-group">
                    <label htmlFor="field-placeholder">Placeholder</label>
                    <input
                      id="field-placeholder"
                      value={selectedField.placeholder ?? ''}
                      onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                    />
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="field-help">Texto de ayuda</label>
                  <input
                    id="field-help"
                    value={selectedField.helpText ?? ''}
                    onChange={(e) => updateField(selectedField.id, { helpText: e.target.value })}
                  />
                </div>
                {selectedField.type !== 'HEADING' && (
                  <div className="form-group form-group--switch">
                    <HorizontalSwitch
                      label="Obligatorio"
                      offLabel="No"
                      onLabel="Sí"
                      checked={selectedField.required}
                      onChange={(checked) => updateField(selectedField.id, { required: checked })}
                    />
                  </div>
                )}
                {(selectedField.type === 'SELECT' || selectedField.type === 'RADIO') && (
                  <div className="form-group">
                    <label htmlFor="field-options">Opciones (una por línea)</label>
                    <textarea
                      id="field-options"
                      rows={5}
                      value={selectedField.options.join('\n')}
                      onChange={(e) => updateField(selectedField.id, {
                        options: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean),
                      })}
                    />
                  </div>
                )}
                {conditionSources.length > 0 && (
                  <>
                    <div className="form-builder-properties-divider">Visibilidad condicional</div>
                    <div className="form-group">
                      <label htmlFor="field-visibility-source">Mostrar solo cuando</label>
                      <select
                        id="field-visibility-source"
                        value={selectedField.visibilityFieldId ?? ''}
                        onChange={(e) => updateField(selectedField.id, {
                          visibilityFieldId: e.target.value || null,
                          visibilityValue: null,
                        })}
                      >
                        <option value="">Siempre visible</option>
                        {conditionSources.map((source) => (
                          <option key={source.id} value={source.id}>{source.label}</option>
                        ))}
                      </select>
                    </div>
                    {selectedField.visibilityFieldId && (
                      <div className="form-group">
                        <label htmlFor="field-visibility-value">Tenga el valor</label>
                        <select
                          id="field-visibility-value"
                          value={selectedField.visibilityValue ?? ''}
                          onChange={(e) => updateField(selectedField.id, {
                            visibilityValue: e.target.value || null,
                          })}
                        >
                          <option value="" disabled>Seleccionar valor…</option>
                          {conditionValueOptions(selectedConditionSource).map((option) => (
                            <option key={option} value={option}>
                              {selectedConditionSource?.type === 'CHECKBOX'
                                ? (option === 'true' ? 'Marcado' : 'No marcado')
                                : option}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </aside>
        </div>

        <DragOverlay>
          {activeDragField ? (
            <div className="form-builder-canvas-item dragging overlay">
              <FormFieldRenderer field={activeDragField} preview />
            </div>
          ) : activePaletteItem ? (
            <div className="form-builder-palette-item dragging overlay">
              <span className="form-builder-palette-icon" aria-hidden>{activePaletteItem.icon}</span>
              <span>
                <strong>{activePaletteItem.label}</strong>
                <small>{activePaletteItem.description}</small>
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

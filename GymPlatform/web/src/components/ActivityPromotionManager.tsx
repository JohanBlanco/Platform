import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'
import { useToast } from '../toast'
import type { Activity, ActivityPromotion } from '../types'

type Draft = {
  activityId: number | ''
  imageUrl: string
}

export default function ActivityPromotionManager() {
  const { showApiError, showSuccess, showWarning } = useToast()
  const [slots, setSlots] = useState<ActivityPromotion[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSlot, setEditingSlot] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>({ activityId: '', imageUrl: '' })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [promotionSlots, series] = await Promise.all([
        api.getActivityPromotionSlots(),
        api.getActivitySeries(),
      ])
      setSlots(promotionSlots)
      setActivities(series.filter((activity) => activity.active))
    } catch (error) {
      showApiError(error, 'No se pudieron cargar las promociones')
    } finally {
      setLoading(false)
    }
  }, [showApiError])

  useEffect(() => {
    void load()
  }, [load])

  const openEditor = (slot: ActivityPromotion) => {
    setEditingSlot(slot.slotIndex)
    setDraft({
      activityId: slot.activityId ?? '',
      imageUrl: slot.imageUrl ?? '',
    })
  }

  const uploadImage = async (file: File | null) => {
    if (!file) return
    setUploading(true)
    try {
      const result = await api.uploadMarketingMedia(file)
      setDraft((current) => ({ ...current, imageUrl: result.url }))
      showSuccess('Imagen subida')
    } catch (error) {
      showApiError(error, 'No se pudo subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  const save = async () => {
    if (editingSlot == null || draft.activityId === '') {
      showWarning('Selecciona la actividad que quieres destacar')
      return
    }
    setSaving(true)
    try {
      await api.saveActivityPromotion(editingSlot, {
        activityId: draft.activityId,
        imageUrl: draft.imageUrl.trim() || undefined,
      })
      showSuccess(`Promoción ${editingSlot} guardada`)
      setEditingSlot(null)
      await load()
    } catch (error) {
      showApiError(error, 'No se pudo guardar la promoción')
    } finally {
      setSaving(false)
    }
  }

  const clear = async (slot: ActivityPromotion) => {
    if (!window.confirm(`¿Vaciar el espacio promocional ${slot.slotIndex}?`)) return
    try {
      await api.clearActivityPromotion(slot.slotIndex)
      showSuccess('Espacio promocional disponible')
      await load()
    } catch (error) {
      showApiError(error, 'No se pudo quitar la promoción')
    }
  }

  return (
    <section className="activity-promo-admin" aria-labelledby="activity-promo-admin-title">
      <header className="activity-promo-admin-head">
        <div>
          <p className="activity-promo-admin-kicker">Carrusel del inicio del miembro</p>
          <h2 id="activity-promo-admin-title">Actividades promocionadas</h2>
          <p>
            Configura hasta 3 actividades. Solo aparecen en el inicio del miembro cuando hay al menos una
            con fecha próxima; si no hay ninguna, el carrusel no se muestra.
          </p>
        </div>
        <span className="activity-promo-admin-count">
          {slots.filter((slot) => slot.populated).length}/3 activas
        </span>
      </header>

      {loading ? (
        <p className="calendar-hint">Preparando espacios promocionales…</p>
      ) : (
        <div className="activity-promo-admin-grid">
          {slots.map((slot) => {
            const editing = editingSlot === slot.slotIndex
            return (
              <article
                key={slot.slotIndex}
                className={`activity-promo-admin-slot${slot.populated ? ' is-populated' : ''}${editing ? ' is-editing' : ''}`}
              >
                {!editing ? (
                  <>
                    <div className="activity-promo-admin-media">
                      {slot.imageUrl ? (
                        <img
                          src={slot.imageUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      ) : (
                        <span aria-hidden>{String(slot.slotIndex).padStart(2, '0')}</span>
                      )}
                    </div>
                    <div className="activity-promo-admin-copy">
                      <small>Espacio {slot.slotIndex}</small>
                      <h3>{slot.populated ? slot.name : 'Listo para destacar'}</h3>
                      <p>
                        {slot.populated
                          ? slot.description || 'Esta actividad aparecerá en el inicio del miembro.'
                          : 'Selecciona una actividad y una imagen que motive a reservar.'}
                      </p>
                    </div>
                    <div className="activity-promo-admin-actions">
                      <button
                        type="button"
                        className={slot.populated ? 'btn-secondary' : 'btn-primary'}
                        onClick={() => openEditor(slot)}
                      >
                        {slot.populated ? 'Editar' : 'Configurar'}
                      </button>
                      {slot.populated && (
                        <button type="button" className="btn-secondary" onClick={() => void clear(slot)}>
                          Vaciar
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="activity-promo-admin-editor">
                    <div className="form-group">
                      <label htmlFor={`promotion-activity-${slot.slotIndex}`}>Actividad</label>
                      <select
                        id={`promotion-activity-${slot.slotIndex}`}
                        value={draft.activityId}
                        onChange={(event) => {
                          setDraft((current) => ({
                            ...current,
                            activityId: event.target.value ? Number(event.target.value) : '',
                          }))
                        }}
                      >
                        <option value="">Seleccionar actividad…</option>
                        {activities.map((activity) => (
                          <option key={activity.id} value={activity.id}>
                            {activity.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`promotion-image-${slot.slotIndex}`}>Imagen</label>
                      <p className="activity-promo-size-hint">
                        Tamaño recomendado: <strong>1600 × 900 px</strong> (16:9). JPG, PNG o WEBP.
                        Se recorta al centro si la proporción es distinta.
                      </p>
                      <input
                        id={`promotion-image-${slot.slotIndex}`}
                        type="url"
                        value={draft.imageUrl}
                        onChange={(event) =>
                          setDraft((current) => ({ ...current, imageUrl: event.target.value }))
                        }
                        placeholder="https://… o sube un archivo abajo"
                      />
                    </div>

                    <div className="activity-promo-upload-row">
                      <label className="btn-secondary activity-promo-upload-btn">
                        {uploading ? 'Subiendo…' : 'Subir imagen'}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          hidden
                          disabled={uploading}
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null
                            event.target.value = ''
                            void uploadImage(file)
                          }}
                        />
                      </label>
                    </div>

                    <div className="activity-promo-preview-frame" aria-label="Vista previa de la imagen">
                      <div className="activity-promo-preview-frame-label">
                        Vista previa · así se verá en el carrusel
                      </div>
                      {draft.imageUrl ? (
                        <img
                          className="activity-promo-admin-preview"
                          src={draft.imageUrl}
                          alt="Vista previa de la promoción"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="activity-promo-preview-empty">
                          <span>Sin imagen</span>
                          <small>1600 × 900 px</small>
                        </div>
                      )}
                    </div>

                    <div className="activity-promo-admin-editor-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={saving}
                        onClick={() => setEditingSlot(null)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={saving || draft.activityId === ''}
                        onClick={() => void save()}
                      >
                        {saving ? 'Guardando…' : 'Guardar promoción'}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

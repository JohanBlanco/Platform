import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError } from '../../api'
import AdminFormModal from '../../components/AdminFormModal'
import MemberSearchSelect from '../../components/MemberSearchSelect'
import NutritionPlanDisplay from '../../components/NutritionPlanDisplay'
import { useToast } from '../../toast'
import type { NutritionPlan, User } from '../../types'
import {
  activePlan,
  emptyMeal,
  emptyNutritionForm,
  formToNutritionPayload,
  MEAL_PRESETS,
  planToForm,
  type NutritionPlanFormState,
} from '../../utils/nutritionPlan'

type FormTab = 'objective' | 'meals' | 'tips'

const FORM_TABS: { id: FormTab; label: string }[] = [
  { id: 'objective', label: 'Objetivo y macros' },
  { id: 'meals', label: 'Comidas' },
  { id: 'tips', label: 'Recomendaciones' },
]

export default function NutritionSection() {
  const { showSuccess, showApiError } = useToast()
  const [members, setMembers] = useState<User[]>([])
  const [activePlans, setActivePlans] = useState<NutritionPlan[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<number | ''>('')
  const [memberPlans, setMemberPlans] = useState<NutritionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [plansLoading, setPlansLoading] = useState(false)
  const [overviewLoading, setOverviewLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formTab, setFormTab] = useState<FormTab>('objective')
  const [form, setForm] = useState(emptyNutritionForm)
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    api.getUsers()
      .then((users) => setMembers(users.filter((u) => u.active && u.roles.includes('MEMBER'))))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false))
  }, [])

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true)
    try {
      const data = await api.getActiveNutritionPlans()
      setActivePlans(data)
    } catch (err) {
      showApiError(err, 'No se pudieron cargar los planes activos')
      setActivePlans([])
    } finally {
      setOverviewLoading(false)
    }
  }, [showApiError])

  const loadMemberPlans = useCallback(async (memberId: number) => {
    setPlansLoading(true)
    try {
      const data = await api.getMemberNutritionPlans(memberId)
      setMemberPlans(data)
      const current = data.find((p) => p.status === 'ACTIVE')
      if (current) setExpandedId(current.id)
    } catch (err) {
      showApiError(err, 'No se pudo cargar el historial')
      setMemberPlans([])
    } finally {
      setPlansLoading(false)
    }
  }, [showApiError])

  useEffect(() => {
    if (!loading) loadOverview()
  }, [loading, loadOverview])

  useEffect(() => {
    if (selectedMemberId) loadMemberPlans(selectedMemberId)
    else setMemberPlans([])
  }, [selectedMemberId, loadMemberPlans])

  const selectedMember = useMemo(
    () => members.find((m) => m.id === selectedMemberId),
    [members, selectedMemberId],
  )

  const currentActive = activePlan(memberPlans)

  const openCreate = () => {
    setEditingPlanId(null)
    setForm({
      ...emptyNutritionForm(),
      memberId: selectedMemberId,
      title: selectedMember ? `Plan nutricional — ${selectedMember.firstName}` : '',
    })
    setFormTab('objective')
    setShowForm(true)
  }

  const openEdit = (plan: NutritionPlan) => {
    setEditingPlanId(plan.id)
    setForm(planToForm(plan, plan.memberId))
    setFormTab('objective')
    setShowForm(true)
  }

  const submitPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = formToNutritionPayload(form)
    if (!payload) {
      showApiError(new ApiError('Completa miembro y título del plan', 400), 'Datos incompletos')
      return
    }
    setSaving(true)
    try {
      const saved = editingPlanId
        ? await api.updateNutritionPlan(editingPlanId, payload)
        : await api.createNutritionPlan(payload)
      showSuccess(editingPlanId ? 'Plan actualizado' : 'Plan creado y activado para el miembro')
      setShowForm(false)
      setSelectedMemberId(saved.memberId)
      await Promise.all([loadMemberPlans(saved.memberId), loadOverview()])
      setExpandedId(saved.id)
    } catch (err) {
      showApiError(err, 'No se pudo guardar el plan')
    } finally {
      setSaving(false)
    }
  }

  const archivePlan = async (planId: number) => {
    if (!window.confirm('¿Archivar este plan? El miembro ya no lo verá como activo.')) return
    try {
      await api.archiveNutritionPlan(planId)
      showSuccess('Plan archivado')
      if (selectedMemberId) await loadMemberPlans(selectedMemberId)
      await loadOverview()
    } catch (err) {
      showApiError(err, 'No se pudo archivar')
    }
  }

  const updateMeal = (index: number, patch: Partial<NutritionPlanFormState['meals'][0]>) => {
    setForm((f) => ({
      ...f,
      meals: f.meals.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    }))
  }

  if (loading) return <p>Cargando...</p>

  return (
    <>
      <div className="admin-list-toolbar measurement-toolbar">
        <MemberSearchSelect
          members={members}
          value={selectedMemberId}
          onChange={setSelectedMemberId}
          placeholder="Buscar miembro…"
        />
        <button type="button" className="btn-primary" disabled={!selectedMemberId} onClick={openCreate}>
          {currentActive ? 'Nuevo plan' : 'Crear plan'}
        </button>
      </div>

      {!selectedMemberId ? (
        <div className="measurement-overview">
          <div className="measurement-overview-intro card">
            <p>Selecciona un miembro o elige un plan activo para ver detalle, editar o crear uno nuevo.</p>
          </div>
          {overviewLoading ? (
            <p>Cargando planes activos…</p>
          ) : activePlans.length === 0 ? (
            <div className="empty-state card">
              <p>No hay planes nutricionales activos.</p>
              <p className="text-muted">Selecciona un miembro y crea su primer plan.</p>
            </div>
          ) : (
            <>
              <h3 className="measurement-overview-title">Planes activos ({activePlans.length})</h3>
              <div className="measurement-overview-grid">
                {activePlans.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    className="card measurement-overview-card nutrition-overview-card"
                    onClick={() => setSelectedMemberId(plan.memberId)}
                  >
                    <strong>{plan.memberName}</strong>
                    <span>{plan.title}</span>
                    {plan.dailyCaloriesTarget != null && (
                      <span className="text-muted">{plan.dailyCaloriesTarget} kcal · {plan.meals.length} comidas</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : plansLoading ? (
        <p>Cargando planes…</p>
      ) : (
        <>
          <button type="button" className="btn-link measurement-back-link" onClick={() => setSelectedMemberId('')}>
            ← Volver a todos los planes
          </button>

          {currentActive ? (
            <section className="card nutrition-active-plan">
              <div className="nutrition-plan-header">
                <div>
                  <p className="measurement-latest-label">Plan activo</p>
                  <h2>{currentActive.title}</h2>
                  <p className="text-muted">Por {currentActive.createdByName}</p>
                </div>
                <div className="nutrition-plan-actions">
                  <button type="button" className="btn-secondary" onClick={() => openEdit(currentActive)}>Editar</button>
                  <button type="button" className="btn-secondary" onClick={() => archivePlan(currentActive.id)}>Archivar</button>
                </div>
              </div>
              <NutritionPlanDisplay plan={currentActive} />
            </section>
          ) : (
            <div className="empty-state card">
              <p>{selectedMember?.firstName} no tiene un plan activo.</p>
              <button type="button" className="btn-primary" style={{ marginTop: '1rem' }} onClick={openCreate}>
                Crear plan nutricional
              </button>
            </div>
          )}

          {memberPlans.filter((p) => p.status === 'ARCHIVED').length > 0 && (
            <section className="nutrition-history-section">
              <h3>Historial archivado</h3>
              <div className="measurement-history">
                {memberPlans.filter((p) => p.status === 'ARCHIVED').map((plan) => (
                  <article key={plan.id} className="card measurement-history-item">
                    <button
                      type="button"
                      className="measurement-history-toggle"
                      onClick={() => setExpandedId(expandedId === plan.id ? null : plan.id)}
                    >
                      <div>
                        <strong>{plan.title}</strong>
                        <span className="text-muted"> · Archivado</span>
                      </div>
                      <span className="measurement-history-chevron">{expandedId === plan.id ? '▾' : '▸'}</span>
                    </button>
                    {expandedId === plan.id && <NutritionPlanDisplay plan={plan} compact />}
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <AdminFormModal
        title={editingPlanId ? 'Editar plan nutricional' : 'Nuevo plan nutricional'}
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={submitPlan}
        saving={saving}
        submitLabel={editingPlanId ? 'Guardar cambios' : 'Activar plan'}
        submitDisabled={!formToNutritionPayload(form)}
        intro={selectedMember && (
          <p className="text-muted measurement-form-intro">
            Plan para <strong>{selectedMember.firstName} {selectedMember.lastName}</strong>.
            Al crear uno nuevo, el plan activo anterior se archiva automáticamente.
          </p>
        )}
      >
        <div className="measurement-form-tabs" role="tablist">
          {FORM_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={formTab === tab.id}
              className={formTab === tab.id ? 'active' : ''}
              onClick={() => setFormTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {formTab === 'objective' && (
          <div className="nutrition-form-section">
            <label className="form-group">
              Título del plan *
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="Ej. Plan déficit — tonificación"
              />
            </label>
            <label className="form-group">
              Objetivo
              <textarea
                rows={2}
                value={form.objective}
                onChange={(e) => setForm({ ...form, objective: e.target.value })}
                placeholder="Meta principal del plan…"
              />
            </label>
            <div className="form-row grid-2">
              <label className="form-group">
                Calorías / día
                <input type="number" min="0" value={form.dailyCaloriesTarget} onChange={(e) => setForm({ ...form, dailyCaloriesTarget: e.target.value })} />
              </label>
              <label className="form-group">
                Agua (litros)
                <input type="number" min="0" step="0.1" value={form.waterLiters} onChange={(e) => setForm({ ...form, waterLiters: e.target.value })} />
              </label>
              <label className="form-group">
                Proteína (g)
                <input type="number" min="0" value={form.proteinGrams} onChange={(e) => setForm({ ...form, proteinGrams: e.target.value })} />
              </label>
              <label className="form-group">
                Carbohidratos (g)
                <input type="number" min="0" value={form.carbsGrams} onChange={(e) => setForm({ ...form, carbsGrams: e.target.value })} />
              </label>
              <label className="form-group">
                Grasas (g)
                <input type="number" min="0" value={form.fatGrams} onChange={(e) => setForm({ ...form, fatGrams: e.target.value })} />
              </label>
            </div>
          </div>
        )}

        {formTab === 'meals' && (
          <div className="nutrition-form-section">
            <p className="form-hint">Organiza las comidas del día. Puedes agregar alimentos con porciones aproximadas.</p>
            {form.meals.map((meal, mealIndex) => (
              <div key={mealIndex} className="nutrition-meal-form card">
                <div className="nutrition-meal-form-header">
                  <label className="form-group">
                    Comida
                    <input
                      list={`meal-presets-${mealIndex}`}
                      value={meal.name}
                      onChange={(e) => updateMeal(mealIndex, { name: e.target.value })}
                      placeholder="Desayuno, Almuerzo…"
                    />
                    <datalist id={`meal-presets-${mealIndex}`}>
                      {MEAL_PRESETS.map((p) => <option key={p} value={p} />)}
                    </datalist>
                  </label>
                  <label className="form-group">
                    Hora sugerida
                    <input
                      type="time"
                      value={meal.suggestedTime}
                      onChange={(e) => updateMeal(mealIndex, { suggestedTime: e.target.value })}
                    />
                  </label>
                  {form.meals.length > 1 && (
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => setForm((f) => ({ ...f, meals: f.meals.filter((_, i) => i !== mealIndex) }))}
                    >
                      Quitar
                    </button>
                  )}
                </div>
                {meal.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="nutrition-item-form grid-2">
                    <input
                      placeholder="Alimento"
                      value={item.foodName}
                      onChange={(e) => {
                        const items = [...meal.items]
                        items[itemIndex] = { ...items[itemIndex], foodName: e.target.value }
                        updateMeal(mealIndex, { items })
                      }}
                    />
                    <input
                      placeholder="Porción (ej. 150 g)"
                      value={item.portion}
                      onChange={(e) => {
                        const items = [...meal.items]
                        items[itemIndex] = { ...items[itemIndex], portion: e.target.value }
                        updateMeal(mealIndex, { items })
                      }}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-link"
                  onClick={() => updateMeal(mealIndex, { items: [...meal.items, { foodName: '', portion: '', notes: '' }] })}
                >
                  + Alimento
                </button>
              </div>
            ))}
            <button type="button" className="btn-secondary" onClick={() => setForm((f) => ({ ...f, meals: [...f.meals, emptyMeal()] }))}>
              + Comida
            </button>
          </div>
        )}

        {formTab === 'tips' && (
          <div className="nutrition-form-section">
            <label className="form-group">
              Recomendaciones generales (una por línea)
              <textarea
                rows={5}
                value={form.guidelinesText}
                onChange={(e) => setForm({ ...form, guidelinesText: e.target.value })}
                placeholder="Evita azúcares líquidos&#10;Prioriza proteína en cada comida"
              />
            </label>
            <label className="form-group">
              Notas para el miembro
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Observaciones visibles en la app del miembro…"
              />
            </label>
          </div>
        )}
      </AdminFormModal>
    </>
  )
}

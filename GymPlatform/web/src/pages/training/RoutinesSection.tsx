import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../../api'
import RoutineDisplay from '../../components/RoutineDisplay'
import UserSearchMultiSelect from '../../components/UserSearchMultiSelect'
import { useFilteredList } from '../../hooks/useFilteredList'
import type {
  CatalogExercise,
  MuscleGroup,
  Routine,
  RoutineDay,
  RoutineExercise,
  RoutineRequest,
  RoutineTemplate,
  RoutineValidityUnit,
  User,
} from '../../types'
import { CATALOG_MUSCLE_GROUPS, MUSCLE_GROUP_LABELS } from '../../types'
import {
  isRoutineRequestOpen,
} from '../../utils/routineRequest'
import RoutineRequestStatusBadge from '../../components/RoutineRequestStatusBadge'
import { useToast } from '../../toast'
import GenerateRoutineModal from './GenerateRoutineModal'
import type { GeneratedRoutinePlan } from '../../types'
import ExerciseGuideModal from '../../components/ExerciseGuideModal'
import { ExerciseMediaThumb } from '../../components/ExerciseMediaThumb'

type BuilderExercise = {
  exerciseId: number
  exerciseName: string
  imageUrl: string
  videoUrl?: string
  guideUrl?: string
  sets: number
  reps: number
  notes: string
  orderIndex: number
}

type BuilderDay = {
  dayNumber: number
  dayLabel: string
  exercises: BuilderExercise[]
}

const emptyBuilder = () => ({
  name: '',
  description: '',
  notes: '',
  goal: '',
  daysPerWeek: 3,
  validityAmount: 4,
  validityUnit: 'WEEKS' as RoutineValidityUnit,
  days: [] as BuilderDay[],
  activeDayIndex: 0,
})

type BuilderMode = 'routine' | 'template'

function templateAsRoutine(t: RoutineTemplate): Routine {
  return {
    id: t.id,
    name: t.name,
    description: t.description ?? '',
    notes: t.goal,
    memberId: 0,
    memberName: '',
    instructorId: t.instructorId,
    instructorName: 'Plantilla reutilizable',
    templateId: null,
    temporary: false,
    daysPerWeek: t.daysPerWeek,
    validFrom: null,
    validUntil: null,
    validityAmount: null,
    validityUnit: null,
    expired: false,
    days: t.days ?? [],
    exercises: t.exercises ?? [],
  }
}

function mapExerciseToBuilder(ex: RoutineExercise, orderIndex: number): BuilderExercise {
  return {
    exerciseId: ex.exerciseId ?? 0,
    exerciseName: ex.exerciseName,
    imageUrl: ex.imageUrl ?? '',
    videoUrl: undefined,
    guideUrl: undefined,
    sets: ex.sets ?? 3,
    reps: ex.reps ?? 12,
    notes: ex.notes ?? '',
    orderIndex,
  }
}

function buildFromTemplate(t: RoutineTemplate): ReturnType<typeof emptyBuilder> {
  if (t.days && t.days.length > 0) {
    return {
      ...emptyBuilder(),
      name: t.name,
      description: t.description ?? '',
      goal: t.goal ?? '',
      daysPerWeek: t.daysPerWeek ?? t.days.length,
      days: t.days.map((day: RoutineDay) => ({
        dayNumber: day.dayNumber,
        dayLabel: day.dayLabel,
        exercises: day.exercises.map((ex, i) => mapExerciseToBuilder(ex, i)),
      })),
      activeDayIndex: 0,
    }
  }

  const daysPerWeek = t.daysPerWeek ?? 3
  const days: BuilderDay[] = Array.from({ length: daysPerWeek }, (_, i) => ({
    dayNumber: i + 1,
    dayLabel: `Día ${i + 1}`,
    exercises: i === 0
      ? t.exercises.map((ex, j) => mapExerciseToBuilder(ex, j))
      : [],
  }))

  return {
    ...emptyBuilder(),
    name: t.name,
    description: t.description ?? '',
    goal: t.goal ?? '',
    daysPerWeek,
    days,
    activeDayIndex: 0,
  }
}

function buildFromRoutine(routine: Routine): ReturnType<typeof emptyBuilder> {
  if (routine.days && routine.days.length > 0) {
    return {
      ...emptyBuilder(),
      name: routine.name,
      description: routine.description ?? '',
      notes: routine.notes ?? '',
      daysPerWeek: routine.daysPerWeek ?? routine.days.length,
      validityAmount: routine.validityAmount ?? 4,
      validityUnit: routine.validityUnit ?? 'WEEKS',
      days: routine.days.map((day: RoutineDay) => ({
        dayNumber: day.dayNumber,
        dayLabel: day.dayLabel,
        exercises: day.exercises.map((ex, i) => mapExerciseToBuilder(ex, i)),
      })),
      activeDayIndex: 0,
    }
  }

  const daysPerWeek = routine.daysPerWeek ?? 3
  const days: BuilderDay[] = Array.from({ length: daysPerWeek }, (_, i) => ({
    dayNumber: i + 1,
    dayLabel: `Día ${i + 1}`,
    exercises: i === 0
      ? (routine.exercises ?? []).map((ex, j) => mapExerciseToBuilder(ex, j))
      : [],
  }))

  return {
    ...emptyBuilder(),
    name: routine.name,
    description: routine.description ?? '',
    notes: routine.notes ?? '',
    daysPerWeek,
    validityAmount: routine.validityAmount ?? 4,
    validityUnit: routine.validityUnit ?? 'WEEKS',
    days,
    activeDayIndex: 0,
  }
}

const serializeBuilderState = (
  builder: ReturnType<typeof emptyBuilder>,
  options: { manualMemberId: number | null; builderMode: BuilderMode; editingTemplateId: number | null },
) => JSON.stringify({
  name: builder.name,
  description: builder.description,
  notes: builder.notes,
  goal: builder.goal,
  daysPerWeek: builder.daysPerWeek,
  validityAmount: builder.validityAmount,
  validityUnit: builder.validityUnit,
  days: builder.days,
  manualMemberId: options.manualMemberId,
  builderMode: options.builderMode,
  editingTemplateId: options.editingTemplateId,
})

type AssignTemplateModalProps = {
  request: RoutineRequest
  templates: RoutineTemplate[]
  assigning: boolean
  onAssign: (templateId: number, validityAmount: number, validityUnit: RoutineValidityUnit) => void
  onClose: () => void
}

function AssignTemplateModal({
  request,
  templates,
  assigning,
  onAssign,
  onClose,
}: AssignTemplateModalProps) {
  const { filtered, filterInput } = useFilteredList(templates)
  const [validityAmount, setValidityAmount] = useState(4)
  const [validityUnit, setValidityUnit] = useState<RoutineValidityUnit>('WEEKS')

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="card modal-card"
        role="dialog"
        aria-labelledby="assign-routine-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="assign-routine-title">
          Asignar rutina a {request.memberName}
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Elige una plantilla para asignar al miembro y completar la solicitud.
        </p>
        <div className="form-row" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Vigencia</label>
            <input
              type="number"
              min={1}
              value={validityAmount}
              onChange={(e) => setValidityAmount(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label>Unidad</label>
            <select
              value={validityUnit}
              onChange={(e) => setValidityUnit(e.target.value as RoutineValidityUnit)}
            >
              <option value="DAYS">Días</option>
              <option value="WEEKS">Semanas</option>
              <option value="MONTHS">Meses</option>
            </select>
          </div>
        </div>
        {templates.length === 0 ? (
          <p>No hay plantillas disponibles. Crea una en la pestaña Plantillas.</p>
        ) : (
          <>
            {filterInput}
            {filtered.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Ninguna plantilla coincide con la búsqueda
              </p>
            ) : (
              <div className="template-pick-list">
                {filtered.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className="template-pick-item"
                    disabled={assigning}
                    onClick={() => onAssign(t.id, validityAmount, validityUnit)}
                  >
                    <strong>{t.name}</strong>
                    {t.description && <span>{t.description}</span>}
                    {t.goal && !t.description && <span>{t.goal}</span>}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
        <button
          type="button"
          className="btn-secondary"
          style={{ width: '100%', marginTop: '1rem' }}
          onClick={onClose}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

type RoutinesTab = 'requests' | 'completed' | 'templates'

const INSTRUCTOR_FILTER_ROLES = new Set(['INSTRUCTOR', 'GYM_OWNER'])

export default function RoutinesSection() {
  const { showSuccess, showWarning, showApiError, showError } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const openedRequestFromUrl = useRef(false)
  const [tab, setTab] = useState<RoutinesTab>('requests')
  const [requests, setRequests] = useState<RoutineRequest[]>([])
  const [routinesById, setRoutinesById] = useState<Map<number, Routine>>(new Map())
  const [templates, setTemplates] = useState<RoutineTemplate[]>([])
  const [members, setMembers] = useState<User[]>([])
  const [staffUsers, setStaffUsers] = useState<User[]>([])
  const [selectedInstructorIds, setSelectedInstructorIds] = useState<number[]>([])
  const [catalog, setCatalog] = useState<CatalogExercise[]>([])
  const [muscleFilter, setMuscleFilter] = useState<MuscleGroup | ''>('CHEST')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingProgress, setSavingProgress] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [assigningToRequest, setAssigningToRequest] = useState<RoutineRequest | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<RoutineRequest | null>(null)
  const [manualMemberId, setManualMemberId] = useState<number | null>(null)
  const [builderMode, setBuilderMode] = useState<BuilderMode>('routine')
  const [builder, setBuilder] = useState(emptyBuilder())
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null)
  const [newExerciseName, setNewExerciseName] = useState('')
  const [dayExerciseName, setDayExerciseName] = useState('')
  const [creatingExercise, setCreatingExercise] = useState(false)
  const [deletingExerciseId, setDeletingExerciseId] = useState<number | null>(null)
  const [guideModal, setGuideModal] = useState<{
    title: string
    exerciseId?: number | null
    guideUrl?: string | null
    videoUrl?: string | null
    imageUrl?: string | null
  } | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const builderBaselineRef = useRef('')

  const captureBuilderBaseline = useCallback((
    nextBuilder: ReturnType<typeof emptyBuilder>,
    nextManualMemberId: number | null,
    nextMode: BuilderMode,
    nextEditingTemplateId: number | null,
  ) => {
    builderBaselineRef.current = serializeBuilderState(nextBuilder, {
      manualMemberId: nextManualMemberId,
      builderMode: nextMode,
      editingTemplateId: nextEditingTemplateId,
    })
  }, [])

  const isBuilderDirty = useCallback(() => {
    if (!showBuilder) return false
    return serializeBuilderState(builder, {
      manualMemberId,
      builderMode,
      editingTemplateId,
    }) !== builderBaselineRef.current
  }, [showBuilder, builder, manualMemberId, builderMode, editingTemplateId])

  const refreshData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [reqsResult, tplsResult, usersResult, exercisesResult] = await Promise.allSettled([
        api.getRoutineRequests(),
        api.getRoutineTemplates(),
        api.getUsers(),
        api.getExercises(),
      ])

      if (reqsResult.status === 'fulfilled') {
        setRequests(reqsResult.value)
      } else if (!silent) {
        setRequests([])
        showError('No se pudieron cargar las solicitudes de rutina')
      }

      if (tplsResult.status === 'fulfilled') {
        setTemplates(tplsResult.value)
      } else if (!silent) {
        setTemplates([])
      }

      if (usersResult.status === 'fulfilled') {
        setMembers(usersResult.value.filter((u) => u.roles.includes('MEMBER')))
        setStaffUsers(usersResult.value.filter((u) =>
          u.roles.some((r) => INSTRUCTOR_FILTER_ROLES.has(r)),
        ))
      }

      if (exercisesResult.status === 'fulfilled') {
        setCatalog(exercisesResult.value)
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }, [showError])

  const loadCompletedRoutines = useCallback(async () => {
    try {
      const routines = await api.getRoutines()
      setRoutinesById(new Map(routines.map((routine) => [routine.id, routine])))
    } catch {
      setRoutinesById(new Map())
    }
  }, [])

  useEffect(() => { void refreshData(false) }, [refreshData])

  useEffect(() => {
    if (tab === 'completed') {
      void loadCompletedRoutines()
    }
  }, [tab, loadCompletedRoutines, requests])

  useEffect(() => {
    if (!muscleFilter) return
    api.getExercises(muscleFilter).then(setCatalog).catch(() => {})
  }, [muscleFilter])

  const initDays = (count: number) => {
    const days: BuilderDay[] = Array.from({ length: count }, (_, i) => ({
      dayNumber: i + 1,
      dayLabel: `Día ${i + 1}`,
      exercises: [],
    }))
    setBuilder((prev) => ({ ...prev, daysPerWeek: count, days, activeDayIndex: 0 }))
  }

  const openForRequest = useCallback(async (req: RoutineRequest) => {
    if (req.status === 'COMPLETED' || req.status === 'REJECTED') return
    setSelectedRequest(req)
    setManualMemberId(null)
    setEditingTemplateId(null)
    setBuilderMode('routine')

    if (req.status === 'IN_PROGRESS' && req.resultingRoutineId != null) {
      try {
        const draft = await api.getRoutine(req.resultingRoutineId)
        const nextBuilder = buildFromRoutine(draft)
        setBuilder(nextBuilder)
        captureBuilderBaseline(nextBuilder, null, 'routine', null)
        setShowBuilder(true)
        return
      } catch (err) {
        showApiError(err, 'No se pudo cargar el progreso guardado')
      }
    }

    const nextBuilder = {
      ...emptyBuilder(),
      name: `Rutina — ${req.memberName}`,
      description: req.description,
      notes: req.goals,
      daysPerWeek: 3,
      days: Array.from({ length: 3 }, (_, i) => ({
        dayNumber: i + 1,
        dayLabel: `Día ${i + 1}`,
        exercises: [] as BuilderExercise[],
      })),
      activeDayIndex: 0,
    }
    setBuilder(nextBuilder)
    captureBuilderBaseline(nextBuilder, null, 'routine', null)
    setShowBuilder(true)
  }, [showApiError, captureBuilderBaseline])

  useEffect(() => {
    if (loading || openedRequestFromUrl.current) return
    const requestIdParam = searchParams.get('requestId')
    if (!requestIdParam) return

    const requestId = Number(requestIdParam)
    if (!Number.isFinite(requestId)) {
      setSearchParams({}, { replace: true })
      return
    }

    const req = requests.find((r) => r.id === requestId)
    if (!req || req.status === 'COMPLETED' || req.status === 'REJECTED') {
      setSearchParams({}, { replace: true })
      return
    }

    openedRequestFromUrl.current = true
    const assignMode = searchParams.get('assign') === '1'
    setSearchParams({}, { replace: true })

    if (assignMode) {
      setAssigningToRequest(req)
    } else {
      void openForRequest(req)
    }
  }, [loading, requests, searchParams, setSearchParams, openForRequest])

  const closeBuilder = () => {
    setShowBuilder(false)
    setSelectedRequest(null)
    setManualMemberId(null)
    setEditingTemplateId(null)
    setBuilderMode('routine')
    setBuilder(emptyBuilder())
    builderBaselineRef.current = ''
  }

  const saveProgressAndClose = async (): Promise<boolean> => {
    if (!selectedRequest) {
      closeBuilder()
      return true
    }
    if (!builder.name.trim()) {
      showWarning('Indica un nombre para la rutina antes de guardar el progreso')
      return false
    }
    setSavingProgress(true)
    try {
      const updated = await api.saveRoutineRequestDraft(selectedRequest.id, buildPayload())
      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      showSuccess('Progreso guardado. Puedes continuar la rutina más tarde.')
      closeBuilder()
      await refreshData(true)
      return true
    } catch (err) {
      showApiError(err, 'No se pudo guardar el progreso')
      return false
    } finally {
      setSavingProgress(false)
    }
  }

  const requestCloseBuilder = () => {
    if (!isBuilderDirty()) {
      closeBuilder()
      return
    }

    if (selectedRequest && builderMode === 'routine') {
      if (window.confirm('¿Guardar el progreso y continuar luego?')) {
        void saveProgressAndClose()
        return
      }
      if (!window.confirm('¿Cerrar sin guardar los cambios?')) {
        return
      }
      closeBuilder()
      return
    }

    if (!window.confirm('¿Quieres cerrar sin guardar los cambios?')) {
      return
    }
    closeBuilder()
  }

  const switchTab = (next: RoutinesTab) => {
    if (!showBuilder) {
      setTab(next)
      return
    }
    if (!isBuilderDirty()) {
      closeBuilder()
      setTab(next)
      return
    }
    if (selectedRequest && builderMode === 'routine') {
      if (window.confirm('¿Guardar el progreso y continuar luego?')) {
        void (async () => {
          if (await saveProgressAndClose()) setTab(next)
        })()
        return
      }
      if (!window.confirm('¿Cerrar sin guardar los cambios?')) {
        return
      }
      closeBuilder()
      setTab(next)
      return
    }
    if (!window.confirm('¿Quieres cerrar sin guardar los cambios?')) {
      return
    }
    closeBuilder()
    setTab(next)
  }
  const openTemplateBuilder = () => {
    setSelectedRequest(null)
    setManualMemberId(null)
    setEditingTemplateId(null)
    setBuilderMode('template')
    const nextBuilder = {
      ...emptyBuilder(),
      daysPerWeek: 3,
      days: Array.from({ length: 3 }, (_, i) => ({
        dayNumber: i + 1,
        dayLabel: `Día ${i + 1}`,
        exercises: [] as BuilderExercise[],
      })),
      activeDayIndex: 0,
    }
    setBuilder(nextBuilder)
    captureBuilderBaseline(nextBuilder, null, 'template', null)
    setShowBuilder(true)
  }

  const openTemplateForEdit = (template: RoutineTemplate) => {
    setSelectedRequest(null)
    setManualMemberId(null)
    setEditingTemplateId(template.id)
    setBuilderMode('template')
    const nextBuilder = buildFromTemplate(template)
    setBuilder(nextBuilder)
    captureBuilderBaseline(nextBuilder, null, 'template', template.id)
    setShowBuilder(true)
  }

  const openAssignTemplateModal = (req: RoutineRequest) => {
    setAssigningToRequest(req)
  }

  const closeAssignTemplateModal = () => {
    setAssigningToRequest(null)
  }

  const finishRequest = async (memberName: string) => {
    closeBuilder()
    closeAssignTemplateModal()
    await refreshData(true)
    await loadCompletedRoutines()
    setTab('completed')
    showSuccess(`Rutina completada para ${memberName}`)
  }

  const handleAssignTemplateToRequest = async (
    templateId: number,
    validityAmount: number,
    validityUnit: RoutineValidityUnit,
  ) => {
    if (!assigningToRequest) return
    const memberName = assigningToRequest.memberName
    setAssigning(true)
    try {
      await api.assignTemplateToRequest(assigningToRequest.id, templateId, validityAmount, validityUnit)
      await finishRequest(memberName)
    } catch (err) {
      showApiError(err, 'No se pudo asignar la plantilla')
    } finally {
      setAssigning(false)
    }
  }

  const reloadCatalog = useCallback(async (filter: MuscleGroup | '' = muscleFilter) => {
    const exercises = await api.getExercises(filter || undefined)
    setCatalog(exercises)
  }, [muscleFilter])

  const submitQuickExercise = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newExerciseName.trim()
    if (!name) {
      showWarning('Escribe el nombre del ejercicio')
      return
    }
    if (!muscleFilter) {
      showWarning('Selecciona una categoría antes de agregar')
      return
    }
    setCreatingExercise(true)
    try {
      const created = await api.createExercise({
        name,
        muscleGroup: muscleFilter,
      })
      setNewExerciseName('')
      await reloadCatalog(muscleFilter)
      addExerciseToDay(created)
      showSuccess('Ejercicio agregado al catálogo')
    } catch (err) {
      showApiError(err, 'No se pudo crear el ejercicio')
    } finally {
      setCreatingExercise(false)
    }
  }

  const deleteCatalogExercise = async (ex: CatalogExercise, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`¿Eliminar «${ex.name}» del catálogo?`)) return
    setDeletingExerciseId(ex.id)
    try {
      await api.deleteExercise(ex.id)
      setCatalog((prev) => prev.filter((c) => c.id !== ex.id))
      showSuccess('Ejercicio eliminado')
    } catch (err) {
      showApiError(err, 'No se pudo eliminar el ejercicio')
    } finally {
      setDeletingExerciseId(null)
    }
  }

  const addExerciseToDay = (exercise: CatalogExercise) => {
    setBuilder((prev) => {
      const days = [...prev.days]
      const day = { ...days[prev.activeDayIndex], exercises: [...days[prev.activeDayIndex].exercises] }
      day.exercises.push({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        imageUrl: exercise.imageUrl ?? '',
        videoUrl: exercise.videoUrl ?? undefined,
        guideUrl: exercise.guideUrl ?? undefined,
        sets: 3,
        reps: 12,
        notes: '',
        orderIndex: day.exercises.length,
      })
      days[prev.activeDayIndex] = day
      return { ...prev, days }
    })
  }

  const addNamedExerciseToDay = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setBuilder((prev) => {
      const days = [...prev.days]
      if (!days[prev.activeDayIndex]) return prev
      const day = { ...days[prev.activeDayIndex], exercises: [...days[prev.activeDayIndex].exercises] }
      day.exercises.push({
        exerciseId: 0,
        exerciseName: trimmed,
        imageUrl: '',
        videoUrl: undefined,
        guideUrl: undefined,
        sets: 3,
        reps: 12,
        notes: '',
        orderIndex: day.exercises.length,
      })
      days[prev.activeDayIndex] = day
      return { ...prev, days }
    })
  }

  const submitDayExercise = (e: React.FormEvent) => {
    e.preventDefault()
    const name = dayExerciseName.trim()
    if (!name) {
      showWarning('Escribe el nombre del ejercicio')
      return
    }
    if (!builder.days[builder.activeDayIndex]) {
      showWarning('Agrega un día a la rutina primero')
      return
    }
    addNamedExerciseToDay(name)
    setDayExerciseName('')
  }

  const removeExercise = (dayIndex: number, exerciseIndex: number) => {
    setBuilder((prev) => {
      const days = [...prev.days]
      const day = { ...days[dayIndex], exercises: days[dayIndex].exercises.filter((_, i) => i !== exerciseIndex) }
      days[dayIndex] = day
      return { ...prev, days }
    })
  }

  const updateExerciseField = (
    dayIndex: number,
    exerciseIndex: number,
    field: 'sets' | 'reps' | 'notes',
    value: string | number,
  ) => {
    setBuilder((prev) => {
      const days = [...prev.days]
      const exercises = [...days[dayIndex].exercises]
      exercises[exerciseIndex] = { ...exercises[exerciseIndex], [field]: value }
      days[dayIndex] = { ...days[dayIndex], exercises }
      return { ...prev, days }
    })
  }

  const loadTemplateIntoBuilder = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId)
    if (!template) return

    const hasContent = builder.days.some((d) => d.exercises.length > 0)
    if (hasContent) {
      const ok = window.confirm('¿Reemplazar el contenido actual con la plantilla seleccionada?')
      if (!ok) return
    }

    setBuilder((prev) => {
      const fromTemplate = buildFromTemplate(template)
      return {
        ...fromTemplate,
        name: prev.name || fromTemplate.name,
        description: prev.description || fromTemplate.description,
        notes: prev.notes,
        goal: prev.goal,
      }
    })
  }

  const buildPayload = () => ({
    name: builder.name.trim(),
    description: builder.description.trim(),
    notes: builder.notes.trim(),
    daysPerWeek: builder.daysPerWeek,
    temporary: false,
    validityAmount: builder.validityAmount,
    validityUnit: builder.validityUnit,
    days: builder.days.map((day) => ({
      dayNumber: day.dayNumber,
      dayLabel: day.dayLabel,
      exercises: day.exercises.map((ex, i) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        imageUrl: ex.imageUrl,
        sets: ex.sets,
        reps: ex.reps,
        notes: ex.notes || null,
        orderIndex: i,
      })),
    })),
  })

  const handleSave = async () => {
    if (!builder.name.trim()) {
      showWarning(builderMode === 'template' ? 'Indica un nombre para la plantilla' : 'Indica un nombre para la rutina')
      return
    }
    if (builder.days.every((d) => d.exercises.length === 0)) {
      showWarning('Agrega al menos un ejercicio')
      return
    }
    if (builderMode === 'routine' && (!builder.validityAmount || builder.validityAmount < 1)) {
      showWarning('Indica la vigencia de la rutina (días, semanas o meses)')
      return
    }

    setSaving(true)
    try {
      const payload = buildPayload()
      if (builderMode === 'template') {
        const templatePayload = {
          name: payload.name,
          description: payload.description,
          goal: builder.goal.trim() || builder.notes.trim() || null,
          daysPerWeek: payload.daysPerWeek,
          days: payload.days,
        }
        if (editingTemplateId) {
          await api.updateRoutineTemplate(editingTemplateId, templatePayload)
        } else {
          await api.createRoutineTemplate(templatePayload)
        }
        closeBuilder()
        await refreshData(true)
        setTab('templates')
        return
      }

      if (selectedRequest) {
        await api.fulfillRoutineRequest(selectedRequest.id, payload)
        await finishRequest(selectedRequest.memberName)
      } else {
        if (!manualMemberId) {
          showWarning('Selecciona un miembro')
          return
        }
        await api.createRoutine({ ...payload, memberId: manualMemberId })
        closeBuilder()
        await refreshData(true)
        setTab('requests')
      }
    } catch (err) {
      showApiError(err, 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  const applyGeneratedPlan = (plan: GeneratedRoutinePlan) => {
    const nextBuilder = {
      ...emptyBuilder(),
      name: plan.name,
      description: plan.description ?? '',
      notes: plan.notes ?? '',
      daysPerWeek: plan.daysPerWeek,
      days: (plan.days ?? []).map((day) => ({
        dayNumber: day.dayNumber,
        dayLabel: day.dayLabel,
        exercises: day.exercises.map((ex, i) => mapExerciseToBuilder(ex, i)),
      })),
      activeDayIndex: 0,
    }
    if (nextBuilder.days.length === 0) {
      showWarning('El generador no devolvió días. Prueba con otros parámetros.')
      return
    }
    setBuilder(nextBuilder)
    // No marcar como "limpio": así al cerrar pregunta si guardar progreso
    showSuccess(plan.instructorSummary || 'Rutina generada. Puedes ajustarla antes de guardar.')
  }

  const openGenerateModal = () => {
    const memberId = selectedRequest?.memberId ?? manualMemberId
    if (memberId == null) {
      showWarning('Selecciona un miembro antes de generar la rutina')
      return
    }
    if (isBuilderDirty()
      && !window.confirm('Hay cambios en el builder. ¿Reemplazarlos con una rutina generada?')) {
      return
    }
    setShowGenerateModal(true)
  }

  const generateMemberId = selectedRequest?.memberId ?? manualMemberId
  const generateMemberName = selectedRequest?.memberName
    ?? (() => {
      const m = members.find((u) => u.id === manualMemberId)
      return m ? `${m.firstName} ${m.lastName}` : 'el miembro'
    })()

  const openRequests = useMemo(
    () => requests.filter((r) => isRoutineRequestOpen(r.status)),
    [requests],
  )

  const visibleOpenRequests = useMemo(() => {
    if (selectedInstructorIds.length === 0) return openRequests
    const ids = new Set(selectedInstructorIds)
    return openRequests.filter((r) =>
      (r.preferredInstructorId != null && ids.has(r.preferredInstructorId))
      || (r.assignedInstructorId != null && ids.has(r.assignedInstructorId)),
    )
  }, [openRequests, selectedInstructorIds])

  const completedRequests = requests
    .filter((r) => r.status === 'COMPLETED')
    .sort((a, b) => {
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0
      return bTime - aTime
    })

  const renderPendingRequestCard = (r: RoutineRequest) => (
    <div key={r.id} className="card routine-request-card">
      <div className="card-list-header">
        <div className="card-list-header-main">
          <h3>{r.memberName}</h3>
          <p className="card-list-meta">
            Instructor preferido: {r.preferredInstructorName ?? 'Cualquier instructor'}
            {r.assignedInstructorName ? ` · Atendiendo: ${r.assignedInstructorName}` : ''}
          </p>
        </div>
        <RoutineRequestStatusBadge status={r.status} />
      </div>
      <p className="card-list-body" title={r.description}>
        {r.description}
      </p>
      <p className="card-list-meta card-list-meta--clamp" title={r.goals}>
        Objetivos: {r.goals}
      </p>
      <div className="routine-request-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => void openForRequest(r)}
        >
          {r.status === 'IN_PROGRESS' ? 'Continuar rutina' : 'Crear rutina'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => openAssignTemplateModal(r)}
        >
          Asignar rutina
        </button>
      </div>
    </div>
  )

  const renderCompletedRequestCard = (r: RoutineRequest) => {
    const routine = r.resultingRoutineId ? routinesById.get(r.resultingRoutineId) : undefined

    return (
    <div key={r.id} className="card">
      <div className="card-list-header">
        <div className="card-list-header-main">
          <h3>{r.memberName}</h3>
          {r.resultingRoutineName && (
            <p className="card-list-body" style={{ marginTop: '0.35rem' }}>{r.resultingRoutineName}</p>
          )}
          {r.assignedInstructorName && (
            <p className="card-list-meta">Atendida por: {r.assignedInstructorName}</p>
          )}
        </div>
        <RoutineRequestStatusBadge status={r.status} />
      </div>
      <p className="card-list-body" title={r.description}>
        {r.description}
      </p>
      <p className="card-list-meta card-list-meta--clamp" title={r.goals}>
        Objetivos: {r.goals}
      </p>
      {routine ? (
        <div style={{ marginTop: '0.75rem' }}>
          <RoutineDisplay routine={routine} compact />
        </div>
      ) : r.resultingRoutineId ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: '0.75rem' }}>
          Rutina #{r.resultingRoutineId} asignada
        </p>
      ) : null}
    </div>
    )
  }

  return (
    <div className="routines-admin">
      <div className="routines-admin-tabs">
        <button
          type="button"
          className={tab === 'requests' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => switchTab('requests')}
        >
          Solicitudes ({openRequests.length})
        </button>
        <button
          type="button"
          className={tab === 'completed' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => switchTab('completed')}
        >
          Rutinas completadas ({completedRequests.length})
        </button>
        <button
          type="button"
          className={tab === 'templates' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => switchTab('templates')}
        >
          Plantillas ({templates.length})
        </button>
        {tab === 'templates' && (
          <button type="button" className="btn-secondary" onClick={openTemplateBuilder} style={{ marginLeft: 'auto' }}>
            + Nueva plantilla
          </button>
        )}
      </div>

      {tab === 'requests' && (
        <div className="appointment-toolbar">
          <div className="appointment-instructor-filter">
            <label htmlFor="routine-instructor-filter">Instructores</label>
            <UserSearchMultiSelect
              users={staffUsers}
              value={selectedInstructorIds}
              onChange={setSelectedInstructorIds}
              searchPlaceholder="Escribe un instructor y pulsa Enter…"
            />
          </div>
        </div>
      )}

      {showBuilder ? (
        <div className="platform-layout admin-section routines-builder-layout">
          <div className="platform-form-panel">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0 }}>
                  {builderMode === 'template'
                    ? (editingTemplateId ? 'Editar plantilla' : 'Nueva plantilla de rutina')
                    : selectedRequest
                      ? `Rutina para ${selectedRequest.memberName}`
                      : 'Nueva rutina personalizada'}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  {builderMode === 'routine' && (
                    <button type="button" className="btn-primary" onClick={openGenerateModal}>
                      Generar rutina
                    </button>
                  )}
                  <button type="button" className="btn-secondary" onClick={requestCloseBuilder}>Cerrar</button>
                </div>
              </div>

              {selectedRequest && (
                <div className="routine-request-context">
                  <p><strong>Solicitud:</strong> {selectedRequest.description}</p>
                  <p><strong>Objetivos:</strong> {selectedRequest.goals}</p>
                  {selectedRequest.additionalNotes && (
                    <p><strong>Notas adicionales:</strong> {selectedRequest.additionalNotes}</p>
                  )}
                  <p>
                    <strong>Instructor preferido:</strong>{' '}
                    {selectedRequest.preferredInstructorName ?? 'Cualquier instructor'}
                  </p>
                </div>
              )}

              {!selectedRequest && builderMode === 'routine' && (
                <div className="form-group">
                  <label>Miembro</label>
                  <select
                    value={manualMemberId ?? ''}
                    onChange={(e) => setManualMemberId(Number(e.target.value))}
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                    ))}
                  </select>
                </div>
              )}

              {builderMode === 'routine' && templates.length > 0 && (
                <div className="form-group">
                  <label>Cargar desde plantilla</label>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const id = Number(e.target.value)
                      if (id) loadTemplateIntoBuilder(id)
                      e.target.value = ''
                    }}
                  >
                    <option value="">Seleccionar plantilla...</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>{builderMode === 'template' ? 'Nombre de la plantilla' : 'Nombre de la rutina'}</label>
                <input
                  value={builder.name}
                  onChange={(e) => setBuilder((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={builder.description}
                  onChange={(e) => setBuilder((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>{builderMode === 'template' ? 'Objetivo / meta' : 'Notas / objetivos'}</label>
                <textarea
                  value={builderMode === 'template' ? builder.goal : builder.notes}
                  onChange={(e) => setBuilder((p) => (
                    builderMode === 'template'
                      ? { ...p, goal: e.target.value }
                      : { ...p, notes: e.target.value }
                  ))}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>Días por semana</label>
                <select
                  value={builder.daysPerWeek}
                  onChange={(e) => initDays(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? 'día' : 'días'}</option>
                  ))}
                </select>
              </div>

              {builderMode === 'routine' && (
                <div className="form-row" style={{ display: 'flex', gap: '0.75rem' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Vigencia</label>
                    <input
                      type="number"
                      min={1}
                      value={builder.validityAmount}
                      onChange={(e) => setBuilder((p) => ({
                        ...p,
                        validityAmount: Math.max(1, Number(e.target.value) || 1),
                      }))}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Unidad</label>
                    <select
                      value={builder.validityUnit}
                      onChange={(e) => setBuilder((p) => ({
                        ...p,
                        validityUnit: e.target.value as RoutineValidityUnit,
                      }))}
                    >
                      <option value="DAYS">Días</option>
                      <option value="WEEKS">Semanas</option>
                      <option value="MONTHS">Meses</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="routine-day-tabs">
                {builder.days.map((day, i) => (
                  <button
                    key={day.dayNumber}
                    type="button"
                    className={builder.activeDayIndex === i ? 'btn-primary' : 'btn-secondary'}
                    style={{ fontSize: '0.85rem', padding: '0.35rem 0.65rem' }}
                    onClick={() => setBuilder((p) => ({ ...p, activeDayIndex: i }))}
                  >
                    {day.dayLabel} ({day.exercises.length})
                  </button>
                ))}
              </div>

              {builder.days[builder.activeDayIndex] && (
                <div className="form-group">
                  <label>Etiqueta del día</label>
                  <input
                    value={builder.days[builder.activeDayIndex].dayLabel}
                    onChange={(e) => {
                      const val = e.target.value
                      setBuilder((p) => {
                        const days = [...p.days]
                        days[p.activeDayIndex] = { ...days[p.activeDayIndex], dayLabel: val }
                        return { ...p, days }
                      })
                    }}
                  />
                </div>
              )}

              <div className="routine-day-exercises">
                <h4>Ejercicios del día</h4>
                <form className="exercise-list-add" onSubmit={submitDayExercise}>
                  <input
                    type="text"
                    value={dayExerciseName}
                    onChange={(e) => setDayExerciseName(e.target.value)}
                    placeholder="Escribe un ejercicio…"
                    aria-label="Nombre del ejercicio del día"
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!dayExerciseName.trim()}
                  >
                    Agregar ejercicio
                  </button>
                </form>
                {builder.days[builder.activeDayIndex]?.exercises.length === 0 ? (
                  <p className="exercise-list-empty">
                    Selecciona del catálogo o agrega un ejercicio arriba
                  </p>
                ) : (
                  <div className="exercise-list">
                    {builder.days[builder.activeDayIndex].exercises.map((ex, i) => (
                      <div key={`${ex.exerciseId}-${i}`} className="exercise-list-item exercise-list-item--media">
                        <button
                          type="button"
                          className="exercise-list-item-delete"
                          onClick={() => removeExercise(builder.activeDayIndex, i)}
                          aria-label={`Quitar ${ex.exerciseName}`}
                          title="Quitar de la rutina"
                        >
                          ×
                        </button>
                        <div className="exercise-list-item-main">
                          <ExerciseMediaThumb
                            name={ex.exerciseName}
                            videoUrl={ex.videoUrl}
                            imageUrl={ex.imageUrl}
                          />
                          <div className="exercise-list-item-body">
                            <span className="exercise-list-item-name">{ex.exerciseName}</span>
                            {(ex.guideUrl || ex.exerciseId > 0) && (
                              <button
                                type="button"
                                className="btn-secondary exercise-guide-btn"
                                onClick={() => setGuideModal({
                                  title: ex.exerciseName,
                                  exerciseId: ex.exerciseId > 0 ? ex.exerciseId : null,
                                  guideUrl: ex.guideUrl,
                                  videoUrl: ex.videoUrl,
                                  imageUrl: ex.imageUrl,
                                })}
                              >
                                Ver guía
                              </button>
                            )}
                            <div className="routine-builder-exercise-inputs">
                              <label>
                                Series
                                <input
                                  type="number"
                                  min={1}
                                  value={ex.sets}
                                  onChange={(e) => updateExerciseField(
                                    builder.activeDayIndex, i, 'sets', parseInt(e.target.value, 10) || 1,
                                  )}
                                />
                              </label>
                              <label>
                                Reps
                                <input
                                  type="number"
                                  min={1}
                                  value={ex.reps}
                                  onChange={(e) => updateExerciseField(
                                    builder.activeDayIndex, i, 'reps', parseInt(e.target.value, 10) || 1,
                                  )}
                                />
                              </label>
                              <label className="routine-builder-notes">
                                Notas
                                <input
                                  value={ex.notes}
                                  onChange={(e) => updateExerciseField(
                                    builder.activeDayIndex, i, 'notes', e.target.value,
                                  )}
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={saving || savingProgress}
                onClick={handleSave}
              >
                {saving
                  ? 'Guardando...'
                  : builderMode === 'template'
                    ? 'Guardar plantilla'
                    : 'Crear rutina'}
              </button>
            </div>
          </div>

          <div className="platform-list">
            <div className="card">
              <div className="exercise-catalog-header">
                <h3>Catálogo de ejercicios</h3>
              </div>
              <div className="exercise-filter-chips">
                <button
                  type="button"
                  className={muscleFilter === '' ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: '0.8rem', padding: '0.3rem 0.55rem' }}
                  onClick={() => { setMuscleFilter(''); api.getExercises().then(setCatalog) }}
                >
                  Todos
                </button>
                {CATALOG_MUSCLE_GROUPS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={muscleFilter === g ? 'btn-primary' : 'btn-secondary'}
                    style={{ fontSize: '0.8rem', padding: '0.3rem 0.55rem' }}
                    onClick={() => setMuscleFilter(g)}
                  >
                    {MUSCLE_GROUP_LABELS[g]}
                  </button>
                ))}
              </div>
              <form className="exercise-list-add" onSubmit={(e) => void submitQuickExercise(e)}>
                <input
                  type="text"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder={
                    muscleFilter
                      ? `Escribe un ejercicio para ${MUSCLE_GROUP_LABELS[muscleFilter]}…`
                      : 'Selecciona una categoría para agregar'
                  }
                  disabled={!muscleFilter || creatingExercise}
                  aria-label="Nombre del nuevo ejercicio"
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!muscleFilter || creatingExercise || !newExerciseName.trim()}
                >
                  {creatingExercise ? '…' : 'Agregar ejercicio'}
                </button>
              </form>
              <div className="exercise-list">
                {catalog.length === 0 ? (
                  <p className="exercise-list-empty">No hay ejercicios en esta categoría</p>
                ) : catalog.map((ex) => (
                  <div key={ex.id} className="exercise-list-item exercise-list-item--media exercise-list-item--pick">
                    <button
                      type="button"
                      className="exercise-list-item-delete"
                      onClick={(e) => void deleteCatalogExercise(ex, e)}
                      disabled={deletingExerciseId === ex.id}
                      aria-label={`Eliminar ${ex.name}`}
                      title="Eliminar del catálogo"
                    >
                      ×
                    </button>
                    <div className="exercise-list-item-main">
                      <button
                        type="button"
                        className="exercise-list-item-pick-media"
                        onClick={() => addExerciseToDay(ex)}
                        title="Agregar a la rutina"
                      >
                        <ExerciseMediaThumb
                          name={ex.name}
                          videoUrl={ex.videoUrl}
                          imageUrl={ex.imageUrl}
                          muscleGroup={ex.muscleGroup}
                        />
                        <span className="exercise-list-item-name">{ex.name}</span>
                      </button>
                      {(ex.guideUrl || ex.id) && (
                        <button
                          type="button"
                          className="btn-secondary exercise-guide-btn"
                          onClick={() => setGuideModal({
                            title: ex.name,
                            exerciseId: ex.id,
                            guideUrl: ex.guideUrl,
                            videoUrl: ex.videoUrl,
                            imageUrl: ex.imageUrl,
                          })}
                        >
                          Ver guía
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : tab === 'requests' ? (
        loading ? (
          <p>Cargando solicitudes...</p>
        ) : (
        <div className="grid grid-2">
          {visibleOpenRequests.length === 0 ? (
            <div className="empty-state card">
              {selectedInstructorIds.length > 0
                ? 'No hay solicitudes para el instructor seleccionado (preferido o en atención)'
                : 'Sin solicitudes de rutina'}
            </div>
          ) : visibleOpenRequests.map(renderPendingRequestCard)}
        </div>
        )
      ) : tab === 'completed' ? (
        <>
          <p className="routine-completed-notice">
            Las solicitudes completadas se eliminan automáticamente 24 horas después de haberse atendido.
          </p>
          {loading ? (
            <p>Cargando rutinas completadas...</p>
          ) : (
          <div className="grid grid-2">
            {completedRequests.length === 0 ? (
              <div className="empty-state card">No hay rutinas completadas recientes</div>
            ) : completedRequests.map(renderCompletedRequestCard)}
          </div>
          )}
        </>
      ) : loading ? (
        <p>Cargando plantillas...</p>
      ) : (
        <div className="grid grid-2">
          {templates.length === 0 ? (
            <div className="empty-state card">
              No hay plantillas. Crea una para reutilizarla con varios miembros.
            </div>
          ) : templates.map((t) => (
            <div
              key={t.id}
              className={`card card-selectable${editingTemplateId === t.id && showBuilder ? ' card-selected' : ''}`}
              onClick={() => openTemplateForEdit(t)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && openTemplateForEdit(t)}
            >
              <RoutineDisplay routine={templateAsRoutine(t)} compact />
              {t.goal && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Objetivo: {t.goal}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {guideModal && (
        <ExerciseGuideModal
          title={guideModal.title}
          exerciseId={guideModal.exerciseId}
          guideUrl={guideModal.guideUrl}
          videoUrl={guideModal.videoUrl}
          imageUrl={guideModal.imageUrl}
          onClose={() => setGuideModal(null)}
        />
      )}

      {assigningToRequest && (
        <AssignTemplateModal
          request={assigningToRequest}
          templates={templates}
          assigning={assigning}
          onAssign={handleAssignTemplateToRequest}
          onClose={closeAssignTemplateModal}
        />
      )}

      {showGenerateModal && generateMemberId != null && (
        <GenerateRoutineModal
          open={showGenerateModal}
          memberId={generateMemberId}
          memberName={generateMemberName}
          routineRequestId={selectedRequest?.id ?? null}
          initialGoals={selectedRequest?.goals}
          initialNotes={selectedRequest?.additionalNotes ?? undefined}
          onClose={() => setShowGenerateModal(false)}
          onGenerated={applyGeneratedPlan}
        />
      )}
    </div>
  )
}

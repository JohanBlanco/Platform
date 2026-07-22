import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../../api'
import ActivityCalendar from '../../components/ActivityCalendar'
import ActivityFormModal, { type ActivityFormDefaults } from '../../components/ActivityFormModal'
import ActivityOccurrenceEditModal from '../../components/ActivityOccurrenceEditModal'
import TagMultiSelect, { type TagOption } from '../../components/TagMultiSelect'
import type { Activity } from '../../types'
import { useToast } from '../../toast'
import { minutesToTimeString } from '../../utils/timelineResizeUtils'

export default function ReceptionCalendarioSection() {
  const { showApiError, showSuccess, showWarning } = useToast()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Activity | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createDefaults, setCreateDefaults] = useState<ActivityFormDefaults>({})
  const [nameFilter, setNameFilter] = useState<string[]>([])
  const rangeRef = useRef<{ from: string; to: string } | null>(null)

  const load = useCallback(async (from?: string, to?: string, options?: { background?: boolean }) => {
    const queryFrom = from ?? rangeRef.current?.from
    const queryTo = to ?? rangeRef.current?.to
    if (!queryFrom || !queryTo) return

    if (!options?.background) setLoading(true)
    try {
      const data = await api.getActivities(queryFrom, queryTo)
      setActivities(data)
    } catch {
      setActivities([])
    } finally {
      if (!options?.background) setLoading(false)
    }
  }, [])

  const handleRangeChange = useCallback((from: string, to: string) => {
    rangeRef.current = { from, to }
    load(from, to)
  }, [load])

  useEffect(() => {
    if (rangeRef.current) load()
  }, [load])

  const activityNameOptions = useMemo<TagOption<string>[]>(() => {
    const names = new Set<string>()
    for (const activity of activities) {
      const name = activity.name?.trim()
      if (name) names.add(name)
    }
    return [...names]
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map((name) => ({ value: name, label: name }))
  }, [activities])

  const filteredActivities = useMemo(() => {
    if (nameFilter.length === 0) return activities
    const selected = new Set(nameFilter)
    return activities.filter((a) => selected.has(a.name?.trim() ?? ''))
  }, [activities, nameFilter])

  const openCreate = (defaults?: ActivityFormDefaults) => {
    setCreateDefaults(defaults ?? {})
    setShowCreate(true)
  }

  const handleMoveOccurrence = async (
    activity: Activity,
    _dateIso: string,
    startMin: number,
    endMin: number,
  ) => {
    if (activity.occurrenceCancelled) return
    try {
      await api.editActivityOccurrence(activity.id, {
        occurrenceDate: activity.activityDate,
        startTime: minutesToTimeString(startMin),
        endTime: minutesToTimeString(endMin),
        locationName: activity.locationName,
        capacity: activity.capacity,
        scope: activity.recurring ? 'OCCURRENCE' : 'SERIES',
      })
      showSuccess('Horario actualizado')
      load(undefined, undefined, { background: true })
    } catch (err) {
      showApiError(err, 'No se pudo mover la actividad')
    }
  }

  return (
    <div className="agenda-actividades-page">
      <div className="appointments-calendar-layout">
        <div className="appointment-toolbar">
          <div className="appointment-instructor-filter">
            <label>Actividades</label>
            <TagMultiSelect
              options={activityNameOptions}
              value={nameFilter}
              onChange={setNameFilter}
              placeholder="Escribe un nombre y pulsa Enter…"
              noResultsMessage="Ninguna actividad coincide con la búsqueda"
            />
          </div>
        </div>

        <ActivityCalendar
          activities={filteredActivities}
          editable
          onActivityEdit={setEditing}
          onCreateActivity={() => openCreate()}
          onCreateSlot={(dateIso, startMin, endMin) => {
            openCreate({
              startDate: dateIso,
              startTime: minutesToTimeString(startMin),
              durationPreset: endMin - startMin <= 30 ? '30' : '60',
            })
          }}
          onMoveOccurrence={handleMoveOccurrence}
          onScheduleConflict={() => showWarning('Ese horario se solapa con otra actividad')}
          onRangeChange={handleRangeChange}
        />

        {loading && activities.length === 0 && (
          <p className="calendar-hint calendar-hint--overlay">Cargando actividades…</p>
        )}
      </div>

      {showCreate && (
        <ActivityFormModal
          open={showCreate}
          defaults={createDefaults}
          onClose={() => setShowCreate(false)}
          onSaved={() => load(undefined, undefined, { background: true })}
        />
      )}

      {editing && (
        <ActivityOccurrenceEditModal
          activity={editing}
          allActivities={activities}
          onClose={() => setEditing(null)}
          onSaved={() => load(undefined, undefined, { background: true })}
        />
      )}
    </div>
  )
}

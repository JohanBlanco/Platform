import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { api } from '../api'

import { useToast } from '../toast'

import { useAuth } from '../auth'

import { canViewAdmin } from '../roles'

import type { AppointmentRequest, StaffAvailability, User } from '../types'

import AppointmentCalendar from './AppointmentCalendar'

import AppointmentDetailModal from './AppointmentDetailModal'

import EditAvailabilityModal, { type AvailabilityChangeEvent, type AvailabilityEditScope } from './EditAvailabilityModal'

import AvailabilityEditScopeModal from './AvailabilityEditScopeModal'

import AvailabilitySlotActionModal from './AvailabilitySlotActionModal'

import StaffCreateAppointmentModal from './StaffCreateAppointmentModal'

import StaffAvailabilityModal from './StaffAvailabilityModal'

import UserSearchMultiSelect from './UserSearchMultiSelect'

import { rangeToQuery, localMinutesFromIso, localTimeFromIso, isoDateFromAppointment, combineDateAndTime } from '../utils/appointmentCalendarUtils'

import { isRangeValidForMove } from '../utils/availabilitySlotDragUtils'
import { findAvailabilityBlockContaining, canCreateOutsideAvailabilitySlot, countReservedForBlocks } from '../utils/availabilityUtils'

import { isAppointmentOnCalendar } from '../utils/appointmentUtils'

import { findContiguousAvailabilityRange } from '../utils/availabilityUtils'

import { addDays, parseDate, toIsoDate } from '../utils/calendarUtils'
import { formatTimeRangeLabel } from '../utils/dateFormat'



type Props = {

  mode: 'staff' | 'member'

}



const STAFF_ROLES = new Set(['GYM_OWNER', 'INSTRUCTOR', 'RECEPTIONIST'])

const INSTRUCTOR_FILTER_ROLES = new Set(['INSTRUCTOR', 'GYM_OWNER'])

const MEMBER_ROLE = 'MEMBER'



export default function AppointmentsCalendarSection({ mode }: Props) {

  const { showApiError, showSuccess, showError } = useToast()

  const { activeRole } = useAuth()

  const isGymAdmin = canViewAdmin(activeRole)

  const [appointments, setAppointments] = useState<AppointmentRequest[]>([])

  const [availabilityBlocks, setAvailabilityBlocks] = useState<StaffAvailability[]>([])

  const [staffUsers, setStaffUsers] = useState<User[]>([])

  const [memberUsers, setMemberUsers] = useState<User[]>([])

  const [initialLoad, setInitialLoad] = useState(true)

  const initialLoadRef = useRef(true)

  const [selectedInstructorIds, setSelectedInstructorIds] = useState<number[]>([])

  const [selected, setSelected] = useState<AppointmentRequest | null>(null)

  const [selectedAvailability, setSelectedAvailability] = useState<StaffAvailability | null>(null)

  const [pendingAvailabilityEdit, setPendingAvailabilityEdit] = useState<StaffAvailability | null>(null)

  const [availabilityEditScope, setAvailabilityEditScope] = useState<AvailabilityEditScope | null>(null)

  const [showStaffCreate, setShowStaffCreate] = useState(false)

  const [showAvailability, setShowAvailability] = useState(false)

  const [slotAction, setSlotAction] = useState<{

    availabilityId: number

    dateIso: string

    startTime: string

    endTime: string

    openAppointment?: AppointmentRequest | null

  } | null>(null)

  const [slotActionLoading, setSlotActionLoading] = useState(false)

  const [reactivateSlot, setReactivateSlot] = useState<{

    availabilityId: number

    dateIso: string

    startTime: string

    endTime: string

    blockedAppointment: AppointmentRequest

  } | null>(null)

  const [reactivateLoading, setReactivateLoading] = useState(false)

  const [createDefaults, setCreateDefaults] = useState<{

    date?: Date

    hour?: number

    openAppointment?: AppointmentRequest

    scheduledStart?: string

    scheduledEnd?: string

    startTime?: string

    endTime?: string

    scheduleContext?: 'availability' | 'outside'

  }>({})

  const [reloadKey, setReloadKey] = useState(0)



  const wideRange = useMemo(() => {

    const from = new Date()

    const to = addDays(from, 60)

    return { from: toIsoDate(from), to: toIsoDate(to), query: rangeToQuery(from, to) }

  }, [])



  const fetchCalendarData = useCallback(() => {

    if (mode === 'member') {

      return api.getMyAppointmentRequests(wideRange.query)

        .then((items) => {

          setAppointments(items)

          setAvailabilityBlocks([])

        })

        .catch(() => {

          setAppointments([])

          setAvailabilityBlocks([])

        })

        .finally(() => {

          if (initialLoadRef.current) {

            initialLoadRef.current = false

            setInitialLoad(false)

          }

        })

    }

    return Promise.all([

      api.getAppointmentRequests(wideRange.query),

      api.getStaffAvailability(wideRange.from, wideRange.to),

      api.getUsers(),

    ])

      .then(([items, availability, users]) => {

        setAppointments(items)

        setAvailabilityBlocks(availability)

        setStaffUsers(users.filter((u) => u.roles.some((r) => STAFF_ROLES.has(r))))

        setMemberUsers(users.filter((u) => u.roles.includes(MEMBER_ROLE)))

      })

      .catch(() => {

        setAppointments([])

        setAvailabilityBlocks([])

      })

      .finally(() => {

        if (initialLoadRef.current) {

          initialLoadRef.current = false

          setInitialLoad(false)

        }

      })

  }, [mode, wideRange])



  useEffect(() => { fetchCalendarData() }, [fetchCalendarData, reloadKey])



  const filteredAppointments = useMemo(() => {

    const base = mode === 'member'

      ? appointments.filter((a) => a.status !== 'OPEN' && a.status !== 'BLOCKED')

      : appointments

    if (mode !== 'staff' || selectedInstructorIds.length === 0) {

      return base

    }

    const ids = new Set(selectedInstructorIds)

    return base.filter((a) => {

      if (a.status === 'OPEN' || a.status === 'BLOCKED') return true

      const staffId = a.assignedStaffId ?? a.preferredStaffId

      return staffId != null && ids.has(staffId)

    })

  }, [appointments, mode, selectedInstructorIds])



  const calendarAppointments = useMemo(() => (

    filteredAppointments.filter((a) => {

      if (a.status === 'BLOCKED') return mode === 'staff'

      return isAppointmentOnCalendar(a.status)

    })

  ), [filteredAppointments, mode])



  const refresh = () => { setReloadKey((k) => k + 1) }



  const applyAvailabilityMutation = useCallback((event: AvailabilityChangeEvent) => {

    if (event.action === 'delete') {

      const ids = new Set(event.blockIds)

      setAvailabilityBlocks((prev) => prev.filter((b) => !ids.has(b.id)))

      setAppointments((prev) => prev

        .filter((a) => {
          if (a.staffAvailabilityId != null && ids.has(a.staffAvailabilityId)) {
            if (a.status === 'OPEN') return false
            if (event.cancelReserved && (a.status === 'PENDING' || a.status === 'SCHEDULED')) {
              return false
            }
          }
          return true
        })

        .map((a) => (

          a.staffAvailabilityId != null && ids.has(a.staffAvailabilityId)

            ? { ...a, staffAvailabilityId: null }

            : a

        )))

      setSelectedAvailability(null)

      return

    }

  }, [])



  const handleAvailabilityChanged = useCallback(async (event: AvailabilityChangeEvent) => {

    applyAvailabilityMutation(event)

    await fetchCalendarData()

  }, [applyAvailabilityMutation, fetchCalendarData])



  const handleAppointmentCreated = (created?: AppointmentRequest) => {

    if (created) {

      setAppointments((prev) => {

        const withoutOpen = created.status === 'SCHEDULED' && created.scheduledStart && created.scheduledEnd

          ? prev.filter((a) => !(

            a.status === 'OPEN'

            && a.scheduledStart === created.scheduledStart

            && a.scheduledEnd === created.scheduledEnd

          ))

          : prev

        const exists = withoutOpen.some((a) => a.id === created.id)

        return exists

          ? withoutOpen.map((a) => (a.id === created.id ? created : a))

          : [...withoutOpen, created]

      })

    }

    refresh()

  }



  const openCountForAvailability = useCallback((availabilityId: number) => (

    appointments.filter((a) => a.staffAvailabilityId === availabilityId && a.status === 'OPEN').length

  ), [appointments])



  const reservedCountForAvailability = useCallback((availabilityId: number) => (

    appointments.filter(

      (a) => a.staffAvailabilityId === availabilityId

        && (a.status === 'PENDING' || a.status === 'SCHEDULED'),

    ).length

  ), [appointments])



  const selectedAvailabilityRange = useMemo(() => {

    if (!selectedAvailability) return []

    return findContiguousAvailabilityRange(selectedAvailability, availabilityBlocks)

  }, [selectedAvailability, availabilityBlocks])



  const activeEditBlocks = useMemo(() => {

    if (!selectedAvailability || !availabilityEditScope) return []

    if (availabilityEditScope === 'day') return [selectedAvailability]

    return selectedAvailabilityRange

  }, [selectedAvailability, availabilityEditScope, selectedAvailabilityRange])



  const handleSelectAvailability = useCallback((block: StaffAvailability) => {

    const range = findContiguousAvailabilityRange(block, availabilityBlocks)

    if (range.length > 1) {

      setPendingAvailabilityEdit(block)

      return

    }

    setSelectedAvailability(block)

    setAvailabilityEditScope('day')

  }, [availabilityBlocks])



  const closeAvailabilityEdit = useCallback(() => {

    setSelectedAvailability(null)

    setAvailabilityEditScope(null)

  }, [])



  const openCountForBlocks = useCallback((blocks: StaffAvailability[]) => {

    const ids = new Set(blocks.map((b) => b.id))

    return appointments.filter(

      (a) => a.staffAvailabilityId != null && ids.has(a.staffAvailabilityId) && a.status === 'OPEN',

    ).length

  }, [appointments])



  const reservedCountForBlocks = useCallback((blocks: StaffAvailability[]) => (
    countReservedForBlocks(blocks, appointments)
  ), [appointments])



  const findOpenAppointmentForSlot = (dateIso: string, startTime: string, endTime: string) => (
    calendarAppointments.find((a) => {
      if (a.status !== 'OPEN' || !a.scheduledStart || !a.scheduledEnd) return false
      return isoDateFromAppointment(a) === dateIso
        && localTimeFromIso(a.scheduledStart) === startTime
        && localTimeFromIso(a.scheduledEnd) === endTime
    })
  )



  const handleSelectAppointment = (appointment: AppointmentRequest) => {

    if (appointment.status === 'OPEN') {

      if (appointment.staffAvailabilityId != null && appointment.scheduledStart && appointment.scheduledEnd) {

        setSlotAction({

          availabilityId: appointment.staffAvailabilityId,

          dateIso: isoDateFromAppointment(appointment) ?? '',

          startTime: localTimeFromIso(appointment.scheduledStart),

          endTime: localTimeFromIso(appointment.scheduledEnd),

          openAppointment: appointment,

        })

      }

      return

    }

    setSelected(appointment)

  }



  const handleCancel = async () => {

    if (!selected) return

    const cancelledId = selected.id

    try {

      await api.updateAppointmentRequestStatus(cancelledId, 'CANCELLED')

      setAppointments((prev) => prev.filter((a) => a.id !== cancelledId))

      showSuccess('Cita cancelada')

      setSelected(null)

      refresh()

    } catch (err) {

      showApiError(err, 'No se pudo cancelar la cita')

      refresh()

    }

  }



  const handleResizeAvailability = async (

    block: StaffAvailability,

    startTime: string,

    endTime: string,

  ) => {

    const range = findContiguousAvailabilityRange(block, availabilityBlocks)

    const rangeIds = new Set(range.map((b) => b.id))

    const rangeStart = range[0]?.availabilityDate ?? block.availabilityDate

    const rangeEnd = range[range.length - 1]?.availabilityDate ?? block.availabilityDate

    const previous = new Map(range.map((b) => [b.id, { startTime: b.startTime, endTime: b.endTime }]))

    setAvailabilityBlocks((prev) => prev.map((b) => (

      rangeIds.has(b.id)

        ? { ...b, startTime: `${startTime}:00`, endTime: `${endTime}:00` }

        : b

    )))

    try {

      await api.updateStaffAvailabilityRange(block.id, {

        startDate: rangeStart,

        endDate: rangeEnd !== rangeStart ? rangeEnd : null,

        startTime,

        endTime,

        slotDurationMinutes: block.slotDurationMinutes,

      })

      if (mode === 'staff') {

        api.getAppointmentRequests(wideRange.query)

          .then(setAppointments)

          .catch(() => {})

      }

    } catch (err) {

      setAvailabilityBlocks((prev) => prev.map((b) => {

        const prevTimes = previous.get(b.id)

        return prevTimes ? { ...b, ...prevTimes } : b

      }))

      showApiError(err, 'No se pudo ajustar la disponibilidad')

    }

  }



  const handleResizeAppointment = async (
    appointment: AppointmentRequest,
    scheduledStart: string,
    scheduledEnd: string,
  ) => {
    const destDateIso = scheduledStart.slice(0, 10)
    const destStartMin = localMinutesFromIso(scheduledStart)
    const destEndMin = localMinutesFromIso(scheduledEnd)

    const destBlock = findAvailabilityBlockContaining(
      destDateIso,
      destStartMin,
      destEndMin,
      availabilityBlocks,
    )

    if (destBlock) {
      if (!isRangeValidForMove(appointments, destBlock, appointment.id, destStartMin, destEndMin)) {
        showError('Ese espacio no está disponible')
        return
      }
    } else {
      const dayAppointments = appointments.filter((a) => {
        if (a.id === appointment.id) return false
        return a.scheduledStart?.slice(0, 10) === destDateIso
      })
      if (!canCreateOutsideAvailabilitySlot(
        destDateIso,
        destStartMin,
        destEndMin,
        availabilityBlocks,
        dayAppointments,
      )) {
        showError('Ese horario no está disponible. Elige otro momento o una duración distinta.')
        return
      }
    }

    const previous = {
      scheduledStart: appointment.scheduledStart,
      scheduledEnd: appointment.scheduledEnd,
      staffAvailabilityId: appointment.staffAvailabilityId,
    }

    setAppointments((prev) => prev
      .filter((a) => {
        if (a.id === appointment.id) return true
        if (a.status !== 'OPEN' || !a.scheduledStart || !a.scheduledEnd) return true
        const aStart = localMinutesFromIso(a.scheduledStart)
        const aEnd = localMinutesFromIso(a.scheduledEnd)
        return !(aStart === destStartMin && aEnd === destEndMin)
      })
      .map((a) => (
        a.id === appointment.id
          ? {
            ...a,
            scheduledStart,
            scheduledEnd,
            staffAvailabilityId: destBlock?.id ?? null,
          }
          : a
      )))

    try {
      const updated = await api.updateAppointmentSchedule(appointment.id, {
        scheduledStart,
        scheduledEnd,
      }) as AppointmentRequest

      const newStartMin = localMinutesFromIso(updated.scheduledStart)
      const newEndMin = localMinutesFromIso(updated.scheduledEnd)

      setAppointments((prev) => prev
        .filter((a) => {
          if (a.id === appointment.id) return true
          if (a.status !== 'OPEN' || !a.scheduledStart || !a.scheduledEnd) return true
          const aStart = localMinutesFromIso(a.scheduledStart)
          const aEnd = localMinutesFromIso(a.scheduledEnd)
          const sameSlot = aStart === newStartMin && aEnd === newEndMin
          return !sameSlot
        })
        .map((a) => (a.id === appointment.id ? { ...a, ...updated } : a))
        .filter((a) => isAppointmentOnCalendar(a.status)))
    } catch (err) {
      setAppointments((prev) => prev.map((a) => (
        a.id === appointment.id ? { ...a, ...previous } : a
      )))

      showApiError(err, 'Ese espacio no está disponible')
    }
  }



  const handleScheduleConflict = () => {

    showError('Ese espacio no está disponible')

  }



  const handleOutsideCreateBlocked = () => {

    showError('Ese horario no está disponible. Elige otro momento o una duración distinta.')

  }



  const openCreateFromSlotAction = () => {

    if (!slotAction) return

    const openAppointment = slotAction.openAppointment

      ?? findOpenAppointmentForSlot(slotAction.dateIso, slotAction.startTime, slotAction.endTime)

    setCreateDefaults({

      date: parseDate(slotAction.dateIso),

      startTime: slotAction.startTime,

      endTime: slotAction.endTime,

      scheduleContext: 'availability',

      openAppointment,

    })

    setShowStaffCreate(true)

    setSlotAction(null)

  }



  const reactivateBlockedSlot = async () => {

    if (!reactivateSlot) return

    const { availabilityId, startTime, endTime, blockedAppointment } = reactivateSlot

    setReactivateLoading(true)

    try {

      await api.unblockAvailabilitySlot(availabilityId, { startTime, endTime })

      setAppointments((prev) => {

        const withoutBlocked = prev.filter((a) => !(

          a.status === 'BLOCKED'

          && a.staffAvailabilityId === availabilityId

          && a.scheduledStart

          && a.scheduledEnd

          && localTimeFromIso(a.scheduledStart) === startTime

          && localTimeFromIso(a.scheduledEnd) === endTime

        ))

        if (blockedAppointment.id > 0) {

          return withoutBlocked.map((a) => (

            a.id === blockedAppointment.id

              ? { ...a, status: 'OPEN' as const }

              : a

          ))

        }

        const openSlot: AppointmentRequest = {

          id: -Date.now(),

          memberId: null,

          memberName: null,

          type: 'CONSULTATION',

          notes: null,

          status: 'OPEN',

          preferredStaffId: null,

          preferredStaffName: null,

          assignedStaffId: null,

          assignedStaffName: null,

          staffAvailabilityId: availabilityId,

          scheduledStart: combineDateAndTime(reactivateSlot.dateIso, startTime),

          scheduledEnd: combineDateAndTime(reactivateSlot.dateIso, endTime),

          createdAt: new Date().toISOString(),

        }

        return [...withoutBlocked, openSlot]

      })

      showSuccess('Espacio reactivado')

      setReactivateSlot(null)

      refresh()

    } catch (err) {

      showApiError(err, 'No se pudo reactivar el espacio')

    } finally {

      setReactivateLoading(false)

    }

  }



  const blockSlotFromAction = async () => {

    if (!slotAction) return

    const { availabilityId, dateIso, startTime, endTime, openAppointment } = slotAction

    setSlotActionLoading(true)

    try {

      await api.blockAvailabilitySlot(availabilityId, { startTime, endTime })

      setAppointments((prev) => {

        const withoutOpen = prev.filter((a) => !(

          a.status === 'OPEN'

          && a.staffAvailabilityId === availabilityId

          && a.scheduledStart

          && a.scheduledEnd

          && localTimeFromIso(a.scheduledStart) === startTime

          && localTimeFromIso(a.scheduledEnd) === endTime

        ))

        if (openAppointment) {

          return withoutOpen.map((a) => (

            a.id === openAppointment.id

              ? { ...a, status: 'BLOCKED' as const }

              : a

          ))

        }

        const blockedSlot: AppointmentRequest = {

          id: -Date.now(),

          memberId: null,

          memberName: null,

          type: 'CONSULTATION',

          notes: null,

          status: 'BLOCKED',

          preferredStaffId: null,

          preferredStaffName: null,

          assignedStaffId: null,

          assignedStaffName: null,

          staffAvailabilityId: availabilityId,

          scheduledStart: combineDateAndTime(dateIso, startTime),

          scheduledEnd: combineDateAndTime(dateIso, endTime),

          createdAt: new Date().toISOString(),

        }

        return [...withoutOpen, blockedSlot]

      })

      showSuccess('Espacio marcado como no disponible')

      setSlotAction(null)

      await fetchCalendarData()

    } catch (err) {

      showApiError(err, 'No se pudo bloquear el espacio')

    } finally {

      setSlotActionLoading(false)

    }

  }



  if (initialLoad) return <p>Cargando calendario de citas…</p>



  return (
    <div className="appointments-calendar-layout">
      <div className="appointment-toolbar">

        {mode === 'staff' && (

          <>

            <div className="appointment-instructor-filter">

              <label htmlFor="appointment-instructor-filter">Instructores</label>

              <UserSearchMultiSelect
                users={staffUsers.filter((u) => u.roles.some((r) => INSTRUCTOR_FILTER_ROLES.has(r)))}
                value={selectedInstructorIds}
                onChange={setSelectedInstructorIds}
                searchPlaceholder="Escribe un instructor y pulsa Enter…"
              />

            </div>

            {isGymAdmin && (
              <div className="appointment-toolbar-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAvailability(true)}>
                  Disponibilidad para citas
                </button>
              </div>
            )}

          </>

        )}

      </div>



      <AppointmentCalendar

        appointments={calendarAppointments}

        availabilityBlocks={mode === 'staff' ? availabilityBlocks : []}

        mode={mode}

        onSelect={handleSelectAppointment}

        onSelectAvailability={mode === 'staff' && isGymAdmin ? handleSelectAvailability : undefined}

        onResizeAvailability={mode === 'staff' && isGymAdmin ? handleResizeAvailability : undefined}

        onResizeAppointment={mode === 'staff' ? handleResizeAppointment : undefined}

        onScheduleConflict={mode === 'staff' ? handleScheduleConflict : undefined}

        onCreateOutsideSlot={mode === 'staff' ? (date, startTime, endTime) => {

          setCreateDefaults({ date, startTime, endTime, scheduleContext: 'outside' })

          setShowStaffCreate(true)

        } : undefined}

        onAvailabilitySlotClick={mode === 'staff' ? (params) => setSlotAction(params) : undefined}

        onBlockedSlotClick={mode === 'staff' ? (params) => setReactivateSlot(params) : undefined}

        onOutsideCreateBlocked={mode === 'staff' ? handleOutsideCreateBlocked : undefined}

      />



      {selected && (

        <AppointmentDetailModal

          appointment={selected}

          mode={mode}

          intervalOpenCount={

            selected.staffAvailabilityId != null

              ? openCountForAvailability(selected.staffAvailabilityId)

              : 0

          }

          onClose={() => setSelected(null)}

          onCancel={handleCancel}

          onCancelAllInInterval={

            mode === 'staff' && selected.staffAvailabilityId != null

              ? async () => {

                  const availabilityId = selected.staffAvailabilityId!

                  const count = openCountForAvailability(availabilityId)

                  if (count === 0) return

                  try {

                    await api.cancelAvailabilityAppointments(availabilityId)

                    showSuccess(`${count} cita${count === 1 ? '' : 's'} cancelada${count === 1 ? '' : 's'}`)

                    setSelected(null)

                    refresh()

                  } catch (err) {

                    showApiError(err, 'No se pudieron cancelar las citas del intervalo')

                  }

                }

              : undefined

          }

        />

      )}



      {pendingAvailabilityEdit && (

        <AvailabilityEditScopeModal

          block={pendingAvailabilityEdit}

          rangeBlocks={findContiguousAvailabilityRange(pendingAvailabilityEdit, availabilityBlocks)}

          onChoose={(scope) => {

            setSelectedAvailability(pendingAvailabilityEdit)

            setAvailabilityEditScope(scope)

            setPendingAvailabilityEdit(null)

          }}

          onClose={() => setPendingAvailabilityEdit(null)}

        />

      )}



      {selectedAvailability && availabilityEditScope && (

        <EditAvailabilityModal

          block={selectedAvailability}

          rangeBlocks={selectedAvailabilityRange}

          editScope={availabilityEditScope}

          appointments={appointments}

          openCount={openCountForBlocks(activeEditBlocks)}

          reservedCount={reservedCountForBlocks(activeEditBlocks)}

          onClose={closeAvailabilityEdit}

          onChanged={handleAvailabilityChanged}

        />

      )}



      {showStaffCreate && memberUsers.length > 0 && staffUsers.length > 0 && (

        <StaffCreateAppointmentModal

          key={`${createDefaults.date?.toISOString() ?? ''}-${createDefaults.startTime ?? ''}-${createDefaults.scheduleContext ?? ''}-${createDefaults.openAppointment?.id ?? 'manual'}`}

          openAppointment={createDefaults.openAppointment}

          initialDate={createDefaults.date}

          initialStartTime={createDefaults.startTime}

          initialEndTime={createDefaults.endTime}

          scheduleContext={createDefaults.scheduleContext}

          availabilityBlocks={availabilityBlocks}

          appointments={calendarAppointments}

          memberUsers={memberUsers}

          staffUsers={staffUsers}

          onClose={() => {

            setShowStaffCreate(false)

            setCreateDefaults({})

          }}

          onCreated={handleAppointmentCreated}

        />

      )}



      {showAvailability && mode === 'staff' && isGymAdmin && (

        <StaffAvailabilityModal

          onClose={() => setShowAvailability(false)}

          onChanged={refresh}

        />

      )}



      {slotAction && mode === 'staff' && (

        <AvailabilitySlotActionModal

          startTime={slotAction.startTime}

          endTime={slotAction.endTime}

          onClose={() => setSlotAction(null)}

          onCreate={openCreateFromSlotAction}

          onBlock={blockSlotFromAction}

          blocking={slotActionLoading}

        />

      )}



      {reactivateSlot && mode === 'staff' && (

        <div className="modal-overlay" role="presentation" onClick={() => !reactivateLoading && setReactivateSlot(null)}>

          <div

            className="modal card availability-slot-action-modal"

            role="dialog"

            aria-labelledby="reactivate-slot-title"

            onClick={(e) => e.stopPropagation()}

          >

            <h2 id="reactivate-slot-title">Reactivar espacio</h2>

            <p className="availability-slot-action-time">

              {formatTimeRangeLabel(reactivateSlot.startTime, reactivateSlot.endTime)}

            </p>

            <p className="confirm-dialog-message">

              ¿Quieres reactivar este espacio?

            </p>

            <div className="modal-actions">

              <button

                type="button"

                className="btn-secondary"

                onClick={() => setReactivateSlot(null)}

                disabled={reactivateLoading}

              >

                No

              </button>

              <button

                type="button"

                className="btn-primary"

                onClick={() => void reactivateBlockedSlot()}

                disabled={reactivateLoading}

              >

                {reactivateLoading ? 'Procesando…' : 'Sí, reactivar'}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}



import { useMemo, useState } from 'react'
import type { AppointmentRequest, StaffAvailability } from '../types'
import { useDateFormat } from '../preferences/useDateFormat'
import {
  appointmentTypeLabel,
  isAppointmentOnCalendar,
  isBookedAppointment,
} from '../utils/appointmentUtils'
import {
  appointmentsForDay,
  appointmentsForRange,
  formatTimeRange,
} from '../utils/appointmentCalendarUtils'
import AppointmentTimeline from './AppointmentTimeline'
import {
  type CalendarView,
  MONTH_LABELS,
  WEEKDAY_LABELS,
  addDays,
  getRangeForView,
  isSameDay,
  shiftAnchor,
  startOfWeek,
  toIsoDate,
} from '../utils/calendarUtils'

type Props = {
  appointments: AppointmentRequest[]
  availabilityBlocks?: StaffAvailability[]
  mode: 'staff' | 'member'
  onSelect?: (appointment: AppointmentRequest) => void
  onSelectAvailability?: (block: StaffAvailability) => void
  onCreateSlot?: (date: Date, hour: number) => void
  onCreateOutsideSlot?: (date: Date, startTime: string, endTime: string) => void
  onCreateInAvailabilitySlot?: (dateIso: string, startTime: string, endTime: string) => void
  onAvailabilitySlotClick?: (params: {
    availabilityId: number
    dateIso: string
    startTime: string
    endTime: string
    openAppointment?: AppointmentRequest | null
  }) => void
  onBlockedSlotClick?: (params: {
    availabilityId: number
    dateIso: string
    startTime: string
    endTime: string
    blockedAppointment: AppointmentRequest
  }) => void
  onOutsideCreateBlocked?: () => void
  onResizeAvailability?: (block: StaffAvailability, startTime: string, endTime: string) => void
  onResizeAppointment?: (
    appointment: AppointmentRequest,
    scheduledStart: string,
    scheduledEnd: string,
  ) => void
  onScheduleConflict?: () => void
}

const VIEWS: { id: CalendarView; label: string }[] = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'year', label: 'Año' },
]

function appointmentKey(a: AppointmentRequest): string {
  return `${a.id}-${a.scheduledStart ?? a.createdAt}`
}

export default function AppointmentCalendar({
  appointments,
  availabilityBlocks = [],
  mode,
  onSelect,
  onSelectAvailability,
  onCreateSlot,
  onCreateOutsideSlot,
  onCreateInAvailabilitySlot,
  onAvailabilitySlotClick,
  onBlockedSlotClick,
  onOutsideCreateBlocked,
  onResizeAvailability,
  onResizeAppointment,
  onScheduleConflict,
}: Props) {
  const { formatPeriodLabel } = useDateFormat()
  const [view, setView] = useState<CalendarView>('week')
  const [anchor, setAnchor] = useState(() => new Date())

  const visibleAppointments = useMemo(
    () => appointments.filter((a) => {
      if (a.status === 'BLOCKED') return mode === 'staff'
      return isAppointmentOnCalendar(a.status)
    }),
    [appointments, mode],
  )
  const range = useMemo(() => getRangeForView(view, anchor), [view, anchor])
  const inRange = useMemo(
    () => appointmentsForRange(visibleAppointments, range.from, range.to),
    [visibleAppointments, range.from, range.to],
  )
  const scheduled = inRange.filter((a) => a.scheduledStart)
  const bookedScheduled = useMemo(
    () => scheduled.filter((a) => isBookedAppointment(a.status)),
    [scheduled],
  )
  const unscheduled = visibleAppointments.filter((a) => !a.scheduledStart)

  return (
    <div className="appointment-calendar card appointment-calendar--gcal">
      <div className="calendar-toolbar appointment-gcal-toolbar">
        <div className="calendar-view-tabs">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`calendar-tab${view === v.id ? ' active' : ''}`}
              onClick={() => setView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="calendar-nav">
          <button type="button" className="btn-secondary" onClick={() => setAnchor((d) => shiftAnchor(view, d, -1))}>‹</button>
          <span className="calendar-period">{formatPeriodLabel(view, anchor)}</span>
          <button type="button" className="btn-secondary" onClick={() => setAnchor((d) => shiftAnchor(view, d, 1))}>›</button>
          <button type="button" className="btn-secondary" onClick={() => setAnchor(new Date())}>Hoy</button>
        </div>
      </div>

      {mode === 'member' && (view === 'day' || view === 'week') && (
        <p className="calendar-hint">Consulta tus citas agendadas. La reserva no se realiza desde este calendario.</p>
      )}

      {(view === 'day' || view === 'week') && (
        <AppointmentTimeline
          appointments={visibleAppointments}
          availabilityBlocks={availabilityBlocks}
          view={view}
          anchor={anchor}
          onSelect={onSelect}
          onSelectAvailability={onSelectAvailability}
          onCreateSlot={onCreateSlot}
          onCreateOutsideSlot={onCreateOutsideSlot}
          onCreateInAvailabilitySlot={onCreateInAvailabilitySlot}
          onAvailabilitySlotClick={onAvailabilitySlotClick}
          onBlockedSlotClick={onBlockedSlotClick}
          onOutsideCreateBlocked={onOutsideCreateBlocked}
          onResizeAvailability={onResizeAvailability}
          onResizeAppointment={onResizeAppointment}
          onScheduleConflict={onScheduleConflict}
          interactive={false}
          staffCalendar={mode === 'staff'}
        />
      )}

      {view === 'month' && (
        <div className="calendar-month">
          <div className="calendar-month-head">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="calendar-month-grid">
            {(() => {
              const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1)
              const start = startOfWeek(first)
              const cells = []
              for (let i = 0; i < 42; i++) {
                const day = addDays(start, i)
                const inMonth = day.getMonth() === anchor.getMonth()
                const dayApps = appointmentsForDay(bookedScheduled, day)
                cells.push(
                  <div
                    key={toIsoDate(day)}
                    className={`calendar-month-cell${inMonth ? '' : ' muted'}${isSameDay(day, new Date()) ? ' today' : ''}`}
                  >
                    <span className="calendar-day-num">{day.getDate()}</span>
                    {dayApps.map((a) => (
                      <button
                        key={appointmentKey(a)}
                        type="button"
                        className="appointment-month-pill"
                        onClick={() => onSelect?.(a)}
                      >
                        {formatTimeRange(a.scheduledStart, a.scheduledEnd)} · {appointmentTypeLabel(a.type)}
                      </button>
                    ))}
                  </div>,
                )
              }
              return cells
            })()}
          </div>
        </div>
      )}

      {view === 'year' && (
        <div className="calendar-year-grid">
          {MONTH_LABELS.map((label, monthIndex) => {
            const monthStart = new Date(anchor.getFullYear(), monthIndex, 1)
            const monthEnd = new Date(anchor.getFullYear(), monthIndex + 1, 0)
            const monthApps = appointmentsForRange(bookedScheduled, monthStart, monthEnd)
            return (
              <button
                key={label}
                type="button"
                className="calendar-year-month"
                onClick={() => {
                  setAnchor(monthStart)
                  setView('month')
                }}
              >
                <strong>{label}</strong>
                <span>{monthApps.length} cita{monthApps.length === 1 ? '' : 's'}</span>
              </button>
            )
          })}
        </div>
      )}

      {unscheduled.length > 0 && mode === 'staff' && (
        <div className="appointment-unscheduled">
          <h3>Sin horario asignado ({unscheduled.length})</h3>
          <div className="appointment-unscheduled-list">
            {unscheduled.map((a) => (
              <button key={a.id} type="button" className="appointment-unscheduled-item" onClick={() => onSelect?.(a)}>
                <strong>{a.memberName}</strong>
                <span>{appointmentTypeLabel(a.type)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {bookedScheduled.length > 0 && view === 'month' && (
        <p className="calendar-summary">{bookedScheduled.length} cita{bookedScheduled.length === 1 ? '' : 's'} en el periodo</p>
      )}
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../../api'
import { useDateFormat } from '../../preferences/useDateFormat'
import type { AppointmentRequest, StaffAvailability } from '../../types'
import AppointmentDetailModal from '../AppointmentDetailModal'
import AppointmentTimeline from '../AppointmentTimeline'
import { bookedAppointmentsForDay, rangeToQuery } from '../../utils/appointmentCalendarUtils'
import { isAppointmentOnCalendar } from '../../utils/appointmentUtils'

type Props = {
  onChanged?: () => void
}

export default function TodayAppointmentsPanel(_props: Props) {
  const { formatPeriodLabel } = useDateFormat()
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([])
  const [availabilityBlocks, setAvailabilityBlocks] = useState<StaffAvailability[]>([])
  const [selected, setSelected] = useState<AppointmentRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const today = useMemo(() => new Date(), [])

  const load = useCallback(() => {
    setLoading(true)
    const query = rangeToQuery(today, today)
    const todayIso = query.from.slice(0, 10)
    Promise.all([
      api.getAppointmentRequests(query),
      api.getStaffAvailability(todayIso, todayIso),
    ])
      .then(([items, availability]) => {
        setAppointments(items.filter((a) => isAppointmentOnCalendar(a.status) || a.status === 'BLOCKED'))
        setAvailabilityBlocks(availability)
      })
      .catch(() => {
        setAppointments([])
        setAvailabilityBlocks([])
      })
      .finally(() => setLoading(false))
  }, [today])

  useEffect(() => { load() }, [load])

  const todayBooked = useMemo(
    () => bookedAppointmentsForDay(appointments, today),
    [appointments, today],
  )

  if (loading) {
    return (
      <div className="dashboard-today-calendar appointment-calendar appointment-calendar--gcal">
        <p className="calendar-hint">Cargando citas del día…</p>
      </div>
    )
  }

  return (
    <>
      <div className="dashboard-today-calendar appointment-calendar appointment-calendar--gcal">
        <div className="dashboard-today-calendar-head">
          <span className="calendar-period">{formatPeriodLabel('day', today)}</span>
          <span className="calendar-hint calendar-hint--dashboard">
            {todayBooked.length === 0
              ? 'No hay citas agendadas para hoy.'
              : `${todayBooked.length} cita${todayBooked.length === 1 ? '' : 's'} agendada${todayBooked.length === 1 ? '' : 's'} hoy`}
          </span>
        </div>

        <AppointmentTimeline
          appointments={appointments}
          availabilityBlocks={availabilityBlocks}
          view="day"
          anchor={today}
          onSelect={setSelected}
          viewOnly
          staffCalendar
          compact
          scrollToNow
          scrollToNowKey={`${loading}-${appointments.length}`}
        />
      </div>

      {selected && (
        <AppointmentDetailModal
          appointment={selected}
          mode="staff"
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

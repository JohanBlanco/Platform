import AppointmentsCalendarSection from '../AppointmentsCalendarSection'

type Props = {
  onChanged?: () => void
}

export default function StaffAppointmentRequestsPanel(_props: Props) {
  return <AppointmentsCalendarSection mode="staff" />
}

import { isMemberView } from '../roles'
import { useAuth } from '../auth'
import MemberHomePage from './inicio/MemberHomePage'
import StaffHomePage from './inicio/StaffHomePage'

export default function DashboardPage() {
  const { activeRole } = useAuth()

  if (isMemberView(activeRole)) {
    return <MemberHomePage />
  }

  return <StaffHomePage />
}

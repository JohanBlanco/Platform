import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth'
import { getAgendaSections } from '../../navigation/sections'

export default function AgendaIndexRedirect() {
  const { activeRole } = useAuth()
  const sections = getAgendaSections(activeRole)
  if (sections.length === 0) return <Navigate to="/" replace />
  return <Navigate to={sections[0].path} replace />
}

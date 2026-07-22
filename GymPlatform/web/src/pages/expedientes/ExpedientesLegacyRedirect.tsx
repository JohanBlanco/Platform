import { Navigate, useLocation } from 'react-router-dom'

export default function ExpedientesLegacyRedirect() {
  const { pathname } = useLocation()
  const target = pathname.replace(/^\/expedientes/, '/reception/expedientes')
  return <Navigate to={target} replace />
}

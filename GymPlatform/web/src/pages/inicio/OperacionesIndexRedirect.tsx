import { Navigate, useParams } from 'react-router-dom'

export default function OperacionesIndexRedirect() {
  const { section } = useParams()
  const panel = section ?? 'pendientes-de-pago'
  return <Navigate to={`/?panel=${panel}`} replace />
}

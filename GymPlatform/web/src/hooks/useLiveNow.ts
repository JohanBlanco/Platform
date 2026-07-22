import { useEffect, useState } from 'react'

/** Hora actual que se actualiza cada minuto (para la línea roja del calendario). */
export function useLiveNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

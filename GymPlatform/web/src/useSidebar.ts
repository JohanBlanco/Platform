import { useEffect, useState } from 'react'

const STORAGE_KEY = 'sidebarOpen'
const MOBILE_MQ = '(max-width: 768px)'

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_MQ).matches
}

export function useSidebar() {
  const [isMobile, setIsMobile] = useState(isMobileViewport)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // En móvil siempre empieza cerrado (hamburger).
    if (isMobileViewport()) return false
    return localStorage.getItem(STORAGE_KEY) !== 'false'
  })

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const onChange = () => {
      const mobile = mq.matches
      setIsMobile(mobile)
      if (mobile) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(localStorage.getItem(STORAGE_KEY) !== 'false')
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem(STORAGE_KEY, sidebarOpen ? 'true' : 'false')
    }
  }, [sidebarOpen, isMobile])

  useEffect(() => {
    if (!(isMobile && sidebarOpen)) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isMobile, sidebarOpen])

  const toggleSidebar = () => setSidebarOpen((open) => !open)

  return { sidebarOpen, setSidebarOpen, toggleSidebar, isMobile }
}

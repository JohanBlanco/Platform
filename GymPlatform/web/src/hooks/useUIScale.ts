import { useEffect } from 'react'

/** Tamaño de referencia: monitor cómodo → escala 1. Ventanas más pequeñas reducen proporcionalmente. */
export const UI_SCALE_REF_WIDTH = 1280
export const UI_SCALE_REF_HEIGHT = 720
export const UI_SCALE_MIN = 0.72
export const UI_SCALE_MAX = 1

export function computeUIScale(width: number, height: number): number {
  if (width <= 0 || height <= 0) return UI_SCALE_MAX
  const scale = Math.min(width / UI_SCALE_REF_WIDTH, height / UI_SCALE_REF_HEIGHT)
  return Math.min(UI_SCALE_MAX, Math.max(UI_SCALE_MIN, scale))
}

/** Aplica --ui-scale en :root según el tamaño de la ventana (toda la aplicación). */
export function useGlobalUIScale() {
  useEffect(() => {
    const measure = () => {
      const scale = computeUIScale(window.innerWidth, window.innerHeight)
      document.documentElement.style.setProperty('--ui-scale', scale.toFixed(3))
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
}

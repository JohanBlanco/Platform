import { useEffect, useRef, useState } from 'react'

type Props = {
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
}

export default function SignaturePad({ value, onChange, disabled = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const [hasStroke, setHasStroke] = useState(Boolean(value))

  useEffect(() => {
    setHasStroke(Boolean(value))
  }, [value])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.floor(rect.width * ratio)
      canvas.height = Math.floor(rect.height * ratio)
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 2
      ctx.strokeStyle = '#111827'
      if (value) {
        const img = new Image()
        img.onload = () => {
          ctx.clearRect(0, 0, rect.width, rect.height)
          ctx.drawImage(img, 0, 0, rect.width, rect.height)
        }
        img.src = value
      }
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [value])

  const getPoint = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if ('touches' in event) {
      const touch = event.touches[0] ?? event.changedTouches[0]
      if (!touch) return null
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return
    event.preventDefault()
    const point = getPoint(event)
    const ctx = canvasRef.current?.getContext('2d')
    if (!point || !ctx) return
    drawingRef.current = true
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
  }

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current || disabled) return
    event.preventDefault()
    const point = getPoint(event)
    const ctx = canvasRef.current?.getContext('2d')
    if (!point || !ctx) return
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    setHasStroke(true)
  }

  const stopDrawing = () => {
    if (!drawingRef.current) return
    drawingRef.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    onChange?.(canvas.toDataURL('image/png'))
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStroke(false)
    onChange?.('')
  }

  return (
    <div className={`signature-pad${disabled ? ' signature-pad--disabled' : ''}`}>
      <canvas
        ref={canvasRef}
        className="signature-pad-canvas"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="signature-pad-footer">
        <span className="text-muted">{hasStroke ? 'Firma capturada' : 'Firme con el mouse o el dedo'}</span>
        {!disabled && (
          <button type="button" className="btn-secondary signature-pad-clear" onClick={clear}>
            Borrar firma
          </button>
        )}
      </div>
    </div>
  )
}

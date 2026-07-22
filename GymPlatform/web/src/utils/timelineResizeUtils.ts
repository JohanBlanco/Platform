import {
  TIMELINE_DAY_MINUTES,
  TIMELINE_END_HOUR,
  TIMELINE_HOUR_HEIGHT,
  TIMELINE_START_HOUR,
  minutesToTimelinePercent,
  readTimelineHourHeight,
} from './appointmentCalendarUtils'

export const RESIZE_SNAP_MINUTES = 15
export const RESIZE_MIN_DURATION = 15

/** Desplaza el timeline para centrar la hora actual (línea roja) en la vista. */
export function scrollTimelineToCurrentTime(
  scrollEl: HTMLElement,
  options?: {
    startHour?: number
    endHour?: number
    hourHeight?: number
  },
): void {
  const startHour = options?.startHour ?? TIMELINE_START_HOUR
  const endHour = options?.endHour ?? TIMELINE_END_HOUR
  const hourHeight = options?.hourHeight ?? readTimelineHourHeight(scrollEl)
  const now = new Date()
  const hour = now.getHours()
  const minute = now.getMinutes()
  if (hour < startHour || hour >= endHour) return

  const totalMinutes = (endHour - startHour) * 60
  const minutesFromStart = (hour - startHour) * 60 + minute
  const totalHeight = (endHour - startHour) * hourHeight
  const topPx = (minutesFromStart / totalMinutes) * totalHeight
  const viewport = scrollEl.clientHeight
  scrollEl.scrollTop = Math.max(0, topPx - Math.round(viewport * 0.35))
}

export function scheduleScrollTimelineToNow(
  scrollEl: HTMLElement | null,
  options?: Parameters<typeof scrollTimelineToCurrentTime>[1] & { watchResize?: boolean },
): (() => void) | undefined {
  if (!scrollEl) return undefined
  const watchResize = options?.watchResize !== false
  const { watchResize: _watchResize, ...scrollOptions } = options ?? {}
  const run = () => scrollTimelineToCurrentTime(scrollEl, scrollOptions)
  run()
  const t1 = window.setTimeout(run, 50)
  const t2 = window.setTimeout(run, 250)
  const t3 = window.setTimeout(run, 600)
  const ro = watchResize && typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => run())
    : null
  ro?.observe(scrollEl)
  return () => {
    window.clearTimeout(t1)
    window.clearTimeout(t2)
    window.clearTimeout(t3)
    ro?.disconnect()
  }
}

export function snapTimelineMinutes(minutes: number, step = RESIZE_SNAP_MINUTES): number {
  return Math.round(minutes / step) * step
}

export function clampTimelineMinutes(minutes: number): number {
  const min = TIMELINE_START_HOUR * 60
  const max = TIMELINE_END_HOUR * 60
  return Math.min(max, Math.max(min, minutes))
}

export function minutesToTimeString(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function timeStringToMinutes(time: string): number {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  return h * 60 + (m || 0)
}

export function timelineStyleFromMinutes(startMinutes: number, endMinutes: number): {
  top: string
  height: string
} {
  const topMinutes = Math.max(0, startMinutes - TIMELINE_START_HOUR * 60)
  const duration = Math.max(RESIZE_MIN_DURATION, endMinutes - startMinutes)
  const minHeightPct = minutesToTimelinePercent(RESIZE_MIN_DURATION)
  return {
    top: `${minutesToTimelinePercent(topMinutes)}%`,
    height: `${Math.max(minHeightPct, minutesToTimelinePercent(duration))}%`,
  }
}

function gridHeightPx(gridEl: HTMLElement): number {
  const height = gridEl.clientHeight
  if (height > 0) return height
  const hourHeight = readTimelineHourHeight(gridEl)
  return (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * hourHeight
}

export function pointerYToMinutes(
  clientY: number,
  gridEl: HTMLElement,
  _scrollEl: HTMLElement | null,
): number {
  const rect = gridEl.getBoundingClientRect()
  const y = clientY - rect.top
  const totalHeight = gridHeightPx(gridEl)
  const raw = (y / totalHeight) * TIMELINE_DAY_MINUTES + TIMELINE_START_HOUR * 60
  return clampTimelineMinutes(snapTimelineMinutes(raw))
}

export function pointerYToMinutesRaw(
  clientY: number,
  gridEl: HTMLElement,
  _scrollEl: HTMLElement | null,
): number {
  const rect = gridEl.getBoundingClientRect()
  const y = clientY - rect.top
  const totalHeight = gridHeightPx(gridEl)
  const raw = (y / totalHeight) * TIMELINE_DAY_MINUTES + TIMELINE_START_HOUR * 60
  return clampTimelineMinutes(raw)
}

const DRAG_THRESHOLD_PX = 4

type TimelineMoveOptions = {
  gridEl: HTMLElement
  scrollEl: HTMLElement | null
  startMinutes: number
  endMinutes: number
  startClientY: number
  startClientX: number
  snapStep?: number
  onDragStart?: () => void
  onPreview: (start: number, end: number) => void
  onCommit: (start: number, end: number) => void
  onClick: () => void
}

export function startTimelineAppointmentMove(options: TimelineMoveOptions): void {
  const step = options.snapStep ?? RESIZE_SNAP_MINUTES
  const duration = options.endMinutes - options.startMinutes
  const minStart = TIMELINE_START_HOUR * 60
  const maxEnd = TIMELINE_END_HOUR * 60

  const pointerMinAtStart = pointerYToMinutesRaw(
    options.startClientY,
    options.gridEl,
    options.scrollEl,
  )
  const offsetMin = pointerMinAtStart - options.startMinutes

  let dragStarted = false

  const computeRange = (clientY: number) => {
    const pointer = pointerYToMinutesRaw(clientY, options.gridEl, options.scrollEl)
    let start = snapTimelineMinutes(pointer - offsetMin, step)
    let end = start + duration
    if (end > maxEnd) {
      end = maxEnd
      start = end - duration
    }
    if (start < minStart) {
      start = minStart
      end = start + duration
    }
    return { start, end }
  }

  const autoScroll = (clientY: number) => {
    const scrollEl = options.scrollEl
    if (!scrollEl) return
    const rect = scrollEl.getBoundingClientRect()
    if (clientY < rect.top + 48) scrollEl.scrollTop -= 12
    else if (clientY > rect.bottom - 48) scrollEl.scrollTop += 12
  }

  const onMouseMove = (e: MouseEvent) => {
    const dy = Math.abs(e.clientY - options.startClientY)
    const dx = Math.abs(e.clientX - options.startClientX)
    if (!dragStarted && dy < DRAG_THRESHOLD_PX && dx < DRAG_THRESHOLD_PX) return

    if (!dragStarted) {
      dragStarted = true
      document.body.classList.add('appointment-is-dragging')
      options.onDragStart?.()
    }

    e.preventDefault()
    autoScroll(e.clientY)
    const range = computeRange(e.clientY)
    options.onPreview(range.start, range.end)
  }

  const cleanup = () => {
    document.body.classList.remove('appointment-is-dragging')
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  const onMouseUp = (e: MouseEvent) => {
    cleanup()
    if (!dragStarted) {
      options.onClick()
      return
    }
    const range = computeRange(e.clientY)
    options.onCommit(range.start, range.end)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

type ResizeSessionOptions = {
  edge: 'top' | 'bottom'
  startMinutes: number
  endMinutes: number
  gridEl: HTMLElement
  scrollEl: HTMLElement | null
  onPreview: (start: number, end: number) => void
  onCommit: (start: number, end: number) => void
}

export function startTimelineResizeSession(options: ResizeSessionOptions): void {
  document.body.classList.add('appointment-is-resizing')

  const applyEdge = (clientY: number, baseStart: number, baseEnd: number) => {
    const minutes = pointerYToMinutes(clientY, options.gridEl, options.scrollEl)
    if (options.edge === 'top') {
      const start = clampTimelineMinutes(Math.min(minutes, baseEnd - RESIZE_MIN_DURATION))
      return { start, end: baseEnd }
    }
    const end = clampTimelineMinutes(Math.max(minutes, baseStart + RESIZE_MIN_DURATION))
    return { start: baseStart, end }
  }

  const onMove = (e: PointerEvent) => {
    const { start, end } = applyEdge(e.clientY, options.startMinutes, options.endMinutes)
    options.onPreview(start, end)
  }

  const cleanup = () => {
    document.body.classList.remove('appointment-is-resizing')
    document.removeEventListener('pointermove', onMove)
    document.removeEventListener('pointerup', onUp)
  }

  const onUp = (e: PointerEvent) => {
    cleanup()
    const { start, end } = applyEdge(e.clientY, options.startMinutes, options.endMinutes)
    options.onCommit(start, end)
  }

  document.addEventListener('pointermove', onMove)
  document.addEventListener('pointerup', onUp)
}

export function getTimelineGridElements(fromEl: HTMLElement): {
  gridEl: HTMLElement
  scrollEl: HTMLElement | null
} {
  const gridEl = fromEl.closest('.appointment-gcal-day-grid') as HTMLElement | null
  if (!gridEl) {
    throw new Error('Timeline grid not found')
  }
  const scrollEl = gridEl.closest('.appointment-gcal-scroll') as HTMLElement | null
  return { gridEl, scrollEl }
}

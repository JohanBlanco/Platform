export const ACTIVITY_DURATION_PRESETS = [
  { id: '30', label: '30 min', minutes: 30 },
  { id: '60', label: '1 hr', minutes: 60 },
  { id: '90', label: '1.5 hrs', minutes: 90 },
  { id: '120', label: '2 hrs', minutes: 120 },
  { id: 'all-day', label: 'Todo el día', minutes: null },
] as const

export type ActivityDurationPresetId = (typeof ACTIVITY_DURATION_PRESETS)[number]['id']

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  const total = h * 60 + m + minutes
  const nh = Math.floor(total / 60) % 24
  const nm = total % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

export function durationMinutesFromTimes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.slice(0, 5).split(':').map(Number)
  const [eh, em] = endTime.slice(0, 5).split(':').map(Number)
  return Math.max(15, eh * 60 + em - (sh * 60 + sm))
}

export function inferDurationPresetId(
  allDay: boolean,
  startTime: string,
  endTime: string,
): ActivityDurationPresetId {
  if (allDay) return 'all-day'
  if (!endTime) return '60'
  const mins = durationMinutesFromTimes(startTime, endTime)
  const match = ACTIVITY_DURATION_PRESETS.find((p) => p.minutes === mins)
  return match?.id ?? '60'
}

export function endTimeFromPreset(startTime: string, presetId: ActivityDurationPresetId): string | null {
  const preset = ACTIVITY_DURATION_PRESETS.find((p) => p.id === presetId)
  if (!preset || preset.minutes == null) return null
  return addMinutesToTime(startTime, preset.minutes)
}

export function isAllDayPreset(presetId: ActivityDurationPresetId): boolean {
  return presetId === 'all-day'
}

export function formatDurationMinutesLabel(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const rest = minutes % 60
    if (rest === 0) return hours === 1 ? '1 hr' : `${hours} hrs`
    return hours === 1 ? `1 hr ${rest} min` : `${hours} hrs ${rest} min`
  }
  return `${minutes} min`
}

export function durationLabelFromPreset(presetId: ActivityDurationPresetId): string {
  const preset = ACTIVITY_DURATION_PRESETS.find((p) => p.id === presetId)
  if (!preset) return '1 hr'
  return preset.label
}

export function durationLabelForSchedule(
  allDay: boolean,
  startTime: string,
  endTime: string | null,
  presetId: ActivityDurationPresetId,
): string {
  if (allDay) return 'Todo el día'
  if (endTime) {
    const preset = ACTIVITY_DURATION_PRESETS.find((p) => p.id === presetId)
    if (preset?.minutes != null && preset.minutes === durationMinutesFromTimes(startTime, endTime)) {
      return preset.label
    }
    return formatDurationMinutesLabel(durationMinutesFromTimes(startTime, endTime))
  }
  return durationLabelFromPreset(presetId)
}

export const WEEKDAY_OPTIONS = [
  { value: 'MONDAY', label: 'Lun' },
  { value: 'TUESDAY', label: 'Mar' },
  { value: 'WEDNESDAY', label: 'Mié' },
  { value: 'THURSDAY', label: 'Jue' },
  { value: 'FRIDAY', label: 'Vie' },
  { value: 'SATURDAY', label: 'Sáb' },
  { value: 'SUNDAY', label: 'Dom' },
] as const

export function weekdayFromDate(dateIso: string): string {
  const d = new Date(`${dateIso}T12:00:00`)
  const jsDay = d.getDay()
  const map = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  return map[jsDay]
}

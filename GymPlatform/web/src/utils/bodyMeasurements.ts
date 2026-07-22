import type { BiologicalSex, BodyMeasurementCreatePayload } from '../types'
import { formatDateTime } from './dateFormat'

export type BodyMeasurementFormState = {
  memberId: number | ''
  ageYears: string
  sex: BiologicalSex | ''
  weightKg: string
  heightCm: string
  neckCm: string
  chestCm: string
  waistCm: string
  hipsCm: string
  shouldersCm: string
  leftArmCm: string
  rightArmCm: string
  leftForearmCm: string
  rightForearmCm: string
  leftThighCm: string
  rightThighCm: string
  leftCalfCm: string
  rightCalfCm: string
  notes: string
}

export const emptyMeasurementForm = (): BodyMeasurementFormState => ({
  memberId: '',
  ageYears: '',
  sex: '',
  weightKg: '',
  heightCm: '',
  neckCm: '',
  chestCm: '',
  waistCm: '',
  hipsCm: '',
  shouldersCm: '',
  leftArmCm: '',
  rightArmCm: '',
  leftForearmCm: '',
  rightForearmCm: '',
  leftThighCm: '',
  rightThighCm: '',
  leftCalfCm: '',
  rightCalfCm: '',
  notes: '',
})

function parseOptionalPositive(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const n = Number(trimmed.replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return undefined
  return n
}

export function formToPayload(form: BodyMeasurementFormState): BodyMeasurementCreatePayload | null {
  if (!form.memberId || !form.sex) return null
  const ageYears = Number(form.ageYears)
  const weightKg = Number(form.weightKg.replace(',', '.'))
  const heightCm = Number(form.heightCm.replace(',', '.'))
  if (!Number.isFinite(ageYears) || ageYears < 10 || ageYears > 120) return null
  if (!Number.isFinite(weightKg) || weightKg <= 0) return null
  if (!Number.isFinite(heightCm) || heightCm <= 0) return null

  const payload: BodyMeasurementCreatePayload = {
    memberId: form.memberId,
    ageYears,
    sex: form.sex,
    weightKg,
    heightCm,
  }

  const optionalFields: (keyof BodyMeasurementCreatePayload)[] = [
    'neckCm', 'chestCm', 'waistCm', 'hipsCm', 'shouldersCm',
    'leftArmCm', 'rightArmCm', 'leftForearmCm', 'rightForearmCm',
    'leftThighCm', 'rightThighCm', 'leftCalfCm', 'rightCalfCm',
  ]
  const formKeys: (keyof BodyMeasurementFormState)[] = [
    'neckCm', 'chestCm', 'waistCm', 'hipsCm', 'shouldersCm',
    'leftArmCm', 'rightArmCm', 'leftForearmCm', 'rightForearmCm',
    'leftThighCm', 'rightThighCm', 'leftCalfCm', 'rightCalfCm',
  ]
  formKeys.forEach((formKey, i) => {
    const val = parseOptionalPositive(String(form[formKey]))
    if (val != null) {
      const apiKey = optionalFields[i]
      ;(payload as unknown as Record<string, number>)[apiKey] = val
    }
  })

  if (form.notes.trim()) payload.notes = form.notes.trim()
  return payload
}

export function formatMeasurementDate(iso: string): string {
  return formatDateTime(iso, 'es')
}

export function bmiBadgeClass(category: string | null | undefined): string {
  switch (category) {
    case 'Bajo peso': return 'measurement-badge measurement-badge--warning'
    case 'Peso normal': return 'measurement-badge measurement-badge--success'
    case 'Sobrepeso': return 'measurement-badge measurement-badge--warning'
    case 'Obesidad': return 'measurement-badge measurement-badge--danger'
    default: return 'measurement-badge'
  }
}

export function bodyFatBadgeClass(category: string | null | undefined): string {
  switch (category) {
    case 'Atlético':
    case 'Fitness':
      return 'measurement-badge measurement-badge--success'
    case 'Promedio':
      return 'measurement-badge measurement-badge--neutral'
    case 'Elevado':
      return 'measurement-badge measurement-badge--danger'
    default:
      return 'measurement-badge'
  }
}

export const SEX_LABELS: Record<BiologicalSex, string> = {
  MALE: 'Hombre',
  FEMALE: 'Mujer',
}

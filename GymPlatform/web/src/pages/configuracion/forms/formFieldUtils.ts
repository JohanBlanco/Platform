import type { FormField } from '../../../types'

export type FormFieldAnswers = Record<string, string | boolean | undefined>

export function isFieldVisible(field: FormField, answers: FormFieldAnswers): boolean {
  const sourceId = field.visibilityFieldId?.trim()
  if (!sourceId) return true

  const answer = answers[sourceId]
  const expected = field.visibilityValue ?? ''

  if (typeof answer === 'boolean') {
    return String(answer) === expected
  }
  return String(answer ?? '') === expected
}

export function conditionSourceFields(fields: FormField[], currentFieldId: string): FormField[] {
  const index = fields.findIndex((field) => field.id === currentFieldId)
  if (index <= 0) return []
  return fields.slice(0, index).filter((field) =>
    field.type === 'RADIO' || field.type === 'SELECT' || field.type === 'CHECKBOX',
  )
}

export function conditionValueOptions(sourceField: FormField | undefined): string[] {
  if (!sourceField) return []
  if (sourceField.type === 'CHECKBOX') {
    return ['true', 'false']
  }
  return sourceField.options
}

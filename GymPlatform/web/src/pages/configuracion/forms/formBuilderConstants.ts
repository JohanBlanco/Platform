import type { FormFieldType } from '../../../types'

export type CustomFormPayload = {
  title: string
  slug?: string
  description?: string | null
  accessType: import('../../../types').FormAccessType
  active: boolean
  fields: import('../../../types').FormField[]
  templateFolderId?: number | null
  responseFolderId?: number | null
}

export const FORM_ACCESS_LABELS: Record<import('../../../types').FormAccessType, string> = {
  PUBLIC: 'Público',
  AUTHENTICATED: 'Solo usuarios del sistema',
}

export const FORM_FIELD_PALETTE: {
  type: FormFieldType
  label: string
  description: string
  icon: string
}[] = [
  { type: 'TEXT', label: 'Texto corto', description: 'Nombre, título, respuesta breve', icon: 'Aa' },
  { type: 'TEXTAREA', label: 'Párrafo', description: 'Comentarios o descripciones largas', icon: '¶' },
  { type: 'EMAIL', label: 'Correo', description: 'Validación de email', icon: '@' },
  { type: 'PHONE', label: 'Teléfono', description: 'Número de contacto', icon: '☎' },
  { type: 'NUMBER', label: 'Número', description: 'Edad, cantidad, medidas', icon: '#' },
  { type: 'SELECT', label: 'Lista', description: 'Desplegable con opciones', icon: '▾' },
  { type: 'RADIO', label: 'Opción única', description: 'Elegir una entre varias', icon: '◉' },
  { type: 'CHECKBOX', label: 'Casilla', description: 'Aceptación o confirmación', icon: '☑' },
  { type: 'DATE', label: 'Fecha', description: 'Selector de fecha', icon: '📅' },
  { type: 'HEADING', label: 'Título de sección', description: 'Organiza el formulario', icon: 'H' },
  { type: 'SIGNATURE', label: 'Firma', description: 'Captura de firma con mouse o tacto', icon: '✍' },
]

export function createFormField(type: FormFieldType): import('../../../types').FormField {
  const paletteItem = FORM_FIELD_PALETTE.find((item) => item.type === type)
  return {
    id: crypto.randomUUID(),
    type,
    label: paletteItem?.label ?? 'Campo',
    placeholder: ['TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'NUMBER'].includes(type) ? 'Escribe aquí…' : '',
    helpText: '',
    required: type !== 'HEADING' && type !== 'CHECKBOX',
    options: type === 'SELECT' || type === 'RADIO' ? ['Opción 1', 'Opción 2'] : [],
    visibilityFieldId: null,
    visibilityValue: null,
  }
}

export function formLinkVariable(slug: string): string {
  return `{{form:${slug}}}`
}

export function resolveFormLinks(body: string, forms: Pick<import('../../../types').CustomForm, 'slug' | 'publicUrl'>[]): string {
  return body.replace(/\{\{form:([a-z0-9-]+)\}\}/gi, (_, slug: string) => {
    const form = forms.find((item) => item.slug === slug)
    return form?.publicUrl ?? `{{form:${slug}}}`
  })
}

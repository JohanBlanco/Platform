import type { BroadcastMessageTemplate } from '../types'

export type WhatsAppOutboundSelection = {
  sendRegistrationForm: boolean
  templateIds: number[]
}

export const EMPTY_WHATSAPP_OUTBOUND: WhatsAppOutboundSelection = {
  sendRegistrationForm: false,
  templateIds: [],
}

/** Bienvenida del plan elegido; sin plan → nada por defecto. */
export function defaultOutboundForPackage(
  templates: BroadcastMessageTemplate[],
  packageId: string | number | undefined | null,
): WhatsAppOutboundSelection {
  if (packageId === '' || packageId == null) {
    return { ...EMPTY_WHATSAPP_OUTBOUND }
  }
  const pkgId = Number(packageId)
  if (!Number.isFinite(pkgId)) {
    return { ...EMPTY_WHATSAPP_OUTBOUND }
  }
  return {
    sendRegistrationForm: false,
    templateIds: templates
      .filter((t) => t.purpose === 'WELCOME' && t.membershipPackageId === pkgId)
      .map((t) => t.id),
  }
}

/** Activa o quita plantillas de bienvenida sin tocar el resto de la selección. */
export function withWelcomeOutbound(
  selection: WhatsAppOutboundSelection,
  templates: BroadcastMessageTemplate[],
  packageId: string | number | undefined | null,
  sendWelcome: boolean,
): WhatsAppOutboundSelection {
  const withoutWelcome = {
    ...selection,
    templateIds: selection.templateIds.filter((id) => {
      const template = templates.find((t) => t.id === id)
      return template?.purpose !== 'WELCOME'
    }),
  }
  if (!sendWelcome) return withoutWelcome
  const welcomeIds = defaultOutboundForPackage(templates, packageId).templateIds
  return {
    ...withoutWelcome,
    templateIds: [...withoutWelcome.templateIds, ...welcomeIds.filter((id) => !withoutWelcome.templateIds.includes(id))],
  }
}

export function hasWhatsAppOutboundSelection(selection: WhatsAppOutboundSelection): boolean {
  return selection.sendRegistrationForm || selection.templateIds.length > 0
}

export function summarizeWhatsAppOutbound(
  selection: WhatsAppOutboundSelection,
  templates: BroadcastMessageTemplate[],
): string {
  const parts: string[] = []
  if (selection.sendRegistrationForm) {
    parts.push('Formulario de registro')
  }
  for (const id of selection.templateIds) {
    const name = templates.find((t) => t.id === id)?.name
    if (name) parts.push(name)
  }
  if (parts.length === 0) return 'Ningún mensaje'
  if (parts.length === 1) return parts[0]
  return `${parts.length} mensajes`
}

export type WhatsAppOutboundResultLike = {
  whatsappUrl?: string | null
  deliveryMode?: string | null
  cloudMessageId?: string | null
  /** Alias usados en create user */
  registrationFormWhatsappUrl?: string | null
  registrationFormDeliveryMode?: string | null
  registrationFormCloudMessageId?: string | null
}

export function resolveWhatsAppOutboundResult(result: WhatsAppOutboundResultLike) {
  const url = result.whatsappUrl ?? result.registrationFormWhatsappUrl ?? null
  const deliveryMode = result.deliveryMode ?? result.registrationFormDeliveryMode ?? null
  const cloudMessageId = result.cloudMessageId ?? result.registrationFormCloudMessageId ?? null
  const isCloud = deliveryMode === 'CLOUD_API' || !!cloudMessageId
  return { url, deliveryMode, cloudMessageId, isCloud }
}

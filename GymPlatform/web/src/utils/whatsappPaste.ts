/**
 * Normaliza texto pegado (ChatGPT, Word, navegador) para plantillas WhatsApp:
 * emojis Unicode, negrita, links e imágenes/archivos por URL.
 */

const MEDIA_EXT = /\.(png|jpe?g|gif|webp|bmp|svg|pdf|docx?|xlsx?|pptx?|zip|rar|mp4|mov)(\?[^\s]*)?$/i

export type WhatsAppPasteResult = {
  body: string
  mediaUrls: string[]
}

function decodeBasicEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
}

function isMediaUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (MEDIA_EXT.test(u.pathname)) return true
    // CDNs / Drive often no tienen extensión en el path
    if (/drive\.google\.com|dropbox\.com|docs\.google\.com|onedrive\.live\.com|imgur\.com|cloudinary\.com/i.test(u.hostname)) {
      return true
    }
  } catch {
    return MEDIA_EXT.test(url)
  }
  return false
}

function normalizeUrl(raw: string): string {
  const url = raw.trim().replace(/[),.;!?]+$/, '')
  if (url.startsWith('www.')) return `https://${url}`
  return url
}

function uniqueUrls(urls: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of urls) {
    const url = normalizeUrl(raw)
    if (!/^https?:\/\//i.test(url)) continue
    const key = url.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(url)
  }
  return out
}

/** Convierte HTML pegado a texto plano estilo WhatsApp (conserva emojis). */
export function htmlToWhatsAppPlain(html: string): WhatsAppPasteResult {
  const mediaUrls: string[] = []
  if (typeof DOMParser === 'undefined') {
    return { body: decodeBasicEntities(html.replace(/<[^>]+>/g, '')), mediaUrls }
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script, style, meta, link').forEach((el) => el.remove())

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? ''
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return ''
    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()

    if (tag === 'br') return '\n'
    if (tag === 'img') {
      const src = el.getAttribute('src')
      if (src && /^https?:\/\//i.test(src)) mediaUrls.push(src)
      return ''
    }
    if (tag === 'a') {
      const href = el.getAttribute('href') ?? ''
      const label = Array.from(el.childNodes).map(walk).join('').trim()
      if (/^https?:\/\//i.test(href) || href.startsWith('www.')) {
        const url = normalizeUrl(href.startsWith('www.') ? `https://${href}` : href)
        if (isMediaUrl(url)) {
          mediaUrls.push(url)
          return label || ''
        }
        if (!label || label === url) return url
        return `${label}\n${url}`
      }
      return label
    }

    const inner = Array.from(el.childNodes).map(walk).join('')
    if (tag === 'strong' || tag === 'b') {
      const t = inner.trim()
      return t ? `**${t}**` : inner
    }
    if (tag === 'em' || tag === 'i') {
      const t = inner.trim()
      return t ? `_${t}_` : inner
    }
    if (['p', 'div', 'tr', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'section', 'article'].includes(tag)) {
      return `${inner}\n`
    }
    if (tag === 'ul' || tag === 'ol') return `${inner}\n`
    return inner
  }

  let body = Array.from(doc.body.childNodes).map(walk).join('')
  body = decodeBasicEntities(body)
  body = body.replace(/\u00a0/g, ' ')
  body = body.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()

  return { body, mediaUrls: uniqueUrls(mediaUrls) }
}

/** Extrae markdown de imágenes/links y URLs de media del texto plano. */
export function normalizePlainWhatsAppPaste(plain: string): WhatsAppPasteResult {
  const mediaUrls: string[] = []
  let body = plain.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  body = body.replace(/!\[([^\]]*)]\((https?:\/\/[^)\s]+)\)/gi, (_m, _alt: string, url: string) => {
    mediaUrls.push(url)
    return ''
  })

  body = body.replace(/\[([^\]]+)]\((https?:\/\/[^)\s]+)\)/gi, (_m, label: string, url: string) => {
    if (isMediaUrl(url)) {
      mediaUrls.push(url)
      return label
    }
    return `${label}\n${url}`
  })

  // URLs sueltas que parecen archivos/imágenes → media (se quitan del cuerpo)
  body = body.replace(/(https?:\/\/[^\s<>"']+)/gi, (url) => {
    const clean = normalizeUrl(url)
    if (isMediaUrl(clean)) {
      mediaUrls.push(clean)
      return ''
    }
    return clean
  })

  body = body.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  return { body, mediaUrls: uniqueUrls(mediaUrls) }
}

export function normalizeWhatsAppPaste(input: {
  plain?: string | null
  html?: string | null
}): WhatsAppPasteResult {
  const html = input.html?.trim() ?? ''
  const plain = input.plain ?? ''

  // Preferir HTML si trae estructura útil (negrita/links/imgs), si no el plain
  const looksUsefulHtml = html.length > 0
    && /<(p|div|br|strong|b|a|img|em|i)\b/i.test(html)
    && !/^<meta\b/i.test(html.trim())

  let result: WhatsAppPasteResult
  if (looksUsefulHtml) {
    result = htmlToWhatsAppPlain(html)
    // Si el HTML quedó vacío pero hay plain (p. ej. solo emojis), usar plain
    if (!result.body.trim() && plain.trim()) {
      result = normalizePlainWhatsAppPaste(plain)
    } else if (plain.trim().length > result.body.trim().length + 20) {
      // A veces el HTML pierde emojis; si plain es claramente más rico, combinar media del HTML + cuerpo plain
      const fromPlain = normalizePlainWhatsAppPaste(plain)
      result = {
        body: fromPlain.body,
        mediaUrls: uniqueUrls([...result.mediaUrls, ...fromPlain.mediaUrls]),
      }
    } else {
      const fromPlain = normalizePlainWhatsAppPaste(result.body)
      result = {
        body: fromPlain.body,
        mediaUrls: uniqueUrls([...result.mediaUrls, ...fromPlain.mediaUrls]),
      }
    }
  } else {
    result = normalizePlainWhatsAppPaste(plain)
  }

  return result
}

export function mergeMediaLinkLines(existing: string, urls: string[]): string {
  const current = existing
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  return uniqueUrls([...current, ...urls]).join('\n')
}

export function extractUrlsFromText(text: string): string[] {
  const found: string[] = []
  const re = /(https?:\/\/[^\s<>"']+)/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    found.push(m[1])
  }
  return uniqueUrls(found)
}

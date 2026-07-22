/**
 * Cifrado híbrido RSA-OAEP-SHA256 + AES-GCM para secretos de WhatsApp Cloud API.
 * Compatible con SecretsCryptoService del backend.
 */

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function importRsaPublicKey(pem: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(pem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt'],
  )
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

export type EncryptedSecretPayload = {
  alg: string
  keyId: string
  encryptedKey: string
  iv: string
  ciphertext: string
}

export type WhatsAppSecretFields = {
  accessToken?: string
  appSecret?: string
  verifyToken?: string
}

/**
 * Cifra el mapa de secretos con la clave pública del servidor.
 * Solo incluye claves con valor no vacío.
 */
export async function encryptWhatsAppSecrets(
  publicKeyPem: string,
  keyId: string,
  alg: string,
  secrets: WhatsAppSecretFields,
): Promise<EncryptedSecretPayload | null> {
  const payload: Record<string, string> = {}
  if (secrets.accessToken?.trim()) payload.accessToken = secrets.accessToken.trim()
  if (secrets.appSecret?.trim()) payload.appSecret = secrets.appSecret.trim()
  if (secrets.verifyToken?.trim()) payload.verifyToken = secrets.verifyToken.trim()
  if (Object.keys(payload).length === 0) return null

  const rsaKey = await importRsaPublicKey(publicKeyPem)
  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt'])
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const plaintext = new TextEncoder().encode(JSON.stringify(payload))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plaintext)
  const rawAes = await crypto.subtle.exportKey('raw', aesKey)
  const encryptedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, rsaKey, rawAes)

  return {
    alg,
    keyId,
    encryptedKey: toBase64(encryptedKey),
    iv: toBase64(iv.buffer),
    ciphertext: toBase64(ciphertext),
  }
}

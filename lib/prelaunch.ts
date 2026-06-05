const COOKIE_NAME = 'petala_prelaunch_access'
const DEFAULT_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

type PrelaunchConfig = {
  enabled: boolean
  accessCode: string | null
  cookieSecret: string | null
  maxAgeSeconds: number
  configured: boolean
}

function normalizeFlag(value: string | undefined) {
  return value?.trim().toLowerCase() === 'true'
}

function getPositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback

  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback

  return parsed
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlToBytes(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function timingSafeEqual(left: string, right: string) {
  const encoder = new TextEncoder()
  const leftBytes = encoder.encode(left)
  const rightBytes = encoder.encode(right)
  const maxLength = Math.max(leftBytes.length, rightBytes.length)
  let diff = leftBytes.length ^ rightBytes.length

  for (let index = 0; index < maxLength; index += 1) {
    diff |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0)
  }

  return diff === 0
}

export function isPrelaunchLockEnabled() {
  return normalizeFlag(process.env.PRELAUNCH_LOCK_ENABLED)
}

export function getPrelaunchCookieName() {
  return COOKIE_NAME
}

export function getPrelaunchConfig(): PrelaunchConfig {
  const enabled = isPrelaunchLockEnabled()
  const password = process.env.PRELAUNCH_PASSWORD?.trim() || null
  const accessCode = process.env.PRELAUNCH_ACCESS_CODE?.trim() || password
  const cookieSecret = process.env.PRELAUNCH_COOKIE_SECRET?.trim() || null
  const maxAgeSeconds = getPositiveInteger(
    process.env.PRELAUNCH_COOKIE_MAX_AGE_SECONDS,
    DEFAULT_MAX_AGE_SECONDS
  )

  return {
    enabled,
    accessCode,
    cookieSecret,
    maxAgeSeconds,
    configured: !enabled || Boolean(accessCode && cookieSecret),
  }
}

export function verifyPrelaunchAccessCode(input: string) {
  const config = getPrelaunchConfig()
  const normalizedInput = input.trim()

  if (!config.enabled) {
    return { ok: true, code: 'LOCK_DISABLED' as const }
  }

  if (!config.configured || !config.accessCode) {
    return { ok: false, code: 'LOCK_NOT_CONFIGURED' as const }
  }

  if (!normalizedInput || !timingSafeEqual(normalizedInput, config.accessCode)) {
    return { ok: false, code: 'INVALID_CODE' as const }
  }

  return { ok: true, code: 'VALID_CODE' as const }
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export async function signPrelaunchValue(value: string, secret: string) {
  const key = await importHmacKey(secret)
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))

  return bytesToBase64Url(new Uint8Array(signature))
}

export async function buildPrelaunchCookieValue(now = Date.now()) {
  const config = getPrelaunchConfig()

  if (!config.enabled || !config.configured || !config.cookieSecret) {
    return null
  }

  const payload = {
    v: 1,
    exp: now + config.maxAgeSeconds * 1000,
  }
  const encodedPayload = bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const signature = await signPrelaunchValue(encodedPayload, config.cookieSecret)

  return `${encodedPayload}.${signature}`
}

export async function verifyPrelaunchCookie(cookieValue: string | undefined, now = Date.now()) {
  const config = getPrelaunchConfig()

  if (!config.enabled) return true
  if (!config.configured || !config.cookieSecret || !cookieValue) return false

  const [encodedPayload, signature, extra] = cookieValue.split('.')
  if (!encodedPayload || !signature || extra) return false

  const expectedSignature = await signPrelaunchValue(encodedPayload, config.cookieSecret)
  if (!timingSafeEqual(signature, expectedSignature)) return false

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(encodedPayload))) as {
      v?: number
      exp?: number
    }

    return payload.v === 1 && typeof payload.exp === 'number' && payload.exp > now
  } catch {
    return false
  }
}

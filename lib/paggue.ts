// lib/paggue.ts
// SDK manual para o gateway Paggue (aceita conteudo adulto no Brasil)
// Docs: https://docs.paggue.io

import crypto from 'crypto'

type PaggueEnvName = 'PAGGUE_API_URL' | 'PAGGUE_API_KEY' | 'PAGGUE_WEBHOOK_SECRET'

export class PaggueConfigurationError extends Error {
  code: string
  envVar: PaggueEnvName

  constructor(envVar: PaggueEnvName) {
    super(`${envVar}_NOT_CONFIGURED`)
    this.name = 'PaggueConfigurationError'
    this.code = `${envVar}_NOT_CONFIGURED`
    this.envVar = envVar
  }
}

export class PaggueNetworkError extends Error {
  code = 'PAGGUE_NETWORK_ERROR'
  host: string
  path: string
  causeCode: string | null

  constructor(host: string, path: string, causeCode: string | null) {
    super(`Paggue network error for ${host}${path}`)
    this.name = 'PaggueNetworkError'
    this.host = host
    this.path = path
    this.causeCode = causeCode
  }
}

export class PaggueHttpError extends Error {
  code = 'PAGGUE_HTTP_ERROR'
  host: string
  path: string
  status: number

  constructor(host: string, path: string, status: number) {
    super(`Paggue HTTP error ${status} for ${host}${path}`)
    this.name = 'PaggueHttpError'
    this.host = host
    this.path = path
    this.status = status
  }
}

function getRequiredEnv(name: PaggueEnvName): string {
  const value = process.env[name]?.trim()
  if (!value) throw new PaggueConfigurationError(name)
  return value
}

function getBaseUrl(): string {
  const rawUrl = getRequiredEnv('PAGGUE_API_URL')

  try {
    const parsed = new URL(rawUrl)
    return parsed.toString().replace(/\/$/, '')
  } catch {
    throw new PaggueConfigurationError('PAGGUE_API_URL')
  }
}

function getRequestConfig() {
  const baseUrl = getBaseUrl()
  const apiKey = getRequiredEnv('PAGGUE_API_KEY')
  const host = new URL(baseUrl).host

  return { baseUrl, apiKey, host }
}

function getCauseCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null

  const directCode = 'code' in error ? (error as { code?: unknown }).code : null
  if (typeof directCode === 'string') return directCode

  const cause = 'cause' in error ? (error as { cause?: unknown }).cause : null
  if (!cause || typeof cause !== 'object') return null

  const causeCode = 'code' in cause ? (cause as { code?: unknown }).code : null
  return typeof causeCode === 'string' ? causeCode : null
}

// ============================================================
// TIPOS
// ============================================================

export interface PaggueCharge {
  id: string
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  amount: number
  pix_qr_code: string
  pix_qr_code_image: string
  expires_at: string
  paid_at: string | null
  metadata: Record<string, string>
}

export interface CreateChargeParams {
  amount_cents: number
  description: string
  customer_name: string
  customer_email: string
  customer_cpf?: string
  expires_in_minutes?: number
  metadata?: Record<string, string>
  webhook_url?: string
}

// ============================================================
// FUNCOES
// ============================================================

async function paggueRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown
): Promise<T> {
  const { baseUrl, apiKey, host } = getRequestConfig()

  let res: Response
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    const causeCode = getCauseCode(error)
    console.error('[paggue] fetch failed', { method, host, path, causeCode })
    throw new PaggueNetworkError(host, path, causeCode)
  }

  if (!res.ok) {
    await res.text().catch(() => '')
    console.error('[paggue] http error', { method, host, path, status: res.status })
    throw new PaggueHttpError(host, path, res.status)
  }

  return res.json() as Promise<T>
}

// Cria uma cobranca Pix
export async function createPixCharge(params: CreateChargeParams): Promise<PaggueCharge> {
  return paggueRequest<PaggueCharge>('POST', '/v1/charges', {
    payment_method: 'pix',
    amount: params.amount_cents,
    description: params.description,
    expires_in: (params.expires_in_minutes ?? 30) * 60,
    customer: {
      name: params.customer_name,
      email: params.customer_email,
      document: params.customer_cpf,
    },
    metadata: params.metadata ?? {},
    webhook_url: params.webhook_url,
  })
}

// Consulta o status de uma cobranca
export async function getCharge(chargeId: string): Promise<PaggueCharge> {
  return paggueRequest<PaggueCharge>('GET', `/v1/charges/${chargeId}`)
}

// Valida a assinatura HMAC do webhook.
// Paggue envia o header X-Paggue-Signature com HMAC-SHA256 do body.
export function validateWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  let webhookSecret: string

  try {
    webhookSecret = getRequiredEnv('PAGGUE_WEBHOOK_SECRET')
  } catch (error) {
    console.error('[paggue] webhook secret not configured', {
      code: error instanceof PaggueConfigurationError ? error.code : 'PAGGUE_WEBHOOK_SECRET_NOT_CONFIGURED',
    })
    return false
  }

  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    )
  } catch {
    return false
  }
}

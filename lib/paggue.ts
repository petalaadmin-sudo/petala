// lib/paggue.ts
// SDK manual para o gateway Paggue (aceita conteúdo adulto no Brasil)
// Docs: https://docs.paggue.io

import crypto from 'crypto'

const BASE_URL = process.env.PAGGUE_API_URL || 'https://api.paggue.io'
const API_KEY  = process.env.PAGGUE_API_KEY!
const WEBHOOK_SECRET = process.env.PAGGUE_WEBHOOK_SECRET!

// ============================================================
// TIPOS
// ============================================================

export interface PaggueCharge {
  id: string
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  amount: number           // em centavos
  pix_qr_code: string      // copia e cola
  pix_qr_code_image: string // base64 do QR Code
  expires_at: string
  paid_at: string | null
  metadata: Record<string, string>
}

export interface CreateChargeParams {
  amount_cents: number          // valor em centavos
  description: string
  customer_name: string
  customer_email: string
  customer_cpf?: string
  expires_in_minutes?: number   // padrão: 30
  metadata?: Record<string, string>
  webhook_url?: string
}

// ============================================================
// FUNÇÕES
// ============================================================

async function paggueRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Paggue ${method} ${path} → ${res.status}: ${err}`)
  }

  return res.json() as Promise<T>
}

// Cria uma cobrança Pix
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

// Consulta o status de uma cobrança
export async function getCharge(chargeId: string): Promise<PaggueCharge> {
  return paggueRequest<PaggueCharge>('GET', `/v1/charges/${chargeId}`)
}

// Valida a assinatura HMAC do webhook
// Paggue envia o header X-Paggue-Signature com HMAC-SHA256 do body
export function validateWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')

  // Comparação timing-safe para evitar timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    )
  } catch {
    return false
  }
}

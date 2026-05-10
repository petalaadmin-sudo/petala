// lib/pix/paggue.ts
// Documentação: https://docs.paggue.io

import crypto from 'crypto'

const BASE_URL = process.env.PAGGUE_API_URL!
const API_KEY  = process.env.PAGGUE_API_KEY!
const SECRET   = process.env.PAGGUE_WEBHOOK_SECRET!

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface PixChargeParams {
  amount_brl: number        // valor em reais (ex: 19.90)
  customer_name: string
  customer_email: string
  customer_cpf?: string     // opcional, melhora aprovação
  external_id: string       // ID único da sua transação (transaction.id)
  description: string       // ex: "Pétala — Pacote Buquê (300 + 150 pétalas)"
  expires_in_minutes?: number  // padrão: 30
}

export interface PixCharge {
  id: string                // ID da cobrança no Paggue
  status: 'pending' | 'paid' | 'expired' | 'cancelled'
  qr_code: string           // string copia-e-cola
  qr_code_image: string     // base64 do QR code PNG
  amount: number            // valor em centavos
  expires_at: string        // ISO timestamp
  external_id: string
}

export interface WebhookPayload {
  event: 'payment.paid' | 'payment.expired' | 'payment.cancelled'
  charge_id: string
  external_id: string
  amount: number            // em centavos
  paid_at?: string
}

// ── Criar cobrança Pix ─────────────────────────────────────────────────────

export async function createPixCharge(params: PixChargeParams): Promise<PixCharge> {
  const res = await fetch(`${BASE_URL}/charges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      amount: Math.round(params.amount_brl * 100),  // converte para centavos
      customer: {
        name: params.customer_name,
        email: params.customer_email,
        ...(params.customer_cpf && { cpf: params.customer_cpf }),
      },
      external_id: params.external_id,
      description: params.description,
      expires_in: (params.expires_in_minutes ?? 30) * 60,  // em segundos
      payment_method: 'pix',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Paggue error ${res.status}: ${JSON.stringify(err)}`)
  }

  return res.json()
}

// ── Consultar status de uma cobrança ──────────────────────────────────────

export async function getPixCharge(chargeId: string): Promise<PixCharge> {
  const res = await fetch(`${BASE_URL}/charges/${chargeId}`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` },
    next: { revalidate: 0 },  // sempre busca ao vivo
  })

  if (!res.ok) throw new Error(`Paggue getCharge error ${res.status}`)
  return res.json()
}

// ── Validar assinatura do webhook ─────────────────────────────────────────
// O Paggue envia um header X-Paggue-Signature com HMAC-SHA256 do body

export function validateWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false

  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(rawBody)
    .digest('hex')

  // Comparação segura contra timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

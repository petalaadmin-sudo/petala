import { createAdminClient } from '@/lib/supabase/server'
import { validateWebhookSignature } from '@/lib/paggue'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type PixWebhookEvent = {
  event: string
  data: {
    id: string
    paid_at?: string | null
    amount?: number | string | null
    metadata?: Record<string, string | undefined>
  }
}

function parseInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.trunc(parsed)
}

function parseAmountBrl(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('x-paggue-signature') ?? ''

    if (!validateWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Assinatura invalida' }, { status: 401 })
    }

    const event = JSON.parse(rawBody) as PixWebhookEvent

    if (event.event !== 'charge.paid') {
      return NextResponse.json({ received: true })
    }

    const chargeId = event.data.id
    const metadata = event.data.metadata ?? {}
    const userId = metadata.user_id
    const packageName = metadata.package_name ?? null
    const paidAt = event.data.paid_at ?? null
    const idempotencyKey = `pix:${chargeId}`

    if (!chargeId || !userId) {
      return NextResponse.json({ error: 'Metadata invalida' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: existingTransaction, error: existingError } = await admin
      .from('transactions')
      .select('status, balance_after, petals_delta, amount_brl, metadata, idempotency_key')
      .eq('gateway_id', chargeId)
      .maybeSingle()

    if (existingError) {
      console.error('[webhook/pix] Erro ao buscar transacao existente:', existingError)
      return NextResponse.json({ error: 'Erro ao verificar transacao' }, { status: 500 })
    }

    const metadataBonusPetals = parseInteger(metadata.bonus_petals) ?? 0
    const metadataTotalPetals = parseInteger(metadata.total_petals)
    const fallbackTotalPetals = parseInteger(existingTransaction?.petals_delta)
    const paidPetals =
      parseInteger(metadata.petals) ??
      parseInteger(metadata.paid_petals) ??
      ((metadataTotalPetals ?? fallbackTotalPetals ?? 0) - metadataBonusPetals)
    const totalPetals = paidPetals + metadataBonusPetals

    if (paidPetals <= 0 || metadataBonusPetals < 0 || totalPetals <= 0) {
      return NextResponse.json({ error: 'Petalas invalidas no Pix' }, { status: 400 })
    }

    if (fallbackTotalPetals !== null && fallbackTotalPetals !== totalPetals) {
      console.error('[webhook/pix] Petalas divergentes na transacao pending:', {
        chargeId,
        pendingPetals: fallbackTotalPetals,
        totalPetals,
      })
      return NextResponse.json({ error: 'Dados Pix inconsistentes' }, { status: 409 })
    }

    const gatewayAmountBrl = event.data.amount ? Number(event.data.amount) / 100 : null
    const amountBrl =
      parseAmountBrl(existingTransaction?.amount_brl) ??
      parseAmountBrl(gatewayAmountBrl) ??
      0

    const { data: credit, error: creditError } = await admin.rpc('complete_pix_purchase_with_lots', {
      p_user_id: userId,
      p_gateway_id: chargeId,
      p_amount_brl: amountBrl,
      p_paid_petals: paidPetals,
      p_bonus_petals: metadataBonusPetals,
      p_package_name: packageName,
      p_idempotency_key: idempotencyKey,
      p_metadata: {
        provider: 'paggue',
        gateway_id: chargeId,
        charge_id: chargeId,
        package_id: metadata.package_id ?? null,
        package_name: packageName,
        amount_brl: amountBrl,
        paid_at: paidAt,
        confirmed_by: 'pix_webhook',
      },
    })

    if (creditError || !credit?.success) {
      console.error('[webhook/pix] Erro ao completar Pix:', creditError ?? credit)
      return NextResponse.json({ error: 'Erro ao creditar' }, { status: 500 })
    }

    if (!credit.idempotent_replay) {
      await admin.rpc('on_first_purchase', { p_user_id: userId })
        .then((result) => console.log('[webhook/pix] on_first_purchase:', result.data))
        .catch((error) => console.error('[webhook/pix] on_first_purchase erro:', error))
    }

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    const apiKey = process.env.ONESIGNAL_REST_API_KEY
    if (appId && apiKey && !credit.idempotent_replay) {
      const { data: userData } = await admin
        .from('users')
        .select('onesignal_player_id')
        .eq('id', userId)
        .single()

      if (userData?.onesignal_player_id) {
        fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Basic ${apiKey}` },
          body: JSON.stringify({
            app_id: appId,
            include_player_ids: [userData.onesignal_player_id],
            headings: { pt: 'Pétalas adicionadas!' },
            contents: { pt: `${totalPetals} pétalas do pacote ${packageName ?? 'Pix'} estão na sua conta.` },
          }),
        }).catch(console.error)
      }
    }

    console.log(`[webhook/pix] OK: +${totalPetals} petalas -> ${userId}`)
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[webhook/pix]', err)
    return NextResponse.json({ received: true, error: String(err) })
  }
}

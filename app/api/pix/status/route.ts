import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getCharge } from '@/lib/paggue'
import { NextResponse } from 'next/server'

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

function getMetadataValue(
  gatewayMetadata: Record<string, string | undefined>,
  transactionMetadata: Record<string, unknown>,
  key: string
): unknown {
  return gatewayMetadata[key] ?? transactionMetadata[key]
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chargeId = searchParams.get('charge_id')

  if (!chargeId) {
    return NextResponse.json({ error: 'charge_id obrigatorio' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: tx } = await admin
    .from('transactions')
    .select('status, balance_after, petals_delta, amount_brl, metadata, idempotency_key')
    .eq('gateway_id', chargeId)
    .eq('user_id', user.id)
    .single()

  if (!tx) {
    return NextResponse.json({ error: 'Nao encontrada' }, { status: 404 })
  }

  if (tx.status === 'completed') {
    return NextResponse.json({
      status: 'paid',
      new_balance: tx.balance_after,
      petals_credited: tx.petals_delta,
    })
  }

  try {
    const charge = await getCharge(chargeId)

    if (charge.status === 'paid' && tx.status === 'pending') {
      const transactionMetadata =
        tx.metadata && typeof tx.metadata === 'object' && !Array.isArray(tx.metadata)
          ? tx.metadata as Record<string, unknown>
          : {}
      const gatewayMetadata = charge.metadata ?? {}
      const idempotencyKey = `pix:${chargeId}`
      const bonusPetals = parseInteger(getMetadataValue(gatewayMetadata, transactionMetadata, 'bonus_petals')) ?? 0
      const metadataTotalPetals = parseInteger(getMetadataValue(gatewayMetadata, transactionMetadata, 'total_petals'))
      const paidPetals =
        parseInteger(getMetadataValue(gatewayMetadata, transactionMetadata, 'petals')) ??
        parseInteger(getMetadataValue(gatewayMetadata, transactionMetadata, 'paid_petals')) ??
        ((metadataTotalPetals ?? tx.petals_delta) - bonusPetals)
      const totalPetals = paidPetals + bonusPetals

      if (paidPetals <= 0 || bonusPetals < 0 || totalPetals <= 0 || totalPetals !== tx.petals_delta) {
        console.error('[pix/status] Dados Pix inconsistentes:', {
          chargeId,
          pendingPetals: tx.petals_delta,
          paidPetals,
          bonusPetals,
          totalPetals,
        })
        return NextResponse.json({ error: 'Dados Pix inconsistentes' }, { status: 409 })
      }

      const amountBrl =
        parseAmountBrl(tx.amount_brl) ??
        parseAmountBrl(charge.amount ? charge.amount / 100 : null) ??
        0
      const packageName =
        getMetadataValue(gatewayMetadata, transactionMetadata, 'package_name')?.toString() ?? null

      const { data: credit, error: creditError } = await admin.rpc('complete_pix_purchase_with_lots', {
        p_user_id: user.id,
        p_gateway_id: chargeId,
        p_amount_brl: amountBrl,
        p_paid_petals: paidPetals,
        p_bonus_petals: bonusPetals,
        p_package_name: packageName,
        p_idempotency_key: idempotencyKey,
        p_metadata: {
          provider: 'paggue',
          gateway_id: chargeId,
          charge_id: chargeId,
          package_id: getMetadataValue(gatewayMetadata, transactionMetadata, 'package_id') ?? null,
          package_name: packageName,
          amount_brl: amountBrl,
          paid_at: charge.paid_at,
          confirmed_by: 'pix_status',
        },
      })

      if (creditError || !credit?.success) {
        console.error('[pix/status] Erro ao completar Pix:', creditError ?? credit)
        return NextResponse.json({ error: 'Erro ao creditar' }, { status: 500 })
      }

      if (!credit.idempotent_replay) {
        await admin.rpc('on_first_purchase', { p_user_id: user.id })
          .then((result) => console.log('[pix/status] on_first_purchase:', result.data))
          .catch((error) => console.error('[pix/status] on_first_purchase erro:', error))
      }

      return NextResponse.json({
        status: 'paid',
        new_balance: credit.new_balance,
        petals_credited: credit.total_petals ?? totalPetals,
      })
    }

    return NextResponse.json({ status: charge.status })
  } catch (err) {
    console.error('[pix/status]', err)
    return NextResponse.json({ status: tx.status })
  }
}

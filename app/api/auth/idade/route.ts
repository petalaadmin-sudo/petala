import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { NextRequest, NextResponse } from 'next/server'

const AGE_CONFIRMATION_BONUS = 50
const AGE_CONFIRMATION_SOURCE = 'age_confirmation_bonus'

function statusForCreditResult(result: any) {
  if (!result) return 500
  if (result.code === 'IDEMPOTENCY_KEY_CONFLICT') return 409
  if (result.code === 'USER_NOT_FOUND') return 404
  if (result.code === 'INVALID_AMOUNT' || result.code === 'INVALID_SOURCE_TYPE') return 400
  return 500
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json().catch(() => null)

    if (body?.confirmed !== true) {
      return NextResponse.json({
        success: false,
        error: 'Confirmacao de idade obrigatoria',
        code: 'AGE_CONFIRMATION_REQUIRED',
      }, { status: 400 })
    }

    const admin = createAdminClient() as any
    const now = new Date().toISOString()
    const idempotencyKey = `${AGE_CONFIRMATION_SOURCE}:${auth.user.id}`

    const { data: existingUser, error: lookupError } = await admin
      .from('users')
      .select('id, age_confirmed, balance_petals')
      .eq('id', auth.user.id)
      .maybeSingle()

    if (lookupError) {
      console.error('[/api/auth/idade] users lookup', lookupError)

      return NextResponse.json({
        success: false,
        error: 'Erro ao validar usuario',
      }, { status: 500 })
    }

    if (!existingUser) {
      const { error: insertError } = await admin.from('users').upsert({
        id: auth.user.id,
        email: auth.user.email ?? null,
        role: 'user',
        balance_petals: 0,
        age_confirmed: false,
      }, { onConflict: 'id', ignoreDuplicates: true })

      if (insertError) {
        console.error('[/api/auth/idade] users insert', insertError)

        return NextResponse.json({
          success: false,
          error: 'Erro ao preparar usuario',
        }, { status: 500 })
      }
    }

    if (existingUser?.age_confirmed === true) {
      return NextResponse.json({
        success: true,
        age_confirmed: true,
        already_confirmed: true,
        bonus_skipped: true,
        new_balance: existingUser.balance_petals,
      })
    }

    const { data: creditResult, error: creditError } = await admin.rpc('credit_petals_with_lot', {
      p_user_id: auth.user.id,
      p_amount: AGE_CONFIRMATION_BONUS,
      p_type: 'bonus',
      p_source_type: AGE_CONFIRMATION_SOURCE,
      p_idempotency_key: idempotencyKey,
      p_source_id: null,
      p_ref_id: null,
      p_eligible_for_creator_payout: false,
      p_eligible_for_agency_commission: false,
      p_expires_at: null,
      p_metadata: {
        source_type: AGE_CONFIRMATION_SOURCE,
        confirmed_at: now,
        eligible_for_creator_payout: false,
        eligible_for_agency_commission: false,
      },
    })

    if (creditError || !creditResult?.success) {
      if (creditError) {
        console.error('[/api/auth/idade] credit_petals_with_lot', creditError)
      }

      return NextResponse.json({
        success: false,
        error: creditResult?.error ?? 'Erro ao creditar bonus de idade',
        code: creditResult?.code ?? 'AGE_CONFIRMATION_BONUS_FAILED',
      }, { status: statusForCreditResult(creditResult) })
    }

    const updatePayload: Record<string, unknown> = {
      age_confirmed: true,
      age_confirmed_at: now,
    }

    if (auth.user.email) {
      updatePayload.email = auth.user.email
    }

    const { error: updateError } = await admin
      .from('users')
      .update(updatePayload)
      .eq('id', auth.user.id)

    if (updateError) {
      console.error('[/api/auth/idade] users update', updateError)

      return NextResponse.json({
        success: false,
        error: 'Bonus creditado, mas houve erro ao confirmar idade. Tente novamente.',
        code: 'AGE_CONFIRMATION_UPDATE_FAILED',
        new_balance: creditResult.new_balance,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      age_confirmed: true,
      petals_credited: AGE_CONFIRMATION_BONUS,
      new_balance: creditResult.new_balance,
      idempotent_replay: Boolean(creditResult.idempotent_replay),
      lot_id: creditResult.lot_id,
      transaction_id: creditResult.transaction_id,
    })
  } catch (err) {
    console.error('[/api/auth/idade]', err)

    return NextResponse.json({
      success: false,
      error: 'Erro interno',
    }, { status: 500 })
  }
}

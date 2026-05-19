import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/auth/api-auth'
import { createAdminClient } from '@/lib/supabase/server'

type PayoutAction = 'approve' | 'paid' | 'reject' | 'block'

type PayoutActionBody = {
  payout_id?: string
  action?: string
  review_notes?: string
  rejection_reason?: string
}

const ALLOWED_ACTIONS: PayoutAction[] = ['approve', 'paid', 'reject', 'block']

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)

  if (auth.ok === false) {
    return auth.response
  }

  let body: PayoutActionBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Body invalido' },
      { status: 400 }
    )
  }

  const payoutId = body.payout_id?.trim()
  const action = body.action as PayoutAction
  const reviewNotes = body.review_notes?.trim() || null
  const rejectionReason = body.rejection_reason?.trim() || null

  if (!payoutId) {
    return NextResponse.json(
      { success: false, error: 'payout_id obrigatorio' },
      { status: 400 }
    )
  }

  if (!ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json(
      { success: false, error: 'action invalida' },
      { status: 400 }
    )
  }

  if ((action === 'reject' || action === 'block') && !rejectionReason) {
    return NextResponse.json(
      { success: false, error: 'rejection_reason obrigatorio' },
      { status: 400 }
    )
  }

  const admin = createAdminClient() as any

  const rpcPayload = {
    p_payout_id: payoutId,
    p_admin_user_id: auth.user.id,
    p_review_notes: reviewNotes,
  }

  const rpcResult =
    action === 'approve'
      ? await admin.rpc('approve_payout', rpcPayload)
      : action === 'paid'
        ? await admin.rpc('mark_payout_paid', rpcPayload)
        : action === 'reject'
          ? await admin.rpc('reject_payout', {
              ...rpcPayload,
              p_rejection_reason: rejectionReason,
            })
          : await admin.rpc('block_payout', {
              ...rpcPayload,
              p_rejection_reason: rejectionReason,
            })

  if (rpcResult.error) {
    console.error('[admin/payouts]', rpcResult.error)

    return NextResponse.json(
      { success: false, error: 'Falha ao processar saque' },
      { status: 500 }
    )
  }

  const result = rpcResult.data as { success?: boolean; error?: string } | null

  if (result?.success === false) {
    return NextResponse.json(
      { success: false, error: result.error ?? 'Acao recusada' },
      { status: 400 }
    )
  }

  return NextResponse.json({ success: true, data: rpcResult.data })
}

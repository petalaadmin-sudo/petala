// app/api/chat/minuto/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { NextRequest, NextResponse } from 'next/server'

type ChatBillingResult = {
  success?: boolean
  error?: string
  code?: string
  session_ended?: boolean
  required?: number
  current_balance?: number
  petals_charged?: number
}

function statusForBillingResult(result: ChatBillingResult | null) {
  if (!result) return 500
  if (result.code === 'INSUFFICIENT_BALANCE') return 402
  if (result.code === 'UNAUTHORIZED') return 403
  if (result.code === 'INVALID_SESSION') return 404
  if (result.code === 'SESSION_ENDED') return 409
  return 400
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.ok) {
      return auth.response
    }

    const { session_id } = await request.json()

    if (!session_id) {
      return NextResponse.json({ error: 'session_id obrigatorio' }, { status: 400 })
    }

    const admin = createAdminClient() as any
    const { data, error } = await admin.rpc('charge_chat_text_due_minutes', {
      p_session_id: session_id,
      p_user_id: auth.user.id,
    })

    const result = (data ?? null) as ChatBillingResult | null

    if (error || !result?.success) {
      if (error) {
        console.error('[/api/chat/minuto] charge_chat_text_due_minutes', error)
      }

      return NextResponse.json({
        error: result?.error ?? 'Falha ao cobrar minuto do chat',
        code: result?.code ?? 'CHAT_BILLING_FAILED',
        session_ended: Boolean(result?.session_ended),
        required: result?.required,
        current: result?.current_balance,
        petals_charged: result?.petals_charged,
      }, { status: statusForBillingResult(result) })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/chat/minuto]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

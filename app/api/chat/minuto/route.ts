// app/api/chat/minuto/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { NextRequest, NextResponse } from 'next/server'

type ChatBillingResult = {
  success?: boolean
  error?: string
  code?: string
  session_ended?: boolean
  new_balance?: number
  required?: number
  current_balance?: number
  duration_seconds?: number
  paid_until_seconds?: number
  effective_ended_at?: string
  petals_charged?: number
}

function billingRpcForType(type: string | null | undefined) {
  if (type === 'text') return 'charge_chat_text_due_minutes'
  if (type === 'video') return 'charge_chat_video_due_minutes'
  return null
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
    const { data: session, error: sessionError } = await admin
      .from('chat_sessions')
      .select('id, user_id, type, status, ended_at, duration_seconds, petals_charged')
      .eq('id', session_id)
      .single()

    if (sessionError || !session) {
      if (sessionError) {
        console.error('[/api/chat/minuto] chat_sessions lookup', sessionError)
      }

      return NextResponse.json({
        error: 'Sessao invalida',
        code: 'INVALID_SESSION',
      }, { status: 404 })
    }

    if (session.user_id !== auth.user.id) {
      return NextResponse.json({
        error: 'Usuario nao autorizado para esta sessao',
        code: 'UNAUTHORIZED',
      }, { status: 403 })
    }

    if (session.ended_at) {
      return NextResponse.json({
        error: 'Sessao ja encerrada',
        code: 'SESSION_ENDED',
        session_ended: true,
        duration_seconds: session.duration_seconds,
        petals_charged: session.petals_charged,
      }, { status: 409 })
    }

    if (session.status !== 'active') {
      return NextResponse.json({
        error: 'Sessao ainda nao esta ativa',
        code: 'SESSION_NOT_ACTIVE',
        status: session.status,
      }, { status: 409 })
    }

    const { error: heartbeatError } = await admin
      .from('chat_sessions')
      .update({ last_heartbeat_at: new Date().toISOString() })
      .eq('id', session_id)
      .is('ended_at', null)

    if (heartbeatError) {
      console.error('[/api/chat/minuto] heartbeat update', heartbeatError)
    }

    const billingRpc = billingRpcForType(session.type)

    if (!billingRpc) {
      return NextResponse.json({
        error: 'Tipo de sessao invalido',
        code: 'INVALID_SESSION_TYPE',
      }, { status: 400 })
    }

    const { data, error } = await admin.rpc(billingRpc, {
      p_session_id: session_id,
      p_user_id: auth.user.id,
    })

    const result = (data ?? null) as ChatBillingResult | null

    if (error || !result?.success) {
      if (error) {
        console.error(`[/api/chat/minuto] ${billingRpc}`, error)
      }

      return NextResponse.json({
        error: result?.error ?? 'Falha ao cobrar minuto do chat',
        code: result?.code ?? 'CHAT_BILLING_FAILED',
        session_ended: Boolean(result?.session_ended),
        required: result?.required,
        current: result?.current_balance,
        current_balance: result?.current_balance,
        duration_seconds: result?.duration_seconds,
        paid_until_seconds: result?.paid_until_seconds,
        effective_ended_at: result?.effective_ended_at,
        petals_charged: result?.petals_charged,
      }, { status: statusForBillingResult(result) })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/chat/minuto]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

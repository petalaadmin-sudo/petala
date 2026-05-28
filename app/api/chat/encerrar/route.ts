// app/api/chat/encerrar/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { NextRequest, NextResponse } from 'next/server'

type ChatBillingResult = {
  success?: boolean
  error?: string
  code?: string
  session_ended?: boolean
  duration_seconds?: number
  paid_until_seconds?: number
  effective_ended_at?: string
  petals_charged?: number
  required?: number
  current_balance?: number
}

function billingRpcForType(type: string | null | undefined) {
  if (type === 'text') return 'charge_chat_text_due_minutes'
  if (type === 'video') return 'charge_chat_video_due_minutes'
  return null
}

function billingFailureResponse(result: ChatBillingResult | null) {
  const status =
    result?.code === 'INSUFFICIENT_BALANCE' ? 402 :
    result?.code === 'UNAUTHORIZED' ? 403 :
    result?.code === 'INVALID_SESSION' ? 404 :
    result?.code === 'SESSION_ENDED' ? 409 :
    400

  return NextResponse.json({
    error: result?.error ?? 'Falha ao cobrar minutos pendentes',
    code: result?.code ?? 'CHAT_BILLING_FAILED',
    session_ended: Boolean(result?.session_ended),
    duration_seconds: result?.duration_seconds,
    paid_until_seconds: result?.paid_until_seconds,
    effective_ended_at: result?.effective_ended_at,
    petals_charged: result?.petals_charged,
    required: result?.required,
    current: result?.current_balance,
    current_balance: result?.current_balance,
  }, { status })
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.ok) {
      return auth.response
    }

    const user = auth.user
    const { session_id, rating, rating_comment, cleanup_unpaid } = await request.json()

    if (!session_id) {
      return NextResponse.json({ error: 'session_id obrigatorio' }, { status: 400 })
    }

    const admin = createAdminClient() as any

    const { data: session } = await admin
      .from('chat_sessions')
      .select('*, creators!inner(user_id)')
      .eq('id', session_id)
      .is('ended_at', null)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Sessao nao encontrada ou ja encerrada' }, { status: 404 })
    }

    const isUser = session.user_id === user.id
    const isCreator = session.creators.user_id === user.id

    if (!isUser && !isCreator) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
    }

    if (session.status !== 'active') {
      return NextResponse.json({
        error: 'Sessao ainda nao esta ativa',
        code: 'SESSION_NOT_ACTIVE',
        status: session.status,
      }, { status: 409 })
    }

    if (
      cleanup_unpaid === true &&
      isUser &&
      session.type === 'video' &&
      Number(session.petals_charged ?? 0) === 0
    ) {
      const now = new Date().toISOString()

      const { data: updatedSession, error: updateError } = await admin
        .from('chat_sessions')
        .update({
          ended_at: now,
          duration_seconds: 0,
        })
        .eq('id', session_id)
        .is('ended_at', null)
        .select('duration_seconds, petals_charged')
        .single()

      if (updateError || !updatedSession) {
        throw new Error('Falha ao limpar sessao de video: ' + updateError?.message)
      }

      await admin
        .from('creator_presence')
        .update({ in_session: false })
        .eq('creator_id', session.creator_id)

      await admin.from('chat_messages').insert({
        session_id,
        sender_id: user.id,
        sender_role: 'system',
        content: 'Video encerrado sem cobranca confirmada',
        type: 'system',
      })

      const { data: balanceData } = await admin
        .from('users')
        .select('balance_petals')
        .eq('id', session.user_id)
        .single()

      return NextResponse.json({
        session_id,
        duration_seconds: updatedSession.duration_seconds,
        petals_charged: updatedSession.petals_charged,
        new_balance: balanceData?.balance_petals,
        cleanup_unpaid: true,
      })
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
      p_user_id: session.user_id,
    })

    const billingResult = (data ?? null) as ChatBillingResult | null

    if (error || !billingResult?.success) {
      if (error) {
        console.error(`[/api/chat/encerrar] ${billingRpc}`, error)
      }

      return billingFailureResponse(billingResult)
    }

    const now = new Date().toISOString()
    const durationSeconds = Math.floor(
      (new Date(now).getTime() - new Date(session.started_at).getTime()) / 1000
    )

    const { data: updatedSession, error: updateError } = await admin
      .from('chat_sessions')
      .update({
        ended_at: now,
        duration_seconds: durationSeconds,
        ...(isUser && rating ? { rating, rating_comment: rating_comment ?? null } : {}),
      })
      .eq('id', session_id)
      .is('ended_at', null)
      .select('duration_seconds, petals_charged')
      .single()

    if (updateError || !updatedSession) {
      throw new Error('Falha ao encerrar sessao: ' + updateError?.message)
    }

    if (isUser && rating) {
      const { data: creator } = await admin
        .from('creators')
        .select('rating, rating_count')
        .eq('id', session.creator_id)
        .single()

      if (creator) {
        const newCount = creator.rating_count + 1
        const newRating = ((creator.rating * creator.rating_count) + rating) / newCount

        await admin
          .from('creators')
          .update({ rating: newRating, rating_count: newCount })
          .eq('id', session.creator_id)
      }
    }

    await admin
      .from('creator_presence')
      .update({ in_session: false })
      .eq('creator_id', session.creator_id)

    await admin.from('chat_messages').insert({
      session_id,
      sender_id: user.id,
      sender_role: 'system',
      content: `Chat encerrado - ${Math.floor(durationSeconds / 60)}min ${durationSeconds % 60}s - ${updatedSession.petals_charged} petalas usadas`,
      type: 'system',
    })

    const { data: balanceData } = await admin
      .from('users')
      .select('balance_petals')
      .eq('id', session.user_id)
      .single()

    return NextResponse.json({
      session_id,
      duration_seconds: updatedSession.duration_seconds,
      paid_until_seconds: billingResult?.paid_until_seconds,
      effective_ended_at: billingResult?.effective_ended_at,
      petals_charged: updatedSession.petals_charged,
      new_balance: balanceData?.balance_petals,
    })
  } catch (err) {
    console.error('[/api/chat/encerrar]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

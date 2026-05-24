// app/api/chat/iniciar/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { NextRequest, NextResponse } from 'next/server'

type ChatBillingResult = {
  success?: boolean
  error?: string
  code?: string
  session_ended?: boolean
  new_balance?: number
  petals_charged?: number
  required?: number
  current_balance?: number
}

function billingFailureResponse(result: ChatBillingResult) {
  const status = result.code === 'INSUFFICIENT_BALANCE' ? 402 : 400

  return NextResponse.json({
    error: result.error ?? 'Falha ao cobrar chat',
    code: result.code ?? 'CHAT_BILLING_FAILED',
    session_ended: Boolean(result.session_ended),
    required: result.required,
    current: result.current_balance,
    petals_charged: result.petals_charged,
  }, { status })
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.ok) {
      return auth.response
    }

    const user = auth.user
    const { creator_id, type = 'text' } = await request.json()
    const sessionType = type === 'video' ? 'video' : type === 'text' ? 'text' : null

    if (!creator_id) {
      return NextResponse.json({ error: 'creator_id obrigatorio' }, { status: 400 })
    }

    if (!sessionType) {
      return NextResponse.json({
        error: 'Tipo de sessao invalido',
        code: 'INVALID_SESSION_TYPE',
      }, { status: 400 })
    }

    const admin = createAdminClient() as any
    const textFirstMinutePrice = 10
    const textNextMinutePrice = 50
    const videoPricePerMinute = 120

    const { data: creator } = await admin
      .from('creators')
      .select('id, user_id, active')
      .eq('id', creator_id)
      .eq('active', true)
      .single()

    if (!creator) {
      return NextResponse.json({ error: 'Criadora nao encontrada' }, { status: 404 })
    }

    if (creator.user_id === user.id) {
      return NextResponse.json({ error: 'Voce nao pode iniciar chat com voce mesmo' }, { status: 400 })
    }

    const { data: presence } = await admin
      .from('creator_presence')
      .select('online, in_session')
      .eq('creator_id', creator_id)
      .single()

    if (!presence?.online) {
      return NextResponse.json({ error: 'Criadora esta offline no momento' }, { status: 409 })
    }

    const pricePerMin = sessionType === 'video'
      ? videoPricePerMinute
      : textNextMinutePrice
    const initialRequiredBalance = sessionType === 'text'
      ? textFirstMinutePrice
      : videoPricePerMinute

    const { data: userData } = await admin
      .from('users')
      .select('balance_petals')
      .eq('id', user.id)
      .single()

    if (!userData || userData.balance_petals < initialRequiredBalance) {
      return NextResponse.json({
        error: 'Saldo insuficiente',
        required: initialRequiredBalance,
        current: userData?.balance_petals ?? 0,
        code: 'INSUFFICIENT_BALANCE',
      }, { status: 402 })
    }

    const { data: activeSession } = await admin
      .from('chat_sessions')
      .select('id')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .single()

    if (activeSession) {
      return NextResponse.json({
        error: 'Voce ja tem uma sessao ativa',
        session_id: activeSession.id,
      }, { status: 409 })
    }

    const { data: session, error: sessionError } = await admin
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        creator_id,
        type: sessionType,
      })
      .select()
      .single()

    if (sessionError || !session) {
      throw new Error('Falha ao criar sessao: ' + sessionError?.message)
    }

    let billingResult: ChatBillingResult | null = null

    if (sessionType === 'text') {
      const { data, error } = await admin.rpc('charge_chat_text_due_minutes', {
        p_session_id: session.id,
        p_user_id: user.id,
      })

      billingResult = (data ?? null) as ChatBillingResult | null

      if (error || !billingResult?.success) {
        await admin
          .from('chat_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', session.id)
          .is('ended_at', null)

        if (error) {
          console.error('[/api/chat/iniciar] charge_chat_text_due_minutes', error)
        }

        return billingFailureResponse(billingResult ?? {
          error: 'Falha ao cobrar primeiro minuto',
          code: 'CHAT_BILLING_FAILED',
        })
      }
    }

    await admin
      .from('creator_presence')
      .update({ in_session: true })
      .eq('creator_id', creator_id)

    await admin.from('chat_messages').insert({
      session_id: session.id,
      sender_id: user.id,
      sender_role: 'system',
      content: sessionType === 'text'
        ? 'Chat iniciado - 10 petalas no primeiro minuto - depois 50 petalas/min'
        : `Chat iniciado - ${pricePerMin} petalas/min`,
      type: 'system',
    })

    const response: Record<string, unknown> = {
      session_id: session.id,
      type: session.type,
      price_per_min: pricePerMin,
      started_at: session.started_at,
    }

    if (sessionType === 'text') {
      response.first_minute_price = textFirstMinutePrice
      response.new_balance = billingResult?.new_balance
      response.petals_charged = billingResult?.petals_charged
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[/api/chat/iniciar]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

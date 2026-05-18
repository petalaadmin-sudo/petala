// app/api/chat/iniciar/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.ok) {
      return auth.response
    }

    const user = auth.user

    const { creator_id, type = 'text' } = await request.json()
    if (!creator_id) return NextResponse.json({ error: 'creator_id obrigatório' }, { status: 400 })

    const admin = createAdminClient()
    const textFirstMinutePrice = 10
    const textNextMinutePrice = 50

    // 1. Busca criadora e verifica se está ativa e online
    const { data: creator } = await admin
      .from('creators')
      .select('id, user_id, price_text_petals, price_video_petals, active')
      .eq('id', creator_id)
      .eq('active', true)
      .single()

    if (!creator) return NextResponse.json({ error: 'Criadora não encontrada' }, { status: 404 })

    // Não permite chat consigo mesmo
    if (creator.user_id === user.id) {
      return NextResponse.json({ error: 'Você não pode iniciar chat com você mesmo' }, { status: 400 })
    }

    // 2. Verifica presença online
    const { data: presence } = await admin
      .from('creator_presence')
      .select('online, in_session')
      .eq('creator_id', creator_id)
      .single()

    if (!presence?.online) {
      return NextResponse.json({ error: 'Criadora está offline no momento' }, { status: 409 })
    }

    // 3. Verifica saldo mínimo
    const pricePerMin = type === 'video'
      ? creator.price_video_petals
      : textNextMinutePrice
    const minBalance = type === 'text' ? textFirstMinutePrice : pricePerMin * 5

    const { data: userData } = await admin
      .from('users')
      .select('balance_petals')
      .eq('id', user.id)
      .single()

    if (!userData || userData.balance_petals < minBalance) {
      return NextResponse.json({
        error: 'Saldo insuficiente',
        required: minBalance,
        current: userData?.balance_petals ?? 0,
        code: 'INSUFFICIENT_BALANCE',
      }, { status: 402 })
    }

    // 4. Verifica sessão ativa existente (só uma por vez)
    const { data: activeSession } = await admin
      .from('chat_sessions')
      .select('id')
      .eq('user_id', user.id)
      .is('ended_at', null)
      .single()

    if (activeSession) {
      return NextResponse.json({ error: 'Você já tem uma sessão ativa', session_id: activeSession.id }, { status: 409 })
    }

    // 5. Cria a sessão
    const { data: session, error: sessionError } = await admin
      .from('chat_sessions')
      .insert({
        user_id:    user.id,
        creator_id: creator_id,
        type:       type,
      })
      .select()
      .single()

    if (sessionError || !session) {
      throw new Error('Falha ao criar sessão: ' + sessionError?.message)
    }

    if (type === 'text') {
      const { data: spendResult } = await admin.rpc('spend_petals', {
        p_user_id: user.id,
        p_amount: textFirstMinutePrice,
        p_type: 'spend',
        p_ref_id: session.id,
        p_idempotency_key: `chat_text_start:debit:${session.id}`,
      })

      if (!spendResult?.success) {
        await admin
          .from('chat_sessions')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', session.id)

        await admin
          .from('creator_presence')
          .update({ in_session: false })
          .eq('creator_id', creator_id)

        return NextResponse.json({
          error: 'Saldo insuficiente',
          required: textFirstMinutePrice,
          current: userData?.balance_petals ?? 0,
          code: 'INSUFFICIENT_BALANCE',
        }, { status: 402 })
      }

      const creatorEarn = Math.floor(textFirstMinutePrice * 0.7)
      await admin.rpc('credit_petals', {
        p_user_id: creator.user_id,
        p_amount: creatorEarn,
        p_type: 'gift_received',
        p_ref_id: session.id,
        p_idempotency_key: `chat_text_start:credit:${session.id}`,
      })

      await admin
        .from('chat_sessions')
        .update({ petals_charged: textFirstMinutePrice })
        .eq('id', session.id)
    }

    // 6. Marca criadora como in_session
    await admin
      .from('creator_presence')
      .update({ in_session: true })
      .eq('creator_id', creator_id)

    // 7. Insere mensagem de sistema para iniciar o chat
    await admin.from('chat_messages').insert({
      session_id:  session.id,
      sender_id:   user.id,
      sender_role: 'system',
      content:     type === 'text'
        ? 'Chat iniciado · 10 🌸 no primeiro minuto · depois 50 🌸/min'
        : `Chat iniciado · ${pricePerMin} 🌸/min`,
      type:        'system',
    })

    const response: Record<string, unknown> = {
      session_id:    session.id,
      type:          session.type,
      price_per_min: pricePerMin,
      started_at:    session.started_at,
    }

    if (type === 'text') {
      response.first_minute_price = textFirstMinutePrice
    }

    return NextResponse.json(response)

  } catch (err) {
    console.error('[/api/chat/iniciar]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

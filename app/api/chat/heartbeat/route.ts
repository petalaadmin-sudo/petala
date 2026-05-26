import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.ok) {
      return auth.response
    }

    const { session_id } = await request.json()

    if (!session_id) {
      return NextResponse.json({
        error: 'session_id obrigatorio',
        code: 'SESSION_ID_REQUIRED',
      }, { status: 400 })
    }

    const admin = createAdminClient() as any
    const { data: session, error: sessionError } = await admin
      .from('chat_sessions')
      .select('id, user_id, creator_id, type, ended_at, duration_seconds, petals_charged, last_heartbeat_at, creators!inner(user_id)')
      .eq('id', session_id)
      .maybeSingle()

    if (sessionError) {
      console.error('[/api/chat/heartbeat] chat_sessions lookup', sessionError)
      return NextResponse.json({
        error: 'Erro ao validar sessao',
        code: 'SESSION_LOOKUP_FAILED',
      }, { status: 500 })
    }

    if (!session) {
      return NextResponse.json({
        error: 'Sessao nao encontrada',
        code: 'SESSION_NOT_FOUND',
      }, { status: 404 })
    }

    const isUser = session.user_id === auth.user.id
    const isCreator = session.creators?.user_id === auth.user.id

    if (!isUser && !isCreator) {
      return NextResponse.json({
        error: 'Nao autorizado',
        code: 'UNAUTHORIZED',
      }, { status: 403 })
    }

    if (session.ended_at) {
      return NextResponse.json({
        success: false,
        error: 'Sessao ja encerrada',
        code: 'SESSION_ENDED',
        session_ended: true,
        duration_seconds: session.duration_seconds,
        petals_charged: session.petals_charged,
      }, { status: 409 })
    }

    const now = new Date().toISOString()
    const { data: updatedSession, error: updateError } = await admin
      .from('chat_sessions')
      .update({ last_heartbeat_at: now })
      .eq('id', session_id)
      .is('ended_at', null)
      .select('id, type, last_heartbeat_at, duration_seconds, petals_charged')
      .single()

    if (updateError || !updatedSession) {
      console.error('[/api/chat/heartbeat] heartbeat update', updateError)
      return NextResponse.json({
        error: 'Falha ao atualizar heartbeat',
        code: 'HEARTBEAT_UPDATE_FAILED',
      }, { status: 500 })
    }

    let newBalance: number | undefined

    if (isUser) {
      const { data: balanceData } = await admin
        .from('users')
        .select('balance_petals')
        .eq('id', session.user_id)
        .single()

      newBalance = balanceData?.balance_petals
    }

    return NextResponse.json({
      success: true,
      session_id: updatedSession.id,
      type: updatedSession.type,
      last_heartbeat_at: updatedSession.last_heartbeat_at,
      duration_seconds: updatedSession.duration_seconds,
      petals_charged: updatedSession.petals_charged,
      new_balance: newBalance,
    })
  } catch (err) {
    console.error('[/api/chat/heartbeat]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

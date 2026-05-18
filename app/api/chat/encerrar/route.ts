// app/api/chat/encerrar/route.ts
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

    const { session_id, rating, rating_comment } = await request.json()
    if (!session_id) return NextResponse.json({ error: 'session_id obrigatório' }, { status: 400 })

    const admin = createAdminClient()

    // Busca sessão — valida que o usuário é participante
    const { data: session } = await admin
      .from('chat_sessions')
      .select('*, creators!inner(user_id)')
      .eq('id', session_id)
      .is('ended_at', null)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Sessão não encontrada ou já encerrada' }, { status: 404 })
    }

    // Valida que é participante (usuário ou criadora)
    const isUser    = session.user_id === user.id
    const isCreator = session.creators.user_id === user.id
    if (!isUser && !isCreator) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    const now = new Date().toISOString()
    const durationSeconds = Math.floor(
      (new Date(now).getTime() - new Date(session.started_at).getTime()) / 1000
    )

    // Encerra a sessão
    await admin
      .from('chat_sessions')
      .update({
        ended_at:         now,
        duration_seconds: durationSeconds,
        ...(isUser && rating ? { rating, rating_comment: rating_comment ?? null } : {}),
      })
      .eq('id', session_id)

    // Atualiza rating da criadora (média ponderada simples)
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

    // Libera presença da criadora
    await admin
      .from('creator_presence')
      .update({ in_session: false })
      .eq('creator_id', session.creator_id)

    // Insere mensagem de sistema de encerramento
    await admin.from('chat_messages').insert({
      session_id:  session_id,
      sender_id:   user.id,
      sender_role: 'system',
      content:     `Chat encerrado · ${Math.floor(durationSeconds / 60)}min ${durationSeconds % 60}s · ${session.petals_charged} 🌸 usados`,
      type:        'system',
    })

    return NextResponse.json({
      session_id,
      duration_seconds: durationSeconds,
      petals_charged:   session.petals_charged,
    })

  } catch (err) {
    console.error('[/api/chat/encerrar]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

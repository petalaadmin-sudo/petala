// app/api/chat/mensagem/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { NextRequest, NextResponse } from 'next/server'

// Tipos de presente disponíveis
const GIFT_CATALOG: Record<string, { emoji: string; petals: number }> = {
  heart:    { emoji: '❤️',  petals: 5   },
  rose:     { emoji: '🌹',  petals: 15  },
  cake:     { emoji: '🎂',  petals: 30  },
  teddy:    { emoji: '🧸',  petals: 50  },
  diamond:  { emoji: '💎',  petals: 100 },
  star:     { emoji: '🌟',  petals: 150 },
  rocket:   { emoji: '🚀',  petals: 200 },
  trophy:   { emoji: '🏆',  petals: 300 },
  crown:    { emoji: '👑',  petals: 500 },
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.ok) {
      return auth.response
    }

    const user = auth.user

    const { session_id, content, type = 'text', gift_type, client_request_id } = await request.json()

    if (!session_id) return NextResponse.json({ error: 'session_id obrigatório' }, { status: 400 })
    if (!content && type === 'text') return NextResponse.json({ error: 'content obrigatório' }, { status: 400 })

    const admin = createAdminClient()

    // Verifica que a sessão existe e o usuário é participante
    const { data: session } = await admin
      .from('chat_sessions')
      .select('*, creators!inner(id, user_id)')
      .eq('id', session_id)
      .is('ended_at', null)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Sessão inválida ou encerrada' }, { status: 404 })
    }

    const isUser    = session.user_id === user.id
    const isCreator = session.creators.user_id === user.id
    if (!isUser && !isCreator) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
    }

    if (session.status !== 'active') {
      return NextResponse.json({
        error: 'Sessao ainda nao esta ativa',
        code: 'SESSION_NOT_ACTIVE',
        status: session.status,
      }, { status: 409 })
    }

    // ── Mensagem de texto simples ──────────────────────────────
    if (type === 'text') {
      const sanitized = content.trim().slice(0, 2000)
      if (!sanitized) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })

      const { data: msg } = await admin
        .from('chat_messages')
        .insert({
          session_id,
          sender_id:   user.id,
          sender_role: isUser ? 'user' : 'creator',
          content:     sanitized,
          type:        'text',
        })
        .select()
        .single()

      return NextResponse.json({ message: msg })
    }

    // ── Presente ──────────────────────────────────────────────
    if (type === 'gift') {
      if (!isUser) {
        return NextResponse.json({ error: 'Apenas usuários podem enviar presentes' }, { status: 403 })
      }

      const gift = GIFT_CATALOG[gift_type]
      if (!gift) {
        return NextResponse.json({ error: `Tipo de presente inválido: ${gift_type}` }, { status: 400 })
      }

      const giftRequestId = client_request_id || crypto.randomUUID()
      const idempotencyKey = `gift:${session_id}:${user.id}:${giftRequestId}`

      // Envia presente via RPC atomica (debita lotes, registra gift e mensagem)
      const { data: giftResult } = await admin.rpc('send_gift', {
        p_from_user:   user.id,
        p_to_creator:  session.creators.id,
        p_gift_type:   gift_type,
        p_gift_emoji:  gift.emoji,
        p_petals:      gift.petals,
        p_session_id:  session_id,
        p_idempotency_key: idempotencyKey,
      })

      if (!giftResult?.success) {
        const code = giftResult?.code ?? 'GIFT_FAILED'
        const status =
          code === 'INSUFFICIENT_BALANCE' ? 402 :
          code === 'SESSION_ENDED' ? 409 :
          code === 'UNAUTHORIZED' ? 403 :
          code === 'IDEMPOTENCY_KEY_CONFLICT' ? 409 :
          400

        return NextResponse.json({
          error: giftResult?.error ?? 'Falha ao enviar presente',
          code,
          required: giftResult?.required,
          available_petals: giftResult?.available_petals,
          new_balance: giftResult?.new_balance,
        }, { status })
      }

      const { data: msg } = await admin
        .from('chat_messages')
        .select()
        .eq('id', giftResult.message_id)
        .single()

      return NextResponse.json({
        message:    msg,
        gift_id:    giftResult.gift_id,
        new_balance: giftResult.new_balance,
        eligible_petals_spent: giftResult.eligible_petals_spent,
        non_eligible_petals_spent: giftResult.non_eligible_petals_spent,
        agency_eligible_petals_spent: giftResult.agency_eligible_petals_spent,
      })
    }

    return NextResponse.json({ error: `Tipo inválido: ${type}` }, { status: 400 })

  } catch (err) {
    console.error('[/api/chat/mensagem]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

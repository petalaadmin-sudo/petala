// app/api/chat/mensagem/route.ts
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { session_id, content, type = 'text', gift_type } = await request.json()

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

      // Envia presente via RPC atômica (débita usuário + credita criadora)
      const { data: giftResult } = await admin.rpc('send_gift', {
        p_from_user:   user.id,
        p_to_creator:  session.creators.id,
        p_gift_type:   gift_type,
        p_gift_emoji:  gift.emoji,
        p_petals:      gift.petals,
        p_session_id:  session_id,
      })

      if (!giftResult?.success) {
        return NextResponse.json({
          error: giftResult?.error ?? 'Falha ao enviar presente',
          code: 'GIFT_FAILED',
        }, { status: 402 })
      }

      // Insere mensagem de presente no chat
      const { data: msg } = await admin
        .from('chat_messages')
        .insert({
          session_id,
          sender_id:   user.id,
          sender_role: 'user',
          content:     `enviou um presente ${gift.emoji}`,
          type:        'gift',
          gift_emoji:  gift.emoji,
          gift_petals: gift.petals,
        })
        .select()
        .single()

      return NextResponse.json({
        message:    msg,
        gift_id:    giftResult.gift_id,
        new_balance: giftResult.new_balance,
      })
    }

    return NextResponse.json({ error: `Tipo inválido: ${type}` }, { status: 400 })

  } catch (err) {
    console.error('[/api/chat/mensagem]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

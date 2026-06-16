import { requireCreatorAreaApi } from '@/lib/auth/require-creator-area-api'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const creatorAuth = await requireCreatorAreaApi(request)

    if (!creatorAuth.ok) {
      return creatorAuth.response
    }

    const { admin, creator } = creatorAuth

    await admin.rpc('expire_pending_chat_requests')

    const { data: requests, error: requestsError } = await admin
      .from('chat_sessions')
      .select('id, user_id, creator_id, type, status, requested_at, request_expires_at, started_at')
      .eq('creator_id', creator.id)
      .is('ended_at', null)
      .in('status', ['pending_creator_acceptance', 'requested'])
      .order('requested_at', { ascending: true })
      .limit(100)

    if (requestsError) {
      console.error('[/api/chat/solicitacoes GET] requests lookup', requestsError)
      return NextResponse.json({ error: 'Erro ao listar solicitações' }, { status: 500 })
    }

    const userIds = Array.from(new Set((requests ?? []).map((item: any) => item.user_id).filter(Boolean)))
    let usersById = new Map<string, { id: string; email: string | null; username: string | null }>()

    if (userIds.length > 0) {
      const { data: users, error: usersError } = await admin
        .from('users')
        .select('id, email, username')
        .in('id', userIds)

      if (usersError) {
        console.error('[/api/chat/solicitacoes GET] users lookup', usersError)
      } else {
        usersById = new Map((users ?? []).map((user: any) => [user.id, user]))
      }
    }

    return NextResponse.json({
      success: true,
      requests: (requests ?? []).map((item: any) => ({
        ...item,
        user: usersById.get(item.user_id) ?? null,
      })),
    })
  } catch (err) {
    console.error('[/api/chat/solicitacoes GET]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({
    success: false,
    code: 'CHAT_REQUESTS_NOT_READY',
    error: 'Solicitações de chat estão em preparação.',
  }, { status: 423 })
}

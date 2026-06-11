import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { requireCreatorAreaApi } from '@/lib/auth/require-creator-area-api'
import { NextRequest, NextResponse } from 'next/server'

type RpcResult = {
  success?: boolean
  error?: string
  code?: string
  [key: string]: unknown
}

function statusForRpcResult(result: RpcResult | null) {
  if (!result) return 500
  if (result.code === 'UNAUTHORIZED') return 403
  if (result.code === 'USER_NOT_FOUND' || result.code === 'CREATOR_NOT_FOUND') return 404
  if (
    result.code === 'OPEN_SESSION_EXISTS' ||
    result.code === 'IDEMPOTENCY_KEY_CONFLICT' ||
    result.code === 'CREATOR_INACTIVE' ||
    result.code === 'CREATOR_NOT_VERIFIED' ||
    result.code === 'SELF_CHAT_NOT_ALLOWED'
  ) return 409
  return 400
}

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
      return NextResponse.json({ error: 'Erro ao listar solicitacoes' }, { status: 500 })
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

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json()
    const creatorId = body.creator_id
    const sessionType = body.type === 'video' ? 'video' : body.type === 'text' ? 'text' : null

    if (!creatorId) {
      return NextResponse.json({ error: 'creator_id obrigatorio' }, { status: 400 })
    }

    if (!sessionType) {
      return NextResponse.json({
        error: 'Tipo de sessao invalido',
        code: 'INVALID_SESSION_TYPE',
      }, { status: 400 })
    }

    const idempotencyKey =
      typeof body.idempotency_key === 'string' && body.idempotency_key.trim()
        ? body.idempotency_key.trim()
        : typeof body.client_request_id === 'string' && body.client_request_id.trim()
          ? `chat_request:${auth.user.id}:${body.client_request_id.trim()}`
          : null

    const admin = createAdminClient() as any
    const { data, error } = await admin.rpc('create_chat_request', {
      p_user_id: auth.user.id,
      p_creator_id: creatorId,
      p_type: sessionType,
      p_expires_in_seconds: Number.isFinite(Number(body.expires_in_seconds))
        ? Number(body.expires_in_seconds)
        : 45,
      p_idempotency_key: idempotencyKey,
    })

    const result = (data ?? null) as RpcResult | null

    if (error || !result?.success) {
      if (error) {
        console.error('[/api/chat/solicitacoes POST] create_chat_request', error)
      }

      return NextResponse.json({
        success: false,
        error: result?.error ?? 'Falha ao criar solicitacao',
        code: result?.code ?? 'CREATE_CHAT_REQUEST_FAILED',
        ...(result ?? {}),
      }, { status: statusForRpcResult(result) })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/chat/solicitacoes POST]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

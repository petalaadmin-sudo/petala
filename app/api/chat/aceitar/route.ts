import { NextRequest, NextResponse } from 'next/server'
import { requireCreatorAreaApi } from '@/lib/auth/require-creator-area-api'

type RpcResult = {
  success?: boolean
  error?: string
  code?: string
  [key: string]: unknown
}

function statusForRpcResult(result: RpcResult | null) {
  if (!result) return 500
  if (result.code === 'UNAUTHORIZED') return 403
  if (result.code === 'REQUEST_NOT_FOUND') return 404
  if (result.code === 'REQUEST_EXPIRED' || result.code === 'INVALID_REQUEST_STATUS') return 409
  return 400
}

export async function POST(request: NextRequest) {
  try {
    const creatorAuth = await requireCreatorAreaApi(request)

    if (!creatorAuth.ok) {
      return creatorAuth.response
    }

    const { session_id } = await request.json()

    if (!session_id) {
      return NextResponse.json({ error: 'session_id obrigatorio' }, { status: 400 })
    }

    const { admin, user } = creatorAuth
    const { data, error } = await admin.rpc('accept_chat_request', {
      p_session_id: session_id,
      p_creator_user_id: user.id,
    })

    const result = (data ?? null) as RpcResult | null

    if (error || !result?.success) {
      if (error) {
        console.error('[/api/chat/aceitar] accept_chat_request', error)
      }

      return NextResponse.json({
        success: false,
        error: result?.error ?? 'Falha ao aceitar solicitacao',
        code: result?.code ?? 'ACCEPT_CHAT_REQUEST_FAILED',
        ...(result ?? {}),
      }, { status: statusForRpcResult(result) })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[/api/chat/aceitar]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

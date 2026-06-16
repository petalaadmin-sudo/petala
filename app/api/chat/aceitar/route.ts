import { NextRequest, NextResponse } from 'next/server'
import { requireCreatorAreaApi } from '@/lib/auth/require-creator-area-api'

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

    return NextResponse.json({
      success: false,
      code: 'CHAT_ACCEPTANCE_NOT_READY',
      error: 'Aceite de solicitação em preparação. Recuse ou aguarde a ativação segura do chat.',
    }, { status: 423 })
  } catch (err) {
    console.error('[/api/chat/aceitar]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

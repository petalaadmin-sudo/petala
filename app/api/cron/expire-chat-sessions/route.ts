import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const STALE_AFTER_SECONDS = 90

function authorizeCron(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return {
      ok: false,
      status: 503,
      body: {
        error: 'CRON_SECRET nao configurado',
        code: 'CRON_SECRET_NOT_CONFIGURED',
      },
    }
  }

  const authorization = request.headers.get('authorization')

  if (authorization !== `Bearer ${cronSecret}`) {
    return {
      ok: false,
      status: 401,
      body: {
        error: 'Nao autorizado',
        code: 'UNAUTHORIZED',
      },
    }
  }

  return { ok: true }
}

export async function GET(request: NextRequest) {
  const auth = authorizeCron(request)

  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

  try {
    const admin = createAdminClient() as any
    const { data, error } = await admin.rpc('expire_stale_chat_sessions', {
      p_stale_after_seconds: STALE_AFTER_SECONDS,
    })

    if (error) {
      console.error('[/api/cron/expire-chat-sessions] expire_stale_chat_sessions', error)
      return NextResponse.json({
        error: 'Falha ao expirar sessoes stale',
        code: 'EXPIRE_STALE_CHAT_SESSIONS_FAILED',
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      stale_after_seconds: STALE_AFTER_SECONDS,
      result: data,
    })
  } catch (err) {
    console.error('[/api/cron/expire-chat-sessions]', err)
    return NextResponse.json({
      error: 'Erro interno',
      code: 'INTERNAL_ERROR',
    }, { status: 500 })
  }
}

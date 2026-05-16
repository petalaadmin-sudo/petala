// app/api/bonus/daily/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { requireAuth, getRequestIP } from '@/lib/auth/api-auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.ok) {
      return auth.response
    }

    const ip = getRequestIP(request)
    const limited = await checkRateLimit(ip, auth.user.id)

    if (limited) {
      return limited
    }

    const admin = createAdminClient()

    const { data: result, error } = await admin.rpc('claim_daily_bonus', {
      p_user_id: auth.user.id,
    })

    if (error) {
      console.error('[bonus/daily POST]', error)

      return NextResponse.json(
        { success: false, error: 'Erro interno' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[bonus/daily POST] inesperado:', err)

    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.ok) {
      return auth.response
    }

    const admin = createAdminClient()

    const { data: result, error } = await admin.rpc('get_bonus_status', {
      p_user_id: auth.user.id,
    })

    if (error) {
      console.error('[bonus/daily GET]', error)

      return NextResponse.json(
        { success: false, error: 'Erro interno' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[bonus/daily GET] inesperado:', err)

    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
}
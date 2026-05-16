// app/api/bonus/daily/route.ts
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/ratelimit'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function getIP(request: NextRequest): string {
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const ip      = getIP(request)
    const limited = await checkRateLimit(ip, user.id)
    if (limited) return limited

    const admin = createAdminClient()
    const { data: result, error } = await admin.rpc('claim_daily_bonus', {
      p_user_id: user.id,
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
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const admin = createAdminClient()
    const { data: result, error } = await admin.rpc('get_bonus_status', {
      p_user_id: user.id,
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
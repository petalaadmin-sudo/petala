// app/api/indicacao/registrar/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { referral_code, user_id } = await request.json()

    if (!referral_code?.trim() || !user_id) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const admin = createAdminClient()

    const { data: result } = await admin.rpc('register_referral', {
      p_referred_id:   user_id,
      p_referral_code: referral_code.trim().toUpperCase(),
      p_referred_ip:   ip,
    })

    if (!result?.success) {
      return NextResponse.json({ error: result?.error ?? 'Código inválido' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      referrer_type: result.referrer_type,
      message: 'Código aplicado!',
    })
  } catch (err) {
    console.error('[api/indicacao/registrar]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
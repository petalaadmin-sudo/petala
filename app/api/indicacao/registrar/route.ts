// app/api/indicacao/registrar/route.ts
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const { referral_code } = await request.json()
    if (!referral_code?.trim()) return NextResponse.json({ error: 'Código obrigatório' }, { status: 400 })

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const admin = createAdminClient()

    // Anti-fraude: máximo 3 indicações por IP em 24h
    if (ip !== 'unknown') {
      const since = new Date(Date.now() - 86400000).toISOString()
      const { count } = await admin
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referred_ip', ip)
        .gte('created_at', since)

      if ((count ?? 0) >= 3) {
        console.warn(`[indicacao] IP suspeito: ${ip}`)
        // Registra mas marca como suspeito (não bloqueia ainda)
      }
    }

    const { data: result } = await admin.rpc('register_referral', {
      p_referred_id:   user.id,
      p_referral_code: referral_code.trim().toUpperCase(),
      p_referred_ip:   ip,
    })

    if (!result?.success) {
      return NextResponse.json({ error: result?.error ?? 'Código inválido' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      referrer_type: result.referrer_type,
      message: 'Código aplicado! Você ganha 50 pétalas após verificar e fazer sua primeira compra.',
    })
  } catch (err) {
    console.error('[api/indicacao/registrar]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

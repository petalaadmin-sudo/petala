// app/api/indicacao/status/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const [userRes, referralsRes, commissionsRes] = await Promise.all([
      supabase
        .from('users')
        .select('referral_code, referred_by, referral_bonus_paid, first_purchase_done, phone_verified')
        .eq('id', user.id)
        .single(),

      supabase
        .from('referrals')
        .select('id, referred_type, welcome_bonus_referrer_paid, total_commission_earned, created_at')
        .eq('referrer_id', user.id)
        .eq('blocked', false)
        .order('created_at', { ascending: false }),

      supabase
        .from('referral_commissions')
        .select('commission_petals, created_at')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    const referrals   = referralsRes.data   ?? []
    const commissions = commissionsRes.data ?? []
    const totalCommission = commissions.reduce((s, c) => s + c.commission_petals, 0)

    return NextResponse.json({
      referral_code:           userRes.data?.referral_code,
      has_referrer:            !!userRes.data?.referred_by,
      bonus_paid:              userRes.data?.referral_bonus_paid,
      first_purchase_done:     userRes.data?.first_purchase_done,
      total_referred:          referrals.length,
      pending_bonuses:         referrals.filter(r => !r.welcome_bonus_referrer_paid).length,
      total_commission_petals: totalCommission,
      referrals,
      recent_commissions:      commissions,
    })
  } catch (err) {
    console.error('[api/indicacao/status]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

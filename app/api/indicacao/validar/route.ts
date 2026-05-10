// app/api/indicacao/validar/route.ts
// Frontend chama para verificar se o código é válido antes de submeter

import { createAdminClient } from '@/lib/supabase/server'
import { isValidReferralCode } from '@/lib/referral'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')?.toUpperCase().trim()

  if (!code || !isValidReferralCode(code)) {
    return NextResponse.json({ valid: false, error: 'Formato inválido' })
  }

  const admin = createAdminClient()

  // Busca em usuários e criadoras
  const [userRes, creatorRes] = await Promise.all([
    admin.from('users').select('id, referral_code').eq('referral_code', code).single(),
    admin.from('creators').select('id, name, referral_code').eq('referral_code', code).single(),
  ])

  if (!userRes.data && !creatorRes.data) {
    return NextResponse.json({ valid: false, error: 'Código não encontrado' })
  }

  const name = creatorRes.data?.name ?? 'um amigo'

  return NextResponse.json({
    valid: true,
    referrer_name: name,
    bonus_coins: 50,
  })
}

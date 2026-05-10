// app/api/pix/criar/route.ts
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createPixCharge } from '@/lib/paggue'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { package_id } = await request.json()
    if (!package_id) {
      return NextResponse.json({ error: 'package_id obrigatório' }, { status: 400 })
    }

    const { data: pkg, error: pkgError } = await supabase
      .from('petal_packages')
      .select('*')
      .eq('id', package_id)
      .eq('active', true)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Pacote não encontrado' }, { status: 404 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    const totalPetals = pkg.petals + pkg.bonus_petals

    const charge = await createPixCharge({
      amount_cents: Math.round(pkg.price_brl * 100),
      description: `Pétala — ${pkg.name} (${totalPetals} pétalas)`,
      customer_name: userData?.email?.split('@')[0] ?? 'Usuário',
      customer_email: userData?.email ?? user.email ?? '',
      expires_in_minutes: 30,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pix/webhook`,
      metadata: {
        user_id:      user.id,
        package_id:   pkg.id,
        package_name: pkg.name,
        petals:       String(pkg.petals),
        bonus_petals: String(pkg.bonus_petals),
        total_petals: String(totalPetals),
      },
    })

    const admin = createAdminClient()
    await admin.from('transactions').insert({
      user_id:      user.id,
      type:         'purchase',
      petals_delta: totalPetals,
      balance_after: 0,
      amount_brl:   pkg.price_brl,
      gateway_id:   charge.id,
      status:       'pending',
      metadata: {
        package_id:   pkg.id,
        package_name: pkg.name,
        pix_expires:  charge.expires_at,
      },
    })

    return NextResponse.json({
      charge_id:    charge.id,
      pix_qr_code:  charge.pix_qr_code,
      pix_qr_image: charge.pix_qr_code_image,
      expires_at:   charge.expires_at,
      amount_brl:   pkg.price_brl,
      total_petals: totalPetals,
      package_name: pkg.name,
    })

  } catch (err) {
    console.error('[/api/pix/criar]', err)
    return NextResponse.json({ error: 'Erro ao criar cobrança' }, { status: 500 })
  }
}

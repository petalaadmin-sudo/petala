// app/api/pix/criar/route.ts
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  createPixCharge,
  PaggueConfigurationError,
  PaggueHttpError,
  PaggueNetworkError,
} from '@/lib/paggue'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }

    const { package_id } = await request.json()
    if (!package_id) {
      return NextResponse.json({ error: 'package_id obrigatorio' }, { status: 400 })
    }

    const { data: pkg, error: pkgError } = await supabase
      .from('petal_packages')
      .select('*')
      .eq('id', package_id)
      .eq('active', true)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: 'Pacote nao encontrado' }, { status: 404 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single()

    const totalPetals = pkg.petals + pkg.bonus_petals

    const charge = await createPixCharge({
      amount_cents: Math.round(pkg.price_brl * 100),
      description: `Pétala/Bloom - créditos internos (${totalPetals} pétalas)`,
      customer_name: userData?.email?.split('@')[0] ?? 'Usuario',
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
    const idempotencyKey = `pix:${charge.id}`
    const transactionMetadata = {
      provider: 'paggue',
      source_type: 'pix_purchase_pending',
      source_id: charge.id,
      gateway_id: charge.id,
      package_id: pkg.id,
      package_name: pkg.name,
      paid_petals: pkg.petals,
      bonus_petals: pkg.bonus_petals,
      total_petals: totalPetals,
      amount_brl: pkg.price_brl,
      pix_expires: charge.expires_at,
      idempotency_key: idempotencyKey,
    }

    const { error: transactionError } = await admin.from('transactions').insert({
      user_id:      user.id,
      type:         'purchase',
      petals_delta: totalPetals,
      balance_after: 0,
      amount_brl:   pkg.price_brl,
      gateway_id:   charge.id,
      status:       'pending',
      metadata:     transactionMetadata,
      idempotency_key: idempotencyKey,
    })

    if (transactionError) {
      console.error('[/api/pix/criar] erro ao registrar transaction pending:', transactionError)
      return NextResponse.json({ error: 'Erro ao registrar cobranca Pix' }, { status: 500 })
    }

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
    if (err instanceof PaggueConfigurationError) {
      console.error('[/api/pix/criar] configuracao Paggue ausente:', {
        code: err.code,
        envVar: err.envVar,
      })
      return NextResponse.json({
        error: 'Pix em preparação. Use cartão ou tente novamente mais tarde.',
        code: 'PIX_UNAVAILABLE',
      }, { status: 503 })
    }

    if (err instanceof PaggueNetworkError) {
      console.error('[/api/pix/criar] gateway Paggue indisponivel:', {
        code: err.code,
        host: err.host,
        path: err.path,
        causeCode: err.causeCode,
      })
      return NextResponse.json({
        error: 'Gateway Pix indisponivel',
        code: err.code,
        cause_code: err.causeCode,
      }, { status: 502 })
    }

    if (err instanceof PaggueHttpError) {
      console.error('[/api/pix/criar] gateway Paggue retornou erro:', {
        code: err.code,
        host: err.host,
        path: err.path,
        status: err.status,
      })
      return NextResponse.json({
        error: 'Gateway Pix retornou erro',
        code: err.code,
        status: err.status,
      }, { status: 502 })
    }

    console.error('[/api/pix/criar]', err)
    return NextResponse.json({ error: 'Erro ao criar cobranca' }, { status: 500 })
  }
}

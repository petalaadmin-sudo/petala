import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.ok) {
      return auth.response
    }

    const body = await request.json()
    const packageId = typeof body?.package_id === 'string' ? body.package_id.trim() : ''

    if (!packageId) {
      return NextResponse.json({ error: 'package_id obrigatorio' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: pacote, error: packageError } = await admin
      .from('petal_packages')
      .select('id, name, petals, bonus_petals, price_brl')
      .eq('id', packageId)
      .eq('active', true)
      .single()

    if (packageError || !pacote) {
      return NextResponse.json({ error: 'Pacote nao encontrado' }, { status: 404 })
    }

    const paidPetals = Number(pacote.petals)
    const bonusPetals = Number(pacote.bonus_petals ?? 0)
    const totalPetals = paidPetals + bonusPetals
    const amountBrl = Number(pacote.price_brl)
    const unitAmount = Math.round(amountBrl * 100)

    if (
      !Number.isInteger(paidPetals) ||
      !Number.isInteger(bonusPetals) ||
      !Number.isInteger(totalPetals) ||
      paidPetals <= 0 ||
      bonusPetals < 0 ||
      totalPetals <= 0
    ) {
      console.error('[stripe/criar-sessao] pacote com petalas invalidas:', {
        package_id: pacote.id,
        paid_petals: pacote.petals,
        bonus_petals: pacote.bonus_petals,
      })
      return NextResponse.json({ error: 'Pacote invalido' }, { status: 500 })
    }

    if (!Number.isFinite(amountBrl) || amountBrl <= 0 || !Number.isInteger(unitAmount) || unitAmount <= 0) {
      console.error('[stripe/criar-sessao] pacote com preco invalido:', {
        package_id: pacote.id,
        price_brl: pacote.price_brl,
      })
      return NextResponse.json({ error: 'Pacote invalido' }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: {
            name: `${totalPetals} Pétalas — ${pacote.name}`,
            description: 'Pétala App — Moeda virtual',
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/perfil?checkout=stripe`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/perfil?checkout=cancelled`,
      metadata: {
        user_id: auth.user.id,
        package_id: pacote.id,
        package_name: pacote.name,
        paid_petals: String(paidPetals),
        bonus_petals: String(bonusPetals),
        total_petals: String(totalPetals),
        petals: String(totalPetals),
      },
    })

    if (!session.url) {
      console.error('[stripe/criar-sessao] sessao criada sem URL:', {
        session_id: session.id,
        package_id: pacote.id,
      })
      return NextResponse.json({ error: 'Erro ao criar checkout' }, { status: 500 })
    }

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[stripe/criar-sessao]', err)
    return NextResponse.json({ error: 'Erro ao criar sessao' }, { status: 500 })
  }
}

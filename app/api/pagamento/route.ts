import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PACOTES: Record<string, number> = {
  starter: 360,
  popular: 650,
  plus: 1250,
  premium: 1800,
  pro: 3500,
  elite: 7000,
  master: 15000,
  diamond: 35000,
}

export async function POST(request: Request) {
  const body = await request.json()

  if (body.type !== 'payment') {
    return NextResponse.json({ ok: true })
  }

  const paymentId = body.data?.id
  if (!paymentId) return NextResponse.json({ ok: true })

  const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` }
  })

  const payment = await mpResponse.json()

  if (payment.status !== 'approved') {
    return NextResponse.json({ ok: true })
  }

  const userId = payment.metadata?.user_id
  const pacoteId = payment.metadata?.petalas
  const petalas = typeof pacoteId === 'number' ? pacoteId : PACOTES[payment.additional_info?.items?.[0]?.id]

  if (!userId || !petalas) {
    return NextResponse.json({ ok: true })
  }

  await supabase.rpc('adicionar_petalas', { p_user_id: userId, p_quantidade: petalas })

  await supabase.from('transacoes').insert({
    user_id: userId,
    tipo: 'compra',
    quantidade: petalas,
    payment_id: String(paymentId),
    status: 'aprovado',
  })

  return NextResponse.json({ ok: true })
}
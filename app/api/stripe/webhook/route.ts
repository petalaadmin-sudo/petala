import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const userId = session.metadata?.user_id
    const petals = Number(session.metadata?.petals)
    const packageName = session.metadata?.package_name

    if (userId && petals) {
      await supabaseAdmin.rpc('credit_petals', {
        p_user_id: userId,
        p_amount: petals,
        p_type: 'purchase',
      })

      await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        type: 'purchase',
        petals_delta: petals,
        balance_after: 0,
        amount_brl: (session.amount_total ?? 0) / 100,
        gateway_id: session.id,
        status: 'completed',
        metadata: { package_name: packageName },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
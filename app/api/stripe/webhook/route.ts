import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { enviarEmailCompraPetals } from '@/lib/email'

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

    console.log('[webhook] userId:', userId, 'petals:', petals)

    if (userId && petals) {
      const { data: userData, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('balance_petals, email, username')
        .eq('id', userId)
        .single()

      if (fetchError) {
        console.error('[webhook] Erro ao buscar usuário:', fetchError)
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 500 })
      }

      const novoSaldo = (userData.balance_petals || 0) + petals

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ balance_petals: novoSaldo, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (updateError) {
        console.error('[webhook] Erro ao atualizar saldo:', updateError)
        return NextResponse.json({ error: 'Erro ao creditar' }, { status: 500 })
      }

      console.log('[webhook] ✅ Saldo atualizado:', novoSaldo)

      await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        type: 'purchase',
        petals_delta: petals,
        balance_after: novoSaldo,
        amount_brl: (session.amount_total ?? 0) / 100,
        gateway_id: session.id,
        status: 'completed',
        metadata: { package_name: packageName },
      })

      const emailDestino = userData.email || session.customer_details?.email
      console.log('[webhook] Email destino:', emailDestino)

      if (emailDestino) {
        try {
          const resultado = await enviarEmailCompraPetals(
            emailDestino,
            userData.username || '',
            petals,
            packageName || '',
            (session.amount_total ?? 0) / 100
          )
          console.log('[webhook] ✅ Email enviado:', resultado)
        } catch (emailErr) {
          console.error('[webhook] ❌ Erro ao enviar email:', emailErr)
        }
      } else {
        console.error('[webhook] ❌ Email não encontrado')
      }
    }
  }

  return NextResponse.json({ ok: true })
}
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { enviarEmailCompraPetals } from '@/lib/email'

const admin = createClient(
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
    const idempotencyKey = `stripe:${session.id}`
    const amountBrl = (session.amount_total ?? 0) / 100

    console.log('[webhook] userId:', userId, 'petals:', petals)

    if (userId && petals) {
      const { data: existingTransaction, error: existingError } = await admin
        .from('transactions')
        .select('id, status')
        .or(`gateway_id.eq.${session.id},idempotency_key.eq.${idempotencyKey}`)
        .eq('status', 'completed')
        .maybeSingle()

      if (existingError) {
        console.error('[webhook] Erro ao buscar transacao existente:', existingError)
        return NextResponse.json({ error: 'Erro ao verificar transacao' }, { status: 500 })
      }

      if (existingTransaction) {
        console.log('[webhook] Evento Stripe ja processado:', session.id)
        return NextResponse.json({ ok: true })
      }

      const { data: userData, error: fetchError } = await admin
        .from('users')
        .select('email, username')
        .eq('id', userId)
        .single()

      if (fetchError) {
        console.error('[webhook] Erro ao buscar usuário:', fetchError)
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 500 })
      }

      const { data: credit, error: creditError } = await admin.rpc('credit_stripe_purchase_with_lot', {
        p_user_id: userId,
        p_amount: petals,
        p_stripe_session_id: session.id,
        p_amount_brl: amountBrl,
        p_package_name: packageName ?? null,
        p_idempotency_key: idempotencyKey,
        p_metadata: {
          provider: 'stripe',
          stripe_session_id: session.id,
          package_name: packageName,
          amount_brl: amountBrl,
        },
      })

      if (creditError || !credit?.success) {
        console.error('[webhook] Erro ao creditar petalas:', creditError ?? credit)
        return NextResponse.json({ error: 'Erro ao creditar' }, { status: 500 })
      }

      console.log('[webhook] ✅ Saldo atualizado:', credit.new_balance)

      if (credit.idempotent_replay) {
        console.log('[webhook] Evento Stripe ja processado pela RPC:', session.id)
        return NextResponse.json({ ok: true })
      }

      const emailDestino = userData.email || session.customer_details?.email
      console.log('[webhook] Email destino:', emailDestino)

      if (emailDestino) {
        try {
          const resultado = await enviarEmailCompraPetals(
            emailDestino,
            userData.username || '',
            petals,
            packageName || '',
            amountBrl
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

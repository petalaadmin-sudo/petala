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

      const { data: credit, error: creditError } = await admin.rpc('credit_petals', {
        p_user_id: userId,
        p_amount: petals,
        p_type: 'purchase',
        p_ref_id: null,
        p_idempotency_key: idempotencyKey,
      })

      if (creditError || !credit?.success) {
        console.error('[webhook] Erro ao creditar petalas:', creditError ?? credit)
        return NextResponse.json({ error: 'Erro ao creditar' }, { status: 500 })
      }

      console.log('[webhook] ✅ Saldo atualizado:', credit.new_balance)

      const transactionData = {
        amount_brl: (session.amount_total ?? 0) / 100,
        gateway_id: session.id,
        status: 'completed',
        metadata: {
          package_name: packageName,
          stripe_session_id: session.id,
          credited_at: new Date().toISOString(),
        },
      }

      const { data: updatedTransaction, error: updateTransactionError } = await admin
        .from('transactions')
        .update(transactionData)
        .eq('idempotency_key', idempotencyKey)
        .select('id')
        .maybeSingle()

      if (updateTransactionError) {
        console.error('[webhook] Erro ao atualizar transacao:', updateTransactionError)
        return NextResponse.json({ error: 'Erro ao atualizar transacao' }, { status: 500 })
      }

      if (!updatedTransaction) {
        const { error: insertTransactionError } = await admin.from('transactions').insert({
          user_id: userId,
          type: 'purchase',
          petals_delta: petals,
          balance_after: credit.new_balance,
          amount_brl: (session.amount_total ?? 0) / 100,
          gateway_id: session.id,
          status: 'completed',
          idempotency_key: idempotencyKey,
          metadata: {
            package_name: packageName,
            stripe_session_id: session.id,
            credited_at: new Date().toISOString(),
          },
        })

        if (insertTransactionError) {
          console.error('[webhook] Erro ao inserir transacao:', insertTransactionError)
          return NextResponse.json({ error: 'Erro ao registrar transacao' }, { status: 500 })
        }
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

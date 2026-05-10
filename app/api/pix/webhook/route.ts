// app/api/pix/webhook/route.ts — Bug 2 CORRIGIDO
import { createAdminClient } from '@/lib/supabase/server'
import { validateWebhookSignature } from '@/lib/paggue'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const rawBody   = await request.text()
    const signature = request.headers.get('x-paggue-signature') ?? ''

    if (!validateWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }

    const event = JSON.parse(rawBody) as {
      event: string
      data: { id: string; paid_at: string; metadata: Record<string, string> }
    }

    if (event.event !== 'charge.paid') return NextResponse.json({ received: true })

    const { id: chargeId, metadata, paid_at } = event.data
    const { user_id, total_petals, package_name } = metadata
    if (!user_id || !total_petals) return NextResponse.json({ error: 'Metadata inválido' }, { status: 400 })

    const admin = createAdminClient()

    // Idempotência
    const { data: existing } = await admin
      .from('transactions').select('status').eq('gateway_id', chargeId).single()
    if (existing?.status === 'completed') return NextResponse.json({ received: true })

    const petals = parseInt(total_petals, 10)

    // Credita pétalas
    const { data: credit } = await admin.rpc('credit_petals', {
      p_user_id: user_id, p_amount: petals, p_type: 'purchase',
    })
    if (!credit?.success) throw new Error('Falha ao creditar pétalas')

    // Atualiza transação
    await admin.from('transactions').update({
      status: 'completed', balance_after: credit.new_balance,
      metadata: { ...metadata, paid_at, credited_at: new Date().toISOString() },
    }).eq('gateway_id', chargeId)

    // Bug 2 CORRIGIDO: seta first_purchase_done e tenta liberar bônus de indicação
    await admin.rpc('on_first_purchase', { p_user_id: user_id })
      .then(r => console.log('[webhook] on_first_purchase:', r.data))
      .catch(e => console.error('[webhook] on_first_purchase erro:', e))

    // Push notification
    const appId  = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    const apiKey = process.env.ONESIGNAL_REST_API_KEY
    if (appId && apiKey) {
      const { data: u } = await admin.from('users').select('onesignal_player_id').eq('id', user_id).single()
      if (u?.onesignal_player_id) {
        fetch('https://onesignal.com/api/v1/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Basic ${apiKey}` },
          body: JSON.stringify({
            app_id: appId, include_player_ids: [u.onesignal_player_id],
            headings: { pt: '🌸 Pétalas adicionadas!' },
            contents: { pt: `${petals} pétalas do pacote ${package_name} estão na sua conta.` },
          }),
        }).catch(console.error)
      }
    }

    console.log(`[webhook/pix] OK: +${petals}🌸 → ${user_id}`)
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[webhook/pix]', err)
    return NextResponse.json({ received: true, error: String(err) })
  }
}

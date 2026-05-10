// app/api/pix/status/route.ts
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getCharge } from '@/lib/paggue'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chargeId = searchParams.get('charge_id')

  if (!chargeId) {
    return NextResponse.json({ error: 'charge_id obrigatório' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: tx } = await admin
    .from('transactions')
    .select('status, balance_after, petals_delta')
    .eq('gateway_id', chargeId)
    .eq('user_id', user.id)
    .single()

  if (!tx) {
    return NextResponse.json({ error: 'Não encontrada' }, { status: 404 })
  }

  if (tx.status === 'completed') {
    return NextResponse.json({
      status: 'paid',
      new_balance: tx.balance_after,
      petals_credited: tx.petals_delta,
    })
  }

  // Fallback: consulta o gateway diretamente
  try {
    const charge = await getCharge(chargeId)

    if (charge.status === 'paid' && tx.status === 'pending') {
      const { data: creditResult } = await admin.rpc('credit_petals', {
        p_user_id: user.id,
        p_amount:  tx.petals_delta,
        p_type:    'purchase',
      })

      if (creditResult?.success) {
        await admin
          .from('transactions')
          .update({ status: 'completed', balance_after: creditResult.new_balance })
          .eq('gateway_id', chargeId)

        return NextResponse.json({
          status: 'paid',
          new_balance: creditResult.new_balance,
          petals_credited: tx.petals_delta,
        })
      }
    }

    return NextResponse.json({ status: charge.status })
  } catch (err) {
    console.error('[pix/status]', err)
    return NextResponse.json({ status: tx.status })
  }
}

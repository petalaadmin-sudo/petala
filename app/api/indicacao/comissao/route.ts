// app/api/indicacao/comissao/route.ts
// Chamado internamente pelo /api/chat/encerrar após cada sessão
// Calcula e credita comissão de 10% para a criadora indicadora

import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Esta rota é chamada server-to-server (pelo /api/chat/encerrar)
    // Valida com uma chave interna para evitar chamadas externas
    const authHeader = request.headers.get('x-internal-key')
    if (authHeader !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { session_id, creator_id, petals_charged } = await request.json()

    if (!session_id || !creator_id || !petals_charged) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Chama a função SQL que processa a comissão
    const { data, error } = await admin.rpc('process_creator_referral_commission', {
      p_session_id: session_id,
      p_creator_id: creator_id,
      p_petals:     petals_charged,
    })

    if (error) throw error

    return NextResponse.json(data)

  } catch (err) {
    console.error('[/api/indicacao/comissao]', err)
    // Não falha silenciosamente — loga mas retorna 200 para não bloquear o fluxo
    return NextResponse.json({ commission_paid: false, error: String(err) })
  }
}

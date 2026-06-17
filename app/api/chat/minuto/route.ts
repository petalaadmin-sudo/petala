import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    success: false,
    code: 'CHAT_BILLING_NOT_READY',
    error: 'Cobrança de chat em preparação. Aguarde a ativação segura do fluxo.',
  }, { status: 423 })
}

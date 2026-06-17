import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    success: false,
    code: 'CHAT_START_NOT_READY',
    error: 'Início de chat em preparação. Aguarde a ativação segura do fluxo de solicitações.',
  }, { status: 423 })
}

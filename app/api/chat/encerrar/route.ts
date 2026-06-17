import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    success: false,
    code: 'CHAT_END_NOT_READY',
    error: 'Encerramento de chat em preparação. Sessões legadas serão tratadas por fluxo seguro de limpeza.',
  }, { status: 423 })
}

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    success: false,
    code: 'VIDEO_NOT_READY',
    error: 'Vídeo em preparação. Aguarde a ativação segura do fluxo.',
  }, { status: 423 })
}

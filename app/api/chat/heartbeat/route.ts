import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({
    success: false,
    code: 'CHAT_HEARTBEAT_NOT_READY',
    error: 'Heartbeat de chat em preparação.',
  }, { status: 423 })
}

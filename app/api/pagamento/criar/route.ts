import { NextResponse } from 'next/server'

const LEGACY_PAYMENT_DISABLED_RESPONSE = {
  success: false,
  error: 'Fluxo de pagamento legado desativado. Use o checkout disponível no perfil.',
}

export async function POST() {
  return NextResponse.json(LEGACY_PAYMENT_DISABLED_RESPONSE, { status: 410 })
}

export async function GET() {
  return NextResponse.json(LEGACY_PAYMENT_DISABLED_RESPONSE, { status: 410 })
}

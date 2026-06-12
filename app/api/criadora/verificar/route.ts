// app/api/criadora/verificar/route.ts
// Fluxo legado neutralizado. A verificacao de criadora agora passa por /criadora/onboarding.

import { NextResponse } from 'next/server'

const LEGACY_CREATOR_VERIFICATION_DISABLED = {
  error: 'Fluxo de verificacao descontinuado. Use /criadora/onboarding.',
}

export async function POST() {
  return NextResponse.json(LEGACY_CREATOR_VERIFICATION_DISABLED, { status: 410 })
}

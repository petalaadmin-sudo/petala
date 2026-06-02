import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { resolveAccountRedirectTarget } from '@/lib/auth/redirect-target'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)

    if (!auth.ok) {
      return (auth as { ok: false; response: NextResponse }).response
    }

    const admin = createAdminClient() as any
    const target = await resolveAccountRedirectTarget(admin, auth.user.id, {
      strict: true,
      logPrefix: 'auth/redirect-target',
    })

    return NextResponse.json({
      success: true,
      redirectTo: target.redirectTo,
      reason: target.reason,
    })
  } catch (err) {
    console.error('[auth/redirect-target]', err)
    return NextResponse.json(
      { success: false, error: 'Erro ao resolver destino' },
      { status: 500 }
    )
  }
}

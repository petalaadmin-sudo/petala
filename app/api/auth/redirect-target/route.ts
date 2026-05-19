import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type UserRole = 'user' | 'creator' | 'admin'

type UserRow = {
  role: UserRole | null
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)

  if (!auth.ok) {
    return (auth as { ok: false; response: NextResponse }).response
  }

  const admin = createAdminClient() as any

  const { data: userData, error: userError } = await admin
    .from('users')
    .select('role')
    .eq('id', auth.user.id)
    .single()

  if (userError) {
    console.error('[auth/redirect-target] users', userError)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar usuario' },
      { status: 500 }
    )
  }

  const user = userData as UserRow | null

  if (user?.role === 'admin') {
    return NextResponse.json({ success: true, redirectTo: '/admin' })
  }

  const { data: agencyUser, error: agencyError } = await admin
    .from('agency_users')
    .select('id')
    .eq('user_id', auth.user.id)
    .eq('active', true)
    .limit(1)
    .maybeSingle()

  if (agencyError) {
    console.error('[auth/redirect-target] agency_users', agencyError)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar vinculo de agencia' },
      { status: 500 }
    )
  }

  if (agencyUser) {
    return NextResponse.json({ success: true, redirectTo: '/agencia' })
  }

  if (user?.role === 'creator') {
    return NextResponse.json({ success: true, redirectTo: '/criadora/dashboard' })
  }

  return NextResponse.json({ success: true, redirectTo: '/feed' })
}

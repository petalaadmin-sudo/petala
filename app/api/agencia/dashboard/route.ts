import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/api-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AgencyUser = {
  agency_id: string
  role: string | null
  active: boolean | null
}

type AgencyInfo = {
  id: string
  name: string | null
  email: string | null
  invite_code: string | null
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)

  if (!auth.ok) {
    return (auth as { ok: false; response: NextResponse }).response
  }

  const admin = createAdminClient() as any

  const { data: agencyUser, error: agencyUserError } = await admin
    .from('agency_users')
    .select('agency_id, role, active')
    .eq('user_id', auth.user.id)
    .eq('active', true)
    .limit(1)
    .maybeSingle()

  if (agencyUserError) {
    console.error('[agencia/dashboard] agency_users', agencyUserError)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar vinculo da agencia' },
      { status: 500 }
    )
  }

  const agencyLink = agencyUser as AgencyUser | null

  if (!agencyLink?.agency_id) {
    return NextResponse.json(
      { success: false, error: 'Acesso nao autorizado' },
      { status: 403 }
    )
  }

  const [currentWeekResult, dashboardResult, agencyResult] = await Promise.all([
    admin.rpc('get_current_bloom_week'),
    admin
      .from('agency_dashboard_full')
      .select('*')
      .eq('agency_id', agencyLink.agency_id)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('agencies')
      .select('id, name, email, invite_code')
      .eq('id', agencyLink.agency_id)
      .maybeSingle(),
  ])

  if (currentWeekResult.error) {
    console.error('[agencia/dashboard] get_current_bloom_week', currentWeekResult.error)
  }

  if (dashboardResult.error) {
    console.error('[agencia/dashboard] agency_dashboard_full', dashboardResult.error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dashboard da agencia' },
      { status: 500 }
    )
  }

  if (agencyResult.error) {
    console.error('[agencia/dashboard] agencies', agencyResult.error)
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar dados da agencia' },
      { status: 500 }
    )
  }

  const dashboard = dashboardResult.data
  const agency = agencyResult.data as AgencyInfo | null

  let creators = []
  let rankingRows = []

  if (dashboard?.week_start && dashboard?.week_end) {
    const [creatorsResult, rankingResult] = await Promise.all([
      admin
        .from('agency_creator_performance')
        .select('*')
        .eq('agency_id', agencyLink.agency_id)
        .eq('week_start', dashboard.week_start)
        .eq('week_end', dashboard.week_end)
        .order('paid_minutes', { ascending: false }),
      admin
        .from('agency_ranking_weekly')
        .select('*')
        .eq('agency_id', agencyLink.agency_id)
        .eq('week_start', dashboard.week_start)
        .eq('week_end', dashboard.week_end)
        .limit(1),
    ])

    if (creatorsResult.error) {
      console.error('[agencia/dashboard] agency_creator_performance', creatorsResult.error)
    } else {
      creators = creatorsResult.data ?? []
    }

    if (rankingResult.error) {
      console.error('[agencia/dashboard] agency_ranking_weekly', rankingResult.error)
    } else {
      rankingRows = rankingResult.data ?? []
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      currentWeek: currentWeekResult.data ?? null,
      agency: agency ?? null,
      dashboard: dashboard ?? null,
      creators: creators ?? [],
      ranking: (rankingRows ?? [])[0] ?? null,
      agencyUserRole: agencyLink.role ?? null,
    },
  })
}

import { redirect } from 'next/navigation'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AgencyUser = {
  agency_id: string
  role: string | null
  active: boolean | null
}

type AgencyDashboard = {
  agency_id: string | null
  agency_name: string | null
  week_start: string | null
  week_end: string | null
  agency_score: number | null
  agency_score_label_pt: string | null
  agency_score_description: string | null
  agency_commission_usd: number | null
  linked_creators_count: number | null
  creators_with_activity_count: number | null
  fully_active_creators_count: number | null
  total_paid_minutes: number | null
  total_online_minutes: number | null
  total_gifts_count: number | null
}

type AgencyRanking = {
  score_rank: number | null
  agency_id: string | null
  agency_name: string | null
  agency_score: number | null
  agency_score_label_pt: string | null
  week_start: string | null
  week_end: string | null
}

type CreatorPerformance = {
  creator_id: string | null
  creator_name: string | null
  paid_minutes: number | null
  online_minutes: number | null
  gifts_count: number | null
  creator_total_usd: number | null
  agency_commission_usd: number | null
  performance_status: string | null
  performance_label: string | null
  paid_minutes_missing: number | null
  online_minutes_missing: number | null
}

const usd = (value: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(Number(value ?? 0))

const int = (value: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR').format(Number(value ?? 0))

const shortDate = (value: string | null | undefined) => {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('pt-BR')
}

const weekLabel = (week: unknown, fallbackStart?: string | null, fallbackEnd?: string | null) => {
  if (week && !Array.isArray(week) && typeof week === 'object') {
    const row = week as Record<string, unknown>
    const label = row.week_label ?? row.label ?? row.name
    if (label) return String(label)
  }

  if (Array.isArray(week)) return weekLabel(week[0], fallbackStart, fallbackEnd)
  if (typeof week === 'string' || typeof week === 'number') return String(week)

  const start = shortDate(fallbackStart)
  const end = shortDate(fallbackEnd)
  if (start && end) return `${start} a ${end}`
  return 'Semana atual Bloom'
}

const firstNumber = (...values: Array<number | null | undefined>) =>
  values.find(value => typeof value === 'number') ?? null

const firstText = (...values: Array<string | null | undefined>) =>
  values.find(value => value && value.trim().length > 0) ?? null

function EmptyAccess() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-[#111] border border-white/5 rounded-xl p-6 text-center">
        <h1 className="text-white text-lg font-medium">Acesso nao autorizado</h1>
        <p className="text-white/35 text-sm mt-2">
          Seu usuario nao possui vinculo ativo com uma agencia.
        </p>
      </div>
    </main>
  )
}

export default async function AgenciaPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const admin = createAdminClient() as any

  const { data: agencyUser } = await admin
    .from('agency_users')
    .select('agency_id, role, active')
    .eq('user_id', user.id)
    .eq('active', true)
    .limit(1)
    .maybeSingle()

  const agencyLink = agencyUser as AgencyUser | null
  if (!agencyLink?.agency_id) return <EmptyAccess />

  const [currentWeekResult, dashboardResult] = await Promise.all([
    admin.rpc('get_current_bloom_week'),
    admin
      .from('agency_dashboard_full')
      .select('*')
      .eq('agency_id', agencyLink.agency_id)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const dashboard = dashboardResult.data as AgencyDashboard | null

  const [{ data: creatorRows }, { data: rankingRows }] = dashboard
    ? await Promise.all([
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
    : [{ data: [] }, { data: [] }]

  const creators = (creatorRows ?? []) as CreatorPerformance[]
  const ranking = ((rankingRows ?? []) as AgencyRanking[])[0] ?? null

  const performanceLevel = firstText(
    dashboard?.agency_score_label_pt,
    ranking?.agency_score_label_pt
  )

  const performanceDescription = dashboard?.agency_score_description ?? null

  const cards = [
    { label: 'Score', value: int(dashboard?.agency_score ?? ranking?.agency_score), desc: 'Pontuacao semanal' },
    { label: 'Nivel', value: performanceLevel ?? '-', desc: performanceDescription ?? 'Performance da agencia' },
    { label: 'Comissao gerada', value: usd(dashboard?.agency_commission_usd), desc: 'USD' },
    { label: 'Criadoras vinculadas', value: int(dashboard?.linked_creators_count), desc: 'Total na agencia' },
    { label: 'Com atividade', value: int(dashboard?.creators_with_activity_count), desc: 'Na semana' },
    { label: 'Plenamente ativas', value: int(dashboard?.fully_active_creators_count), desc: 'Meta completa' },
    { label: 'Minutos pagos', value: int(dashboard?.total_paid_minutes), desc: 'Chat/video' },
    { label: 'Minutos online', value: int(dashboard?.total_online_minutes), desc: 'Presenca real' },
    { label: 'Presentes', value: int(dashboard?.total_gifts_count), desc: 'Quantidade' },
    { label: 'Ranking', value: ranking?.score_rank ? `#${ranking.score_rank}` : '-', desc: 'Posicao semanal' },
  ]

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[#ff4d7d] text-xs font-medium uppercase tracking-wide">Bloom</p>
            <h1 className="text-white text-2xl font-medium mt-1">Painel da Agencia</h1>
            <p className="text-white/35 text-sm mt-2">
              {dashboard?.agency_name ?? ranking?.agency_name ?? 'Agencia'} - {weekLabel(currentWeekResult.data, dashboard?.week_start, dashboard?.week_end)}
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#111] px-4 py-3">
            <div className="text-white/30 text-[11px] uppercase tracking-wide">Vinculo</div>
            <div className="text-white/70 text-sm mt-1">{agencyLink.role ?? 'agency'}</div>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {cards.map(card => (
            <div key={card.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
              <div className="text-white/30 text-[11px] uppercase tracking-wide">{card.label}</div>
              <div className="text-white text-lg font-medium mt-2 break-words">{card.value}</div>
              <div className="text-white/25 text-xs mt-1">{card.desc}</div>
            </div>
          ))}
        </section>

        {performanceDescription && (
          <section className="bg-[#111] rounded-xl border border-white/5 p-4">
            <div className="text-white/30 text-[11px] uppercase tracking-wide">Descricao da performance</div>
            <p className="text-white/60 text-sm mt-2 leading-relaxed">{performanceDescription}</p>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-white text-sm font-medium">Criadoras da agencia</h2>
              <p className="text-white/30 text-xs mt-0.5">Desempenho filtrado pela semana atual da agencia.</p>
            </div>
            <span className="text-white/30 text-xs">{int(creators.length)} criadoras</span>
          </div>

          <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-white/5">
                    {[
                      'Criadora',
                      'Min. pagos',
                      'Min. online',
                      'Presentes',
                      'Ganho',
                      'Comissao',
                      'Status',
                      'Faltam min. pagos',
                      'Faltam min. online',
                    ].map(header => (
                      <th key={header} className="text-left text-white/30 text-xs px-4 py-3">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {creators.map((creator, index) => {
                    const paidMinutes = creator.paid_minutes
                    const onlineMinutes = creator.online_minutes
                    const gifts = creator.gifts_count
                    const creatorGain = creator.creator_total_usd
                    const status = firstText(
                      creator.performance_label,
                      creator.performance_status
                    )
                    const missingPaid = creator.paid_minutes_missing
                    const missingOnline = creator.online_minutes_missing

                    return (
                      <tr key={creator.creator_id ?? `${creator.creator_name ?? 'creator'}-${index}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-white text-xs font-medium">{creator.creator_name ?? '-'}</td>
                        <td className="px-4 py-3 text-white/50 text-xs">{int(paidMinutes)}</td>
                        <td className="px-4 py-3 text-white/50 text-xs">{int(onlineMinutes)}</td>
                        <td className="px-4 py-3 text-white/50 text-xs">{int(gifts)}</td>
                        <td className="px-4 py-3 text-green-300 text-xs font-medium">{usd(creatorGain)}</td>
                        <td className="px-4 py-3 text-[#ff4d7d] text-xs font-medium">{usd(creator.agency_commission_usd)}</td>
                        <td className="px-4 py-3 text-white/55 text-xs">{status ?? '-'}</td>
                        <td className="px-4 py-3 text-yellow-300 text-xs">{int(missingPaid)}</td>
                        <td className="px-4 py-3 text-yellow-300 text-xs">{int(missingOnline)}</td>
                      </tr>
                    )
                  })}

                  {creators.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-white/30 text-xs">
                        Nenhuma criadora encontrada para esta agencia na semana selecionada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

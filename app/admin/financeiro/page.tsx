import { createAdminClient } from '@/lib/supabase/server'
import PayoutsTable from './PayoutsTable'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type AdminWeeklyClosure = {
  week_start: string | null
  week_end: string | null
  payout_release_at_brt: string | null
  closure_status: string | null
  creator_base_usd: number | null
  creator_bonus_usd: number | null
  creator_total_usd: number | null
  agency_commission_usd: number | null
  total_paid_minutes: number | null
  total_online_minutes: number | null
  total_gifts_count: number | null
  payout_requests_count: number | null
  pending_payouts_count: number | null
  approved_payouts_count: number | null
  paid_payouts_count: number | null
  review_or_blocked_payouts_count: number | null
  payout_gross_usd: number | null
  payout_fee_usd: number | null
  payout_net_usd: number | null
  payout_gross_brl: number | null
  payout_fee_brl: number | null
  payout_net_brl: number | null
}

type AdminPayout = {
  payout_id: string
  payout_type: string | null
  user_email: string | null
  creator_name: string | null
  agency_name: string | null
  amount_usd: number | null
  amount_brl: number | null
  fee_amount_usd: number | null
  fee_amount_brl: number | null
  net_amount_usd: number | null
  net_amount_brl: number | null
  payment_method: string | null
  pix_key: string | null
  status: string | null
  fee_description: string | null
  review_notes: string | null
  rejection_reason: string | null
  metadata: Record<string, unknown> | null
  created_at: string | null
}

type AgencyRanking = {
  score_rank: number | null
  agency_name: string | null
  agency_score: number | null
  agency_score_label_pt: string | null
  linked_creators_count: number | null
  creators_with_activity_count: number | null
  fully_active_creators_count: number | null
  total_paid_minutes: number | null
  total_online_minutes: number | null
  agency_commission_usd: number | null
}

const usd = (value: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(Number(value ?? 0))

const brl = (value: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value ?? 0))

const int = (value: number | null | undefined) =>
  new Intl.NumberFormat('pt-BR').format(Number(value ?? 0))

const date = (value: string | null | undefined) => {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString('pt-BR')
}

const weekLabel = (week: unknown) => {
  if (!week) return '—'
  if (typeof week === 'string' || typeof week === 'number') return String(week)
  if (Array.isArray(week)) return weekLabel(week[0])

  const row = week as Record<string, unknown>
  return String(row.week_label ?? row.week_start ?? row.start_date ?? row.id ?? '—')
}

export default async function AdminFinanceiroPage() {
  const admin = createAdminClient() as any

  const [currentWeekResult, previousWeekResult, closureResult, payoutResult] = await Promise.all([
    admin.rpc('get_current_bloom_week'),
    admin.rpc('get_previous_bloom_week'),
    admin
      .from('admin_weekly_closure_summary')
      .select('*')
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('admin_payout_dashboard')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  const closure = closureResult.data as AdminWeeklyClosure | null
  const payouts = (payoutResult.data ?? []) as AdminPayout[]

  const { data: agencyRankingData } = closure
    ? await admin
        .from('agency_ranking_weekly')
        .select('*')
        .eq('week_start', closure.week_start)
        .eq('week_end', closure.week_end)
        .order('score_rank', { ascending: true })
    : { data: [] }

  const agencyRanking = (agencyRankingData ?? []) as AgencyRanking[]

  const cards = [
    { label: 'Semana atual', value: weekLabel(currentWeekResult.data), desc: `Anterior: ${weekLabel(previousWeekResult.data)}` },
    { label: 'Liberação de pagamento', value: date(closure?.payout_release_at_brt), desc: closure?.closure_status ?? 'processing' },
    { label: 'Status', value: closure?.closure_status ?? 'processing', desc: `Solicitações: ${int(closure?.payout_requests_count)}` },
    { label: 'Ganhos criadoras', value: usd(closure?.creator_total_usd ?? closure?.creator_base_usd), desc: `Base: ${usd(closure?.creator_base_usd)}` },
    { label: 'Bônus', value: usd(closure?.creator_bonus_usd), desc: 'USD' },
    { label: 'Comissão agências', value: usd(closure?.agency_commission_usd), desc: 'USD' },
    { label: 'Minutos pagos', value: int(closure?.total_paid_minutes), desc: 'chat/vídeo' },
    { label: 'Minutos online', value: int(closure?.total_online_minutes), desc: 'presença real' },
    { label: 'Presentes', value: int(closure?.total_gifts_count), desc: 'quantidade' },
    { label: 'Saques pendentes', value: int(closure?.pending_payouts_count), desc: `${int(closure?.approved_payouts_count)} aprovados · ${int(closure?.paid_payouts_count)} pagos` },
    { label: 'Em análise/bloqueados', value: int(closure?.review_or_blocked_payouts_count), desc: 'requer ação' },
    { label: 'Saques líquidos', value: usd(closure?.payout_net_usd), desc: brl(closure?.payout_net_brl) },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-white text-xl font-medium">Financeiro Bloom</h1>
        <p className="text-white/35 text-xs mt-1">Fechamento semanal, saques e ranking de agências.</p>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(card => (
          <div key={card.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className="text-white/30 text-[11px] uppercase tracking-wide">{card.label}</div>
            <div className="text-white text-lg font-medium mt-2 break-words">{card.value}</div>
            <div className="text-white/25 text-xs mt-1">{card.desc}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="bg-[#111] rounded-xl p-4 border border-white/5">
          <div className="text-white/30 text-xs">Saques brutos</div>
          <div className="text-white text-lg font-medium mt-2">{usd(closure?.payout_gross_usd)}</div>
          <div className="text-white/25 text-xs mt-1">{brl(closure?.payout_gross_brl)}</div>
        </div>
        <div className="bg-[#111] rounded-xl p-4 border border-white/5">
          <div className="text-white/30 text-xs">Taxas de saque</div>
          <div className="text-white text-lg font-medium mt-2">{usd(closure?.payout_fee_usd)}</div>
          <div className="text-white/25 text-xs mt-1">{brl(closure?.payout_fee_brl)}</div>
        </div>
        <div className="bg-[#111] rounded-xl p-4 border border-white/5">
          <div className="text-white/30 text-xs">Saques líquidos</div>
          <div className="text-green-300 text-lg font-medium mt-2">{usd(closure?.payout_net_usd)}</div>
          <div className="text-white/25 text-xs mt-1">{brl(closure?.payout_net_brl)}</div>
        </div>
      </section>

      <PayoutsTable payouts={payouts} />

      <section>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-white text-sm font-medium">Ranking de agências</h2>
            <p className="text-white/30 text-xs mt-0.5">Filtrado pela mesma semana do fechamento.</p>
          </div>
          <span className="text-white/30 text-xs">{int(agencyRanking.length)} agências</span>
        </div>

        <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/5">
                  {['Posição', 'Agência', 'Score', 'Nível', 'Vinculadas', 'Com atividade', 'Plenamente ativas', 'Min. pagos', 'Min. online', 'Comissão'].map(header => (
                    <th key={header} className="text-left text-white/30 text-xs px-4 py-3">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agencyRanking.map((agency, index) => (
                  <tr key={`${agency.score_rank ?? index}-${agency.agency_name ?? 'agency'}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-yellow-300 text-xs font-medium">#{agency.score_rank ?? index + 1}</td>
                    <td className="px-4 py-3 text-white text-xs">{agency.agency_name ?? '—'}</td>
                    <td className="px-4 py-3 text-white/65 text-xs">{int(agency.agency_score)}</td>
                    <td className="px-4 py-3 text-white/45 text-xs">{agency.agency_score_label_pt ?? '—'}</td>
                    <td className="px-4 py-3 text-white/45 text-xs">{int(agency.linked_creators_count)}</td>
                    <td className="px-4 py-3 text-white/45 text-xs">{int(agency.creators_with_activity_count)}</td>
                    <td className="px-4 py-3 text-green-300 text-xs">{int(agency.fully_active_creators_count)}</td>
                    <td className="px-4 py-3 text-white/45 text-xs">{int(agency.total_paid_minutes)}</td>
                    <td className="px-4 py-3 text-white/45 text-xs">{int(agency.total_online_minutes)}</td>
                    <td className="px-4 py-3 text-[#ff4d7d] text-xs font-medium">{usd(agency.agency_commission_usd)}</td>
                  </tr>
                ))}

                {agencyRanking.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-white/30 text-xs">Nenhuma agência encontrada no ranking semanal.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

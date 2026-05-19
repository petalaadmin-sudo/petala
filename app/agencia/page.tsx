'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type AgencyDashboard = {
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
  agency_name: string | null
  agency_score: number | null
  agency_score_label_pt: string | null
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

type AgencyPayload = {
  currentWeek: unknown
  dashboard: AgencyDashboard | null
  creators: CreatorPerformance[]
  ranking: AgencyRanking | null
  agencyUserRole: string | null
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

const firstText = (...values: Array<string | null | undefined>) =>
  values.find(value => value && value.trim().length > 0) ?? null

function AccessDenied() {
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

export default function AgenciaPage() {
  const router = useRouter()
  const [payload, setPayload] = useState<AgencyPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/agencia/dashboard', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      if (response.status === 403) {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      const result = await response.json()

      if (!response.ok || !result?.success) {
        setAccessDenied(true)
        setLoading(false)
        return
      }

      setPayload(result.data)
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff4d7d]/30 border-t-[#ff4d7d] rounded-full animate-spin" />
      </main>
    )
  }

  if (accessDenied || !payload) return <AccessDenied />

  const { currentWeek, dashboard, creators, ranking, agencyUserRole } = payload
  const performanceLevel = firstText(dashboard?.agency_score_label_pt, ranking?.agency_score_label_pt)
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
              {dashboard?.agency_name ?? ranking?.agency_name ?? 'Agencia'} - {weekLabel(currentWeek, dashboard?.week_start, dashboard?.week_end)}
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#111] px-4 py-3">
            <div className="text-white/30 text-[11px] uppercase tracking-wide">Vinculo</div>
            <div className="text-white/70 text-sm mt-1">{agencyUserRole ?? 'agency'}</div>
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
                    const status = firstText(creator.performance_label, creator.performance_status)

                    return (
                      <tr key={creator.creator_id ?? `${creator.creator_name ?? 'creator'}-${index}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-white text-xs font-medium">{creator.creator_name ?? '-'}</td>
                        <td className="px-4 py-3 text-white/50 text-xs">{int(creator.paid_minutes)}</td>
                        <td className="px-4 py-3 text-white/50 text-xs">{int(creator.online_minutes)}</td>
                        <td className="px-4 py-3 text-white/50 text-xs">{int(creator.gifts_count)}</td>
                        <td className="px-4 py-3 text-green-300 text-xs font-medium">{usd(creator.creator_total_usd)}</td>
                        <td className="px-4 py-3 text-[#ff4d7d] text-xs font-medium">{usd(creator.agency_commission_usd)}</td>
                        <td className="px-4 py-3 text-white/55 text-xs">{status ?? '-'}</td>
                        <td className="px-4 py-3 text-yellow-300 text-xs">{int(creator.paid_minutes_missing)}</td>
                        <td className="px-4 py-3 text-yellow-300 text-xs">{int(creator.online_minutes_missing)}</td>
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

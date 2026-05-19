'use client'

import { useMemo, useState } from 'react'
import PayoutActions from './PayoutActions'

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

type PayoutFilter = 'all' | 'pending' | 'approved' | 'paid' | 'review' | 'rejected' | 'tests'

type PayoutsTableProps = {
  payouts: AdminPayout[]
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

const statusClass = (status: string | null | undefined) => {
  const normalizedStatus = (status ?? '').toLowerCase()

  if (['paid', 'completed', 'released', 'approved'].includes(normalizedStatus)) return 'bg-green-400/15 text-green-300'
  if (['pending', 'processing', 'review', 'in_review', 'under_review'].includes(normalizedStatus)) return 'bg-yellow-400/15 text-yellow-300'
  if (['blocked', 'rejected', 'cancelled', 'failed'].includes(normalizedStatus)) return 'bg-red-400/15 text-red-300'
  return 'bg-white/10 text-white/45'
}

const dualAmount = (usdValue: number | null, brlValue: number | null) =>
  `${usd(usdValue)}${brlValue ? ` · ${brl(brlValue)}` : ''}`

const isTestPayout = (payout: AdminPayout) =>
  payout.metadata?.test_record === true || payout.metadata?.excluded_from_real_payouts === true

const normalizedStatus = (payout: AdminPayout) => (payout.status ?? '').toLowerCase()

const matchesFilter = (payout: AdminPayout, filter: PayoutFilter) => {
  const status = normalizedStatus(payout)

  if (filter === 'all') return true
  if (filter === 'tests') return isTestPayout(payout)
  if (filter === 'pending') return status === 'pending'
  if (filter === 'approved') return status === 'approved'
  if (filter === 'paid') return status === 'paid'
  if (filter === 'review') return ['under_review', 'review', 'in_review', 'blocked'].includes(status)
  if (filter === 'rejected') return ['rejected', 'cancelled'].includes(status)

  return true
}

export default function PayoutsTable({ payouts }: PayoutsTableProps) {
  const [activeFilter, setActiveFilter] = useState<PayoutFilter>('all')

  const filters = useMemo(
    () => [
      { id: 'all' as const, label: 'Todos', count: payouts.length },
      { id: 'pending' as const, label: 'Pendentes', count: payouts.filter(payout => matchesFilter(payout, 'pending')).length },
      { id: 'approved' as const, label: 'Aprovados', count: payouts.filter(payout => matchesFilter(payout, 'approved')).length },
      { id: 'paid' as const, label: 'Pagos', count: payouts.filter(payout => matchesFilter(payout, 'paid')).length },
      { id: 'review' as const, label: 'Em análise/bloqueados', count: payouts.filter(payout => matchesFilter(payout, 'review')).length },
      { id: 'rejected' as const, label: 'Rejeitados/cancelados', count: payouts.filter(payout => matchesFilter(payout, 'rejected')).length },
      { id: 'tests' as const, label: 'Testes', count: payouts.filter(isTestPayout).length },
    ],
    [payouts]
  )

  const filteredPayouts = useMemo(
    () => payouts.filter(payout => matchesFilter(payout, activeFilter)),
    [activeFilter, payouts]
  )

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-white text-sm font-medium">Saques</h2>
          <p className="text-white/30 text-xs mt-0.5">Filtre por status para revisar e executar ações administrativas.</p>
        </div>
        <span className="text-white/30 text-xs">{int(filteredPayouts.length)} de {int(payouts.length)} registros</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {filters.map(filter => {
          const isActive = activeFilter === filter.id

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`rounded-md px-3 py-1.5 text-xs ${
                isActive
                  ? 'bg-[#ff4d7d] text-white'
                  : 'bg-white/5 text-white/45 hover:bg-white/10 hover:text-white'
              }`}
            >
              {filter.label} ({int(filter.count)})
            </button>
          )
        })}
      </div>

      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-white/5">
                {['Tipo', 'Criadora/agência', 'Valores', 'Método', 'Status', 'Data', 'Observações', 'Ações'].map(header => (
                  <th key={header} className="text-left text-white/30 text-xs px-4 py-3">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPayouts.map(payout => {
                const recipientName = payout.creator_name ?? payout.agency_name ?? payout.user_email ?? '—'
                const notes = payout.review_notes ?? payout.rejection_reason ?? payout.fee_description ?? '—'
                const isTest = isTestPayout(payout)

                return (
                  <tr key={payout.payout_id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white/55 text-xs align-top">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-white/65">{payout.payout_type ?? '—'}</span>
                        {isTest && <span className="rounded-full bg-blue-400/15 px-2 py-0.5 text-[10px] text-blue-300">teste</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white text-xs align-top min-w-[190px]">
                      <div className="font-medium leading-snug">{recipientName}</div>
                      {payout.user_email && <div className="text-white/25 mt-1 leading-snug break-all">{payout.user_email}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs align-top min-w-[180px]">
                      <div className="text-green-300 font-medium">Líquido: {dualAmount(payout.net_amount_usd, payout.net_amount_brl)}</div>
                      <div className="text-white/35 mt-1">Bruto: {dualAmount(payout.amount_usd, payout.amount_brl)}</div>
                      <div className="text-white/30 mt-0.5">Taxa: {dualAmount(payout.fee_amount_usd, payout.fee_amount_brl)}</div>
                    </td>
                    <td className="px-4 py-3 text-white/45 text-xs align-top max-w-[130px]">
                      <div className="truncate">{payout.payment_method ?? '—'}</div>
                      {payout.pix_key && <div className="text-white/25 mt-0.5 truncate max-w-[140px]">{payout.pix_key}</div>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`text-[11px] px-2 py-1 rounded-full ${statusClass(payout.status)}`}>{payout.status ?? 'pending'}</span>
                    </td>
                    <td className="px-4 py-3 text-white/35 text-xs align-top whitespace-nowrap">{date(payout.created_at)}</td>
                    <td className="px-4 py-3 text-white/35 text-xs align-top max-w-[220px]">
                      <div className="line-clamp-2">{notes}</div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <PayoutActions payoutId={payout.payout_id} status={payout.status} />
                    </td>
                  </tr>
                )
              })}

              {filteredPayouts.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-white/30 text-xs">Nenhum saque encontrado para este filtro.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

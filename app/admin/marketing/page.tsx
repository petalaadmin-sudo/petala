'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FINANCIAL_ACTION_BLOCKED_MESSAGE =
  'Ajustes manuais de pétalas estão temporariamente bloqueados. Um fluxo auditável com lote, ledger, motivo obrigatório e idempotência será implementado em bloco financeiro próprio.'

export default function AdminMarketingPage() {
  const supabase = createClient()
  const [dados, setDados] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [referralsRes, commissionsRes, usersRes] = await Promise.all([
        supabase.from('users').select('id, email, username, referral_code, referred_by, first_purchase_done, created_at').not('referral_code', 'is', null).order('created_at', { ascending: false }).limit(50),
        supabase.from('referral_commissions').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('users').select('id, created_at').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ])

      const totalIndicacoes = referralsRes.data?.filter(u => u.referred_by).length ?? 0
      const totalComissoes = commissionsRes.data?.reduce((sum, c) => sum + Number(c.amount || 0), 0) ?? 0
      const comPrimCompra = referralsRes.data?.filter(u => u.first_purchase_done).length ?? 0
      const taxaConversao = totalIndicacoes > 0 ? Math.round((comPrimCompra / totalIndicacoes) * 100) : 0

      setDados({
        referrals: referralsRes.data,
        commissions: commissionsRes.data,
        totalIndicacoes,
        totalComissoes,
        comPrimCompra,
        taxaConversao,
        novos7dias: usersRes.data?.length ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-white/30 text-sm">Carregando...</div></div>

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Marketing e Crescimento</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total indicacoes', value: dados.totalIndicacoes, icon: 'I', color: 'text-white' },
          { label: 'Com 1a compra', value: dados.comPrimCompra, icon: 'OK', color: 'text-green-400' },
          { label: 'Taxa conversao', value: `${dados.taxaConversao}%`, icon: '%', color: 'text-blue-400' },
          { label: 'Novos (7 dias)', value: dados.novos7dias, icon: '+', color: 'text-[#ff4d7d]' },
        ].map(s => (
          <div key={s.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
            <div className="text-white/30 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#111] rounded-xl p-5 border border-white/5 mb-8">
        <h2 className="text-white text-sm font-medium mb-4">Bonus por codigo de indicacao</h2>
        <div className="mb-4 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-yellow-100 text-xs leading-relaxed">
          {FINANCIAL_ACTION_BLOCKED_MESSAGE}
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Codigo de indicacao"
            disabled
            className="flex-1 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 outline-none disabled:cursor-not-allowed disabled:opacity-45"
          />
          <input
            type="number"
            placeholder="Petalas"
            disabled
            className="w-32 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 outline-none disabled:cursor-not-allowed disabled:opacity-45"
          />
          <button
            disabled
            className="bg-[#ff4d7d] text-white rounded-xl px-5 py-2.5 text-sm font-medium opacity-40 cursor-not-allowed"
          >
            Bloqueado
          </button>
        </div>
      </div>

      <h2 className="text-white/50 text-sm mb-4">Programa de indicacao</h2>
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs px-4 py-3">Email</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Codigo</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Indicado</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">1a compra</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {dados.referrals?.map((u: any) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                  <td className="px-4 py-3 text-white/50 text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-[#ff4d7d] text-xs font-mono">{u.referral_code || '-'}</td>
                  <td className="px-4 py-3 text-white/30 text-xs">{u.referred_by ? 'Sim' : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.first_purchase_done ? 'bg-green-400/20 text-green-400' : 'bg-white/5 text-white/30'}`}>
                      {u.first_purchase_done ? 'Sim' : 'Nao'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs">
                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

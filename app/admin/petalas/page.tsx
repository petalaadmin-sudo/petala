'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const FINANCIAL_ACTION_BLOCKED_MESSAGE =
  'Ajustes manuais de pétalas estão temporariamente bloqueados. Um fluxo auditável com lote, ledger, motivo obrigatório e idempotência será implementado em bloco financeiro próprio.'

export default function AdminPetalasPage() {
  const supabase = createClient()
  const [dados, setDados] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [pacotesRes, topUsersRes, txRes] = await Promise.all([
        supabase.from('petal_packages').select('*').order('price_brl', { ascending: true }),
        supabase.from('users').select('id, email, username, balance_petals').order('balance_petals', { ascending: false }).limit(10),
        supabase.from('transactions').select('petals_delta, type, status').eq('status', 'completed'),
      ])

      const totalPetalasVendidas = txRes.data?.filter(t => t.type === 'purchase')
        .reduce((sum, t) => sum + (t.petals_delta || 0), 0) ?? 0

      setDados({ pacotes: pacotesRes.data, topUsers: topUsersRes.data, totalPetalasVendidas })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-white/30 text-sm">Carregando...</div></div>

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Sistema de Petalas</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: 'Total petalas vendidas', value: dados.totalPetalasVendidas.toLocaleString('pt-BR'), icon: 'P', color: 'text-[#ff4d7d]' },
          { label: 'Pacotes disponiveis', value: dados.pacotes?.length ?? 0, icon: '#', color: 'text-white' },
        ].map(s => (
          <div key={s.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
            <div className="text-white/30 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-[#111] rounded-xl p-5 border border-white/5 mb-8">
        <h2 className="text-white text-sm font-medium mb-4">Dar bonus de petalas</h2>
        <div className="mb-4 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-yellow-100 text-xs leading-relaxed">
          {FINANCIAL_ACTION_BLOCKED_MESSAGE}
        </div>
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="Email do usuario"
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

      <h2 className="text-white/50 text-sm mb-4">Pacotes de petalas</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {dados.pacotes?.map((p: any) => (
          <div key={p.id} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className="text-[#ff4d7d] text-lg font-medium">{p.petals?.toLocaleString('pt-BR')} petalas</div>
            <div className="text-white/50 text-sm mt-1">{p.name}</div>
            <div className="text-yellow-400 text-sm font-medium mt-2">
              R$ {Number(p.price_brl).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      <h2 className="text-white/50 text-sm mb-4">Top usuarios por saldo</h2>
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left text-white/30 text-xs px-4 py-3">#</th>
              <th className="text-left text-white/30 text-xs px-4 py-3">Email</th>
              <th className="text-left text-white/30 text-xs px-4 py-3">Username</th>
              <th className="text-left text-white/30 text-xs px-4 py-3">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {dados.topUsers?.map((u: any, i: number) => (
              <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-all">
                <td className="px-4 py-3 text-white/20 text-sm">{i + 1}</td>
                <td className="px-4 py-3 text-white/50 text-xs">{u.email}</td>
                <td className="px-4 py-3 text-white/40 text-xs">{u.username || '-'}</td>
                <td className="px-4 py-3 text-[#ff4d7d] text-sm font-medium">
                  {u.balance_petals?.toLocaleString('pt-BR')} petalas
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

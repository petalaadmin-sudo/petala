'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminTrustPage() {
  const supabase = createClient()
  const router = useRouter()
  const [dados, setDados] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (userData?.role !== 'admin') { router.push('/feed'); return }

      const [usersRes, txRes, multiRes] = await Promise.all([
        supabase.from('users').select('id, email, created_at, balance_petals, first_purchase_done').order('created_at', { ascending: false }).limit(100),
        supabase.from('transactions').select('user_id, amount_brl, created_at, status').eq('status', 'completed').order('created_at', { ascending: false }).limit(200),
        supabase.from('users').select('email').order('created_at', { ascending: false }),
      ])

      // Detecta possíveis multi-contas (mesmo domínio de email)
      const dominios: Record<string, number> = {}
      multiRes.data?.forEach(u => {
        const dominio = u.email.split('@')[1]
        dominios[dominio] = (dominios[dominio] || 0) + 1
      })
      const dominiosSuspeitos = Object.entries(dominios)
        .filter(([d, c]) => c > 2 && !['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'].includes(d))
        .map(([dominio, count]) => ({ dominio, count }))

      // Detecta usuários com alto saldo sem compras
      const suspeitos = usersRes.data?.filter(u => u.balance_petals > 1000 && !u.first_purchase_done) ?? []

      // Detecta transações grandes
      const txGrandes = txRes.data?.filter(tx => Number(tx.amount_brl) > 100) ?? []

      setDados({ suspeitos, dominiosSuspeitos, txGrandes, totalUsers: usersRes.data?.length ?? 0 })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-white/30 text-sm">Carregando...</div></div>

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Trust & Safety</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Usuários suspeitos', value: dados.suspeitos.length, icon: '⚠️', color: dados.suspeitos.length > 0 ? 'text-yellow-400' : 'text-white' },
          { label: 'Domínios suspeitos', value: dados.dominiosSuspeitos.length, icon: '🔍', color: dados.dominiosSuspeitos.length > 0 ? 'text-orange-400' : 'text-white' },
          { label: 'Tx grandes (+R$100)', value: dados.txGrandes.length, icon: '💸', color: dados.txGrandes.length > 0 ? 'text-red-400' : 'text-white' },
        ].map(s => (
          <div key={s.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
            <div className="text-white/30 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Usuários suspeitos */}
      <h2 className="text-white/50 text-sm mb-3">⚠️ Alto saldo sem compra registrada</h2>
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden mb-6">
        {dados.suspeitos.length === 0 ? (
          <div className="p-6 text-center text-white/20 text-sm">✅ Nenhum usuário suspeito encontrado</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs px-4 py-3">Email</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Saldo</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {dados.suspeitos.map((u: any) => (
                <tr key={u.id} className="border-b border-white/5">
                  <td className="px-4 py-3 text-yellow-400 text-xs">{u.email}</td>
                  <td className="px-4 py-3 text-[#ff4d7d] text-xs">{u.balance_petals} 🌸</td>
                  <td className="px-4 py-3 text-white/30 text-xs">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Domínios suspeitos */}
      <h2 className="text-white/50 text-sm mb-3">🔍 Domínios com múltiplas contas</h2>
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden mb-6">
        {dados.dominiosSuspeitos.length === 0 ? (
          <div className="p-6 text-center text-white/20 text-sm">✅ Nenhum domínio suspeito encontrado</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs px-4 py-3">Domínio</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Contas</th>
              </tr>
            </thead>
            <tbody>
              {dados.dominiosSuspeitos.map((d: any) => (
                <tr key={d.dominio} className="border-b border-white/5">
                  <td className="px-4 py-3 text-orange-400 text-xs">{d.dominio}</td>
                  <td className="px-4 py-3 text-white/50 text-xs">{d.count} contas</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Transações grandes */}
      <h2 className="text-white/50 text-sm mb-3">💸 Transações acima de R$ 100</h2>
      <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
        {dados.txGrandes.length === 0 ? (
          <div className="p-6 text-center text-white/20 text-sm">✅ Nenhuma transação grande encontrada</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-white/30 text-xs px-4 py-3">Usuário</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Valor</th>
                <th className="text-left text-white/30 text-xs px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {dados.txGrandes.map((tx: any, i: number) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="px-4 py-3 text-white/50 text-xs">{tx.user_id}</td>
                  <td className="px-4 py-3 text-red-400 text-xs font-medium">R$ {Number(tx.amount_brl).toFixed(2)}</td>
                  <td className="px-4 py-3 text-white/30 text-xs">{new Date(tx.created_at).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
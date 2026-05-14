'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminPetalasPage() {
  const supabase = createClient()
  const router = useRouter()
  const [dados, setDados] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bonus, setBonus] = useState({ email: '', amount: '' })
  const [enviando, setEnviando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (userData?.role !== 'admin') { router.push('/feed'); return }

      const [pacotesRes, topUsersRes, txRes] = await Promise.all([
        supabase.from('petal_packages').select('*').order('price', { ascending: true }),
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

  async function darBonus() {
    if (!bonus.email || !bonus.amount) return
    setEnviando(true)
    setMensagem('')

    const { data: userData } = await supabase.from('users').select('id, balance_petals').eq('email', bonus.email).single()

    if (!userData) {
      setMensagem('❌ Usuário não encontrado')
      setEnviando(false)
      return
    }

    const novoSaldo = (userData.balance_petals || 0) + Number(bonus.amount)
    const { error } = await supabase.from('users').update({ balance_petals: novoSaldo }).eq('id', userData.id)

    if (error) {
      setMensagem('❌ Erro ao dar bônus')
    } else {
      await supabase.from('transactions').insert({
        user_id: userData.id,
        type: 'bonus',
        petals_delta: Number(bonus.amount),
        balance_after: novoSaldo,
        amount_brl: 0,
        status: 'completed',
        metadata: { reason: 'admin_bonus' },
      })
      setMensagem(`✅ ${bonus.amount} pétalas adicionadas para ${bonus.email}`)
      setBonus({ email: '', amount: '' })
    }
    setEnviando(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-white/30 text-sm">Carregando...</div></div>

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Sistema de Pétalas</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
          { label: 'Total pétalas vendidas', value: dados.totalPetalasVendidas.toLocaleString('pt-BR'), icon: '🌸', color: 'text-[#ff4d7d]' },
          { label: 'Pacotes disponíveis', value: dados.pacotes?.length ?? 0, icon: '📦', color: 'text-white' },
        ].map(s => (
          <div key={s.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
            <div className="text-white/30 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Dar bônus */}
      <div className="bg-[#111] rounded-xl p-5 border border-white/5 mb-8">
        <h2 className="text-white text-sm font-medium mb-4">🎁 Dar bônus de pétalas</h2>
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="Email do usuário"
            value={bonus.email}
            onChange={e => setBonus(b => ({ ...b, email: e.target.value }))}
            className="flex-1 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 outline-none focus:border-[#ff4d7d]/50"
          />
          <input
            type="number"
            placeholder="Pétalas"
            value={bonus.amount}
            onChange={e => setBonus(b => ({ ...b, amount: e.target.value }))}
            className="w-32 bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 outline-none focus:border-[#ff4d7d]/50"
          />
          <button
            onClick={darBonus}
            disabled={enviando}
            className="bg-[#ff4d7d] text-white rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {enviando ? '...' : 'Dar bônus'}
          </button>
        </div>
        {mensagem && <div className="mt-3 text-sm text-white/60">{mensagem}</div>}
      </div>

      {/* Pacotes */}
      <h2 className="text-white/50 text-sm mb-4">Pacotes de pétalas</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {dados.pacotes?.map((p: any) => (
          <div key={p.id} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className="text-[#ff4d7d] text-lg font-medium">{p.petals?.toLocaleString('pt-BR')} 🌸</div>
            <div className="text-white/50 text-sm mt-1">{p.name}</div>
            <div className="text-yellow-400 text-sm font-medium mt-2">
              R$ {(p.price / 100).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Top usuários */}
      <h2 className="text-white/50 text-sm mb-4">Top usuários por saldo</h2>
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
                <td className="px-4 py-3 text-white/40 text-xs">{u.username || '—'}</td>
                <td className="px-4 py-3 text-[#ff4d7d] text-sm font-medium">
                  {u.balance_petals?.toLocaleString('pt-BR')} 🌸
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
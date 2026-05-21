'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<any>(null)
  const [alertas, setAlertas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)
      const ontem = new Date(hoje)
      ontem.setDate(ontem.getDate() - 1)

      const [
        creatorsRes, usersRes, txRes, newUsersRes,
        pendingVerif, livesAtivas, newUsersOntem
      ] = await Promise.all([
        supabase.from('criadores').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('amount_brl, created_at').eq('status', 'completed').eq('type', 'purchase'),
        supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', hoje.toISOString()),
        supabase.from('verificações_do_criador').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('vidas').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', ontem.toISOString()).lt('created_at', hoje.toISOString()),
      ])

      const totalRevenue = txRes.data?.reduce((sum, tx) => sum + Number(tx.amount_brl || 0), 0) ?? 0
      const revenueHoje = txRes.data?.filter(tx => new Date(tx.created_at) >= hoje)
        .reduce((sum, tx) => sum + Number(tx.amount_brl || 0), 0) ?? 0
      const txCount = txRes.data?.length ?? 0
      const ticketMedio = txCount > 0 ? totalRevenue / txCount : 0
      const novosHoje = newUsersRes.count ?? 0
      const novosOntem = Math.max(newUsersOntem.count ?? 1, 1)
      const retencaoD1 = Math.round((novosHoje / novosOntem) * 100)

      setStats({
        creators: creatorsRes.count ?? 0,
        users: usersRes.count ?? 0,
        revenue: totalRevenue,
        revenueHoje,
        newUsersToday: novosHoje,
        ticketMedio,
        retencaoD1,
        livesAtivas: livesAtivas.count ?? 0,
        pendingVerif: pendingVerif.count ?? 0,
      })

      const novosAlertas = []
      if ((pendingVerif.count ?? 0) > 0)
        novosAlertas.push({ tipo: 'warning', msg: `${pendingVerif.count} verificação(ões) pendente(s)`, href: '/admin/moderacao' })
      if ((livesAtivas.count ?? 0) > 0)
        novosAlertas.push({ tipo: 'info', msg: `${livesAtivas.count} live(s) ao vivo agora`, href: '/admin/lives' })
      if (revenueHoje > 0)
        novosAlertas.push({ tipo: 'success', msg: `R$ ${revenueHoje.toFixed(2)} de receita hoje`, href: '/admin/financeiro' })
      setAlertas(novosAlertas)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-white/30 text-sm animate-pulse">Carregando dashboard...</div>
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-white text-2xl font-semibold">Dashboard</h1>
        <p className="text-white/30 text-sm mt-1">Central operacional do Pétala</p>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="flex flex-col gap-2 mb-8">
          {alertas.map((a, i) => (
            <a key={i} href={a.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all ${
              a.tipo === 'warning' ? 'bg-yellow-400/10 border-yellow-400/20 text-yellow-400 hover:bg-yellow-400/15' :
              a.tipo === 'success' ? 'bg-green-400/10 border-green-400/20 text-green-400 hover:bg-green-400/15' :
              'bg-blue-400/10 border-blue-400/20 text-blue-400 hover:bg-blue-400/15'
            }`}>
              <span>{a.tipo === 'warning' ? '⚠️' : a.tipo === 'success' ? '✅' : 'ℹ️'}</span>
              <span>{a.msg}</span>
              <span className="ml-auto opacity-50">→</span>
            </a>
          ))}
        </div>
      )}

      {/* KPIs principais com gradiente */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-gradient-to-br from-[#ff4d7d]/20 to-[#ff4d7d]/5 rounded-2xl p-5 border border-[#ff4d7d]/20">
          <div className="text-3xl mb-3">🌸</div>
          <div className="text-3xl font-bold text-[#ff4d7d]">{stats.creators}</div>
          <div className="text-white/40 text-xs mt-1">Criadoras ativas</div>
        </div>
        <div className="bg-gradient-to-br from-white/10 to-white/3 rounded-2xl p-5 border border-white/10">
          <div className="text-3xl mb-3">👥</div>
          <div className="text-3xl font-bold text-white">{stats.users}</div>
          <div className="text-white/40 text-xs mt-1">Usuários totais</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-400/20 to-yellow-400/5 rounded-2xl p-5 border border-yellow-400/20">
          <div className="text-3xl mb-3">💰</div>
          <div className="text-3xl font-bold text-yellow-400">R$ {stats.revenue.toFixed(0)}</div>
          <div className="text-white/40 text-xs mt-1">Receita total</div>
        </div>
        <div className="bg-gradient-to-br from-green-400/20 to-green-400/5 rounded-2xl p-5 border border-green-400/20">
          <div className="text-3xl mb-3">🆕</div>
          <div className="text-3xl font-bold text-green-400">{stats.newUsersToday}</div>
          <div className="text-white/40 text-xs mt-1">Novos hoje</div>
        </div>
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Receita hoje', value: `R$ ${stats.revenueHoje.toFixed(2)}`, icon: '📅', color: 'text-green-400' },
          { label: 'Ticket médio', value: `R$ ${stats.ticketMedio.toFixed(2)}`, icon: '🎫', color: 'text-white' },
          { label: 'Lives ativas', value: stats.livesAtivas, icon: '🔴', color: 'text-red-400' },
          { label: 'Retenção D1', value: `${stats.retencaoD1}%`, icon: '📊', color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className="text-xl mb-2">{s.icon}</div>
            <div className={`text-xl font-semibold ${s.color}`}>{s.value}</div>
            <div className="text-white/30 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Acesso rápido */}
      <h2 className="text-white/40 text-xs uppercase tracking-wider mb-4">Acesso rápido</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: '/admin/usuarios', icon: '👥', label: 'Usuários', desc: 'Gerenciar contas' },
          { href: '/admin/criadoras', icon: '🌸', label: 'Criadoras', desc: 'Score e níveis' },
          { href: '/admin/financeiro', icon: '💰', label: 'Financeiro', desc: 'Receita e ARPU' },
          { href: '/admin/moderacao', icon: '🛡️', label: 'Moderação', desc: 'Verificações' },
          { href: '/admin/trust', icon: '🔒', label: 'Trust & Safety', desc: 'Antifraude' },
          { href: '/admin/analytics', icon: '📉', label: 'Analytics', desc: 'Gráficos e dados' },
          { href: '/admin/petalas', icon: '✨', label: 'Pétalas', desc: 'Bônus e pacotes' },
          { href: '/admin/marketing', icon: '📈', label: 'Marketing', desc: 'Indicações' },
          { href: '/admin/suporte', icon: '🎧', label: 'Suporte', desc: 'Buscar usuários' },
          { href: '/admin/lives', icon: '🎥', label: 'Lives', desc: 'Histórico' },
        ].map(item => (
          <a key={item.href} href={item.href} className="bg-[#111] rounded-xl p-4 border border-white/5 hover:border-[#ff4d7d]/30 hover:bg-[#ff4d7d]/5 transition-all group">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="text-white/80 text-sm font-medium group-hover:text-white transition-all">{item.label}</div>
            <div className="text-white/20 text-xs mt-0.5">{item.desc}</div>
          </a>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const supabase = createClient()
  const router = useRouter()
  const [stats, setStats] = useState({
    creators: 0,
    users: 0,
    revenue: 0,
    newUsersToday: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'admin') router.push('/feed')

      const [creatorsRes, usersRes, txRes, newUsersRes] = await Promise.all([
        supabase.from('creators').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('amount_brl').eq('status', 'completed').eq('type', 'purchase'),
        supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
      ])

      const totalRevenue = txRes.data?.reduce((sum, tx) => sum + Number(tx.amount_brl || 0), 0) ?? 0

      setStats({
        creators: creatorsRes.count ?? 0,
        users: usersRes.count ?? 0,
        revenue: totalRevenue,
        newUsersToday: newUsersRes.count ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-white/30 text-sm">Carregando...</div>
    </div>
  )

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Criadoras ativas', value: stats.creators, icon: '🌸', color: 'text-[#ff4d7d]' },
          { label: 'Usuários totais', value: stats.users, icon: '👥', color: 'text-white' },
          { label: 'Receita total', value: `R$ ${stats.revenue.toFixed(2)}`, icon: '💰', color: 'text-yellow-400' },
          { label: 'Novos hoje', value: stats.newUsersToday, icon: '🆕', color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
            <div className="text-white/30 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <h2 className="text-white/50 text-sm mb-4">Acesso rápido</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { href: '/admin/usuarios', icon: '👥', label: 'Gerenciar usuários' },
          { href: '/admin/criadoras', icon: '🌸', label: 'Gerenciar criadoras' },
          { href: '/admin/financeiro', icon: '💰', label: 'Financeiro' },
          { href: '/admin/moderacao', icon: '🛡️', label: 'Moderação' },
          { href: '/admin/lives', icon: '🎥', label: 'Lives' },
          { href: '/admin/petalas', icon: '✨', label: 'Pétalas' },
          { href: '/admin/marketing', icon: '📈', label: 'Marketing' },
          { href: '/admin/suporte', icon: '🎧', label: 'Suporte' },
        ].map(item => (
          <a key={item.href} href={item.href} className="bg-[#111] rounded-xl p-4 border border-white/5 hover:border-[#ff4d7d]/30 transition-all group">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="text-white/60 text-sm group-hover:text-white transition-all">{item.label}</div>
          </a>
        ))}
      </div>
    </div>
  )
}
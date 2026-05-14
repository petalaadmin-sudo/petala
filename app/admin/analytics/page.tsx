'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminAnalyticsPage() {
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

      const hoje = new Date()
      const dias = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(hoje)
        d.setDate(d.getDate() - (6 - i))
        d.setHours(0, 0, 0, 0)
        return d
      })

      const [txRes, usersRes, livesRes] = await Promise.all([
        supabase.from('transactions').select('amount_brl, created_at').eq('status', 'completed').eq('type', 'purchase').gte('created_at', dias[0].toISOString()),
        supabase.from('users').select('created_at').gte('created_at', dias[0].toISOString()),
        supabase.from('vidas').select('created_at, started_at, ended_at').gte('created_at', dias[0].toISOString()),
      ])

      const receitaPorDia = dias.map(d => {
        const prox = new Date(d)
        prox.setDate(prox.getDate() + 1)
        const total = txRes.data?.filter(tx => {
          const data = new Date(tx.created_at)
          return data >= d && data < prox
        }).reduce((sum, tx) => sum + Number(tx.amount_brl || 0), 0) ?? 0
        return { dia: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }), total }
      })

      const usuariosPorDia = dias.map(d => {
        const prox = new Date(d)
        prox.setDate(prox.getDate() + 1)
        const count = usersRes.data?.filter(u => {
          const data = new Date(u.created_at)
          return data >= d && data < prox
        }).length ?? 0
        return { dia: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }), count }
      })

      const maxReceita = Math.max(...receitaPorDia.map(d => d.total), 1)
      const maxUsuarios = Math.max(...usuariosPorDia.map(d => d.count), 1)

      const totalMinutos = livesRes.data?.reduce((sum, l) => {
        if (!l.started_at || !l.ended_at) return sum
        return sum + (new Date(l.ended_at).getTime() - new Date(l.started_at).getTime()) / 60000
      }, 0) ?? 0

      setDados({ receitaPorDia, usuariosPorDia, maxReceita, maxUsuarios, totalMinutos, totalTx: txRes.data?.length ?? 0 })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-white/30 text-sm">Carregando...</div></div>

  return (
    <div>
      <h1 className="text-white text-xl font-medium mb-6">Analytics</h1>

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Transações (7 dias)', value: dados.totalTx, icon: '🔄', color: 'text-white' },
          { label: 'Minutos de live', value: `${dados.totalMinutos.toFixed(0)} min`, icon: '🎥', color: 'text-[#ff4d7d]' },
          { label: 'Receita (7 dias)', value: `R$ ${dados.receitaPorDia.reduce((s: number, d: any) => s + d.total, 0).toFixed(2)}`, icon: '💰', color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
            <div className="text-white/30 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gráfico receita */}
      <div className="bg-[#111] rounded-xl p-5 border border-white/5 mb-6">
        <h2 className="text-white/50 text-sm mb-4">Receita por dia (últimos 7 dias)</h2>
        <div className="flex items-end gap-2 h-32">
          {dados.receitaPorDia.map((d: any) => (
            <div key={d.dia} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-yellow-400 text-[10px]">
                {d.total > 0 ? `R$${d.total.toFixed(0)}` : ''}
              </div>
              <div
                className="w-full bg-yellow-400/30 rounded-t-sm transition-all"
                style={{ height: `${Math.max((d.total / dados.maxReceita) * 100, 2)}%` }}
              />
              <div className="text-white/20 text-[9px] text-center">{d.dia}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico usuários */}
      <div className="bg-[#111] rounded-xl p-5 border border-white/5">
        <h2 className="text-white/50 text-sm mb-4">Novos usuários por dia (últimos 7 dias)</h2>
        <div className="flex items-end gap-2 h-32">
          {dados.usuariosPorDia.map((d: any) => (
            <div key={d.dia} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[#ff4d7d] text-[10px]">
                {d.count > 0 ? d.count : ''}
              </div>
              <div
                className="w-full bg-[#ff4d7d]/30 rounded-t-sm transition-all"
                style={{ height: `${Math.max((d.count / dados.maxUsuarios) * 100, 2)}%` }}
              />
              <div className="text-white/20 text-[9px] text-center">{d.dia}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
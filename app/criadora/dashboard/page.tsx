// app/criadora/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCreatorSelfPresence } from '@/lib/hooks/useCreatorPresence'
import { PhotoUploader } from '@/components/album/PhotoUploader'
import { useRouter } from 'next/navigation'

interface DashStats {
  balance: number
  totalGifts: number
  totalEarningsPetals: number
  rating: number
  ratingCount: number
  rankWeekly: number | null
  sessionsToday: number
  recentGifts: { gift_emoji: string; from_user_id: string; petals_spent: number; created_at: string }[]
}

export default function DashboardPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [creatorId, setCreatorId] = useState<string | null>(null)
  const [username, setUsername]   = useState<string>('')
  const [stats, setStats]         = useState<DashStats | null>(null)
  const [tab, setTab]             = useState<'overview' | 'upload' | 'saque'>('overview')
  const [online, setOnlineState]  = useState(false)
  const [loading, setLoading]     = useState(true)
  const [pixKey, setPixKey]       = useState('')

  const { setOnline } = useCreatorSelfPresence(creatorId ?? '')

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: creator } = await supabase
        .from('creators')
        .select('id, name, total_gifts, total_earnings_petals, rating, rating_count, rank_weekly, pix_key, verified, active')
        .eq('user_id', user.id)
        .single()

      if (!creator) { router.push('/feed'); return }
      if (!creator.verified) { router.push('/criadora/verificacao'); return }

      setCreatorId(creator.id)
      setUsername(creator.name ?? '')
      setPixKey(creator.pix_key ?? '')

      const today = new Date(); today.setHours(0,0,0,0)
      const { count: sessionsToday } = await supabase
        .from('chat_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', creator.id)
        .gte('started_at', today.toISOString())

      const { data: presence } = await supabase
        .from('creator_presence')
        .select('online')
        .eq('creator_id', creator.id)
        .single()

      setOnlineState(presence?.online ?? false)

      const { data: recentGifts } = await supabase
        .from('gifts')
        .select('gift_emoji, from_user_id, petals_spent, created_at')
        .eq('to_creator_id', creator.id)
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: userData } = await supabase
        .from('users')
        .select('balance_petals')
        .eq('id', user.id)
        .single()

      setStats({
        balance:              userData?.balance_petals ?? 0,
        totalGifts:           creator.total_gifts,
        totalEarningsPetals:  creator.total_earnings_petals,
        rating:               creator.rating,
        ratingCount:          creator.rating_count,
        rankWeekly:           creator.rank_weekly,
        sessionsToday:        sessionsToday ?? 0,
        recentGifts:          recentGifts ?? [],
      })

      setLoading(false)
    }
    load()
  }, [])

  const toggleOnline = async (v: boolean) => {
    setOnlineState(v)
    await setOnline(v)
  }

  const handleSaque = async () => {
    alert('Saque solicitado! Processamento em até 1h via Pix.')
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#ff4d7d]/30 border-t-[#ff4d7d] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-white text-lg font-medium">Meu painel</h1>
          <p className="text-white/30 text-xs mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          onClick={() => toggleOnline(!online)}
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 border transition-colors ${
            online
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-white/5 border-white/10 text-white/30'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`} />
          <span className="text-xs font-medium">{online ? 'Online' : 'Offline'}</span>
        </button>
      </div>

      {/* Botão Live */}
      <div className="px-4 mb-3">
        <button
          onClick={() => router.push(`/live/${username}`)}
          className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2"
        >
          🔴 Iniciar Live
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mb-4">
        {(['overview', 'upload', 'saque'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
              tab === t ? 'bg-[#ff4d7d] text-white' : 'bg-[#161616] text-white/40'
            }`}
          >
            {t === 'overview' ? '📊 Visão geral' : t === 'upload' ? '📸 Nova foto' : '💸 Saque'}
          </button>
        ))}
      </div>

      {tab === 'overview' && stats && (
        <div className="px-4 flex flex-col gap-3 pb-24">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Saldo disponível', value: `R$ ${(stats.balance * 0.035).toFixed(2)}`, sub: `${stats.balance} 🌸`, color: 'text-yellow-400' },
              { label: 'Sessões hoje',      value: stats.sessionsToday,   sub: 'chats realizados',    color: 'text-[#ff4d7d]' },
              { label: 'Presentes totais',  value: stats.totalGifts,      sub: 'desde o início',      color: 'text-white' },
              { label: 'Avaliação',         value: stats.rating.toFixed(2), sub: `${stats.ratingCount} avaliações`, color: 'text-yellow-400' },
            ].map(m => (
              <div key={m.label} className="bg-[#111] rounded-xl p-4 border border-white/5">
                <div className="text-white/30 text-[10px] mb-1">{m.label}</div>
                <div className={`text-xl font-medium ${m.color}`}>{m.value}</div>
                <div className="text-white/25 text-[10px] mt-1">{m.sub}</div>
              </div>
            ))}
          </div>

          {stats.rankWeekly && (
            <div className="bg-[#1a0d00] border border-yellow-400/20 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <div className="text-yellow-400 text-sm font-medium">#{stats.rankWeekly} no ranking semanal</div>
                <div className="text-white/30 text-xs">baseado em presentes recebidos esta semana</div>
              </div>
            </div>
          )}

          <div className="bg-[#111] rounded-xl border border-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5">
              <span className="text-white text-xs font-medium">Presentes recentes</span>
            </div>
            {stats.recentGifts.length === 0 ? (
              <div className="px-4 py-6 text-white/25 text-xs text-center">Nenhum presente ainda</div>
            ) : (
              stats.recentGifts.map((g, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0">
                  <span className="text-xl">{g.gift_emoji}</span>
                  <div className="flex-1">
                    <div className="text-white/60 text-xs">Presente recebido</div>
                    <div className="text-white/25 text-[10px]">
                      {new Date(g.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-green-400 text-xs font-medium">+{Math.floor(g.petals_spent * 0.7)} 🌸</div>
                </div>
              ))
            )}
          </div>

          <div className="bg-[#111] rounded-xl border border-white/5 p-4">
            <div className="text-white text-xs font-medium mb-3">✨ Dicas para você</div>
            {[
              { icon: '🟢', tip: 'Fique online entre 19h e 23h — horário de maior demanda' },
              { icon: '📸', tip: 'Adicione pelo menos 5 fotos ao álbum para atrair mais usuários' },
              { icon: '🎁', tip: 'Criadoras com presente de boas-vindas ganham 2x mais' },
            ].map((d, i) => (
              <div key={i} className="flex gap-3 mb-2 last:mb-0">
                <span className="text-sm mt-0.5 flex-shrink-0">{d.icon}</span>
                <span className="text-white/45 text-xs leading-relaxed">{d.tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'upload' && (
        <div className="px-4 pb-24">
          <p className="text-white/30 text-xs mb-4 leading-relaxed">
            Fotos gratuitas aparecem para todos. Fotos pagas são desbloqueadas por pétalas — você recebe 70% do valor.
          </p>
          <PhotoUploader onUploaded={(photo) => { console.log('Foto publicada:', photo.photo_id) }} />
        </div>
      )}

      {tab === 'saque' && stats && (
        <div className="px-4 pb-24 flex flex-col gap-4">
          <div className="bg-[#111] rounded-xl p-5 border border-white/5 text-center">
            <div className="text-white/30 text-xs mb-2">Saldo para saque (70% dos ganhos)</div>
            <div className="text-yellow-400 text-3xl font-medium mb-1">
              R$ {(stats.balance * 0.035).toFixed(2)}
            </div>
            <div className="text-white/25 text-xs">{stats.balance} pétalas · R$ 0,035 por pétala</div>
          </div>

          <div className="bg-[#111] rounded-xl p-4 border border-white/5">
            <div className="text-white/30 text-[10px] uppercase tracking-wider mb-3">Chave Pix para recebimento</div>
            <input
              value={pixKey}
              onChange={e => setPixKey(e.target.value)}
              placeholder="seu@email.com ou CPF"
              className="w-full bg-[#0d0d0d] border border-white/8 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#ff4d7d]/40"
            />
          </div>

          <div className="bg-[#0e1a0e] border border-green-500/20 rounded-xl p-4 flex items-start gap-3">
            <span className="text-lg mt-0.5">ℹ️</span>
            <p className="text-green-400/70 text-xs leading-relaxed">
              Saques são processados toda sexta-feira até as 18h. Valor mínimo: R$ 20,00. Processamento em até 1h via Pix.
            </p>
          </div>

          <button
            onClick={handleSaque}
            disabled={stats.balance < 572}
            className="w-full bg-[#ff4d7d] text-white rounded-xl py-4 text-sm font-medium disabled:opacity-40"
          >
            Solicitar saque — R$ {(stats.balance * 0.035).toFixed(2)}
          </button>
        </div>
      )}

    </div>
  )
}